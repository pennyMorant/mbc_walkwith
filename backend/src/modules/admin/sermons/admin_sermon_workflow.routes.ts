import {
  sermonRevisionHeaderSchema,
  type AdminPermission,
  type Sermon
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { NotificationService } from "../../notifications/notification.service.js";
import {
  publishPermissionDenied,
  sermonNotFound
} from "../../sermons/sermon-errors.js";
import type {
  SermonMutationContext,
  SermonService
} from "../../sermons/sermon.service.js";
import { roleHasPermission } from "../auth/admin-rbac.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminSermonWorkflowRoutes(
  app: FastifyInstance,
  service: SermonService,
  notificationService: NotificationService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.post(
    "/v1/admin/sermons/:sermonId/publish",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      if (!roleHasPermission(request.adminUser!.role, "sermons:publish")) {
        throw publishPermissionDenied(params.sermonId);
      }
      const sermon = await service.publish(
        params.sermonId,
        sermonMutationContext(request)
      );
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }
      const notificationAudit = await notifySermonPublished(
        app,
        notificationService,
        before.status,
        sermon
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.publish",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: {
          sermon,
          notification: notificationAudit
        }
      });
      return ok(sermon);
    }
  );

  app.post(
    "/v1/admin/sermons/:sermonId/submit-review",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => updateStatus(request, service, auditService, "needs_review")
  );

  app.post(
    "/v1/admin/sermons/:sermonId/return-draft",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => updateStatus(request, service, auditService, "draft")
  );

  app.post(
    "/v1/admin/sermons/:sermonId/mark-failed",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => updateStatus(request, service, auditService, "failed")
  );

  app.post(
    "/v1/admin/sermons/:sermonId/archive",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      const sermon = await service.archive(
        params.sermonId,
        sermonMutationContext(request)
      );
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.archive",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: sermon
      });
      return ok(sermon);
    }
  );

  app.delete(
    "/v1/admin/sermons/:sermonId",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      const deleted = await service.delete(
        params.sermonId,
        sermonMutationContext(request)
      );
      if (!deleted) {
        throw sermonNotFound(params.sermonId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.delete",
        resourceType: "sermon",
        resourceId: params.sermonId,
        beforeJson: before
      });
      return ok({ deleted: true });
    }
  );
}

const sermonParamsSchema = z.object({
  sermonId: z.string()
});

async function updateStatus(
  request: FastifyRequest,
  service: SermonService,
  auditService: AuditService,
  status: "needs_review" | "draft" | "failed"
) {
  const params = sermonParamsSchema.parse(request.params);
  const before = await service.getById(params.sermonId);
  if (!before) {
    throw sermonNotFound(params.sermonId);
  }
  assertCanChangePublishedSermon(request, before);
  const sermon = await service.update(
    params.sermonId,
    { status },
    sermonMutationContext(request)
  );
  if (!sermon) {
    throw sermonNotFound(params.sermonId);
  }
  await auditService.record({
    actorUserId: request.adminUser?.id ?? null,
    action: `sermon.${statusAction(status)}`,
    resourceType: "sermon",
    resourceId: sermon.id,
    beforeJson: before,
    afterJson: sermon
  });
  return ok(sermon);
}

function statusAction(status: "needs_review" | "draft" | "failed") {
  if (status === "needs_review") {
    return "submit_review";
  }
  if (status === "draft") {
    return "return_draft";
  }
  return "mark_failed";
}

export function assertCanChangePublishedSermon(
  request: FastifyRequest,
  sermon: Sermon
) {
  if (
    sermon.status === "published" &&
    !roleHasPermission(request.adminUser!.role, "sermons:publish")
  ) {
    throw publishPermissionDenied(sermon.id);
  }
}

export function sermonMutationContext(
  request: FastifyRequest
): SermonMutationContext {
  const revisionHeader = request.headers["x-sermon-revision"];
  return {
    canPublish: roleHasPermission(request.adminUser!.role, "sermons:publish"),
    expectedRevision: sermonRevisionHeaderSchema.parse(
      Array.isArray(revisionHeader) ? revisionHeader[0] : revisionHeader
    )
  };
}

export async function notifySermonPublished(
  app: FastifyInstance,
  notificationService: NotificationService,
  beforeStatus: string,
  sermon: Sermon
) {
  if (beforeStatus === "published" || sermon.status !== "published") {
    return { requested: false };
  }
  try {
    const result = await notificationService.sendSermonPublished(sermon);
    app.log.info(
      {
        sermonId: sermon.id,
        attempted: result.attempted,
        sent: result.sent,
        failed: result.failed,
        revokedTokens: result.revokedTokens
      },
      "sermon published push processed"
    );
    return {
      requested: true,
      status: result.failed > 0 ? "retrying" : "sent",
      result
    };
  } catch (error) {
    app.log.warn(
      {
        sermonId: sermon.id,
        err: error
      },
      "sermon publish push failed"
    );
    return {
      requested: true,
      status: "failed",
      error:
        error instanceof Error
          ? { message: error.message }
          : { message: "Notification delivery failed." }
    };
  }
}
