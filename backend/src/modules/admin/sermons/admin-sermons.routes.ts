import {
  type AdminPermission,
  createLocalSermonDraftRequestSchema,
  localSermonPackageRequestSchema,
  sermonListQuerySchema,
  updateSermonRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { listMeta, ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { roleHasPermission } from "../auth/admin-rbac.js";
import type { NotificationService } from "../../notifications/notification.service.js";
import {
  publishPermissionDenied,
  sermonNotFound
} from "../../sermons/sermon-errors.js";
import type { SermonService } from "../../sermons/sermon.service.js";
import type { SermonAudioCleanupService } from "../../sermons/sermon_audio_cleanup.service.js";
import { registerAdminSermonAudioRoutes } from "./admin_sermon_audio.routes.js";
import {
  assertCanChangePublishedSermon,
  notifySermonPublished,
  registerAdminSermonWorkflowRoutes,
  sermonMutationContext
} from "./admin_sermon_workflow.routes.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminSermonRoutes(
  app: FastifyInstance,
  service: SermonService,
  audioCleanupService: SermonAudioCleanupService,
  notificationService: NotificationService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  await registerAdminSermonAudioRoutes(
    app,
    service,
    audioCleanupService,
    auditService,
    permissionPreHandler
  );
  await registerAdminSermonWorkflowRoutes(
    app,
    service,
    notificationService,
    auditService,
    permissionPreHandler
  );

  app.get(
    "/v1/admin/sermons",
    { preHandler: permissionPreHandler("sermons:read") },
    async (request) => {
      const query = sermonListQuerySchema.parse(request.query);
      const result = await service.list(query);
      return ok(
        { items: result.sermons, nextCursor: result.nextCursor },
        listMeta(query.limit, result.nextCursor)
      );
    }
  );

  app.get(
    "/v1/admin/sermons/:sermonId",
    { preHandler: permissionPreHandler("sermons:read") },
    async (request, reply) => {
      const params = z.object({ sermonId: z.string() }).parse(request.params);
      const sermon = await service.getById(params.sermonId);
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }
      return ok(sermon);
    }
  );

  app.post(
    "/v1/admin/sermons/local-drafts",
    { preHandler: permissionPreHandler("sermons:create") },
    async (request) => {
      const body = createLocalSermonDraftRequestSchema.parse(request.body);
      const sermon = await service.createDraft(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.create_local_draft",
        resourceType: "sermon",
        resourceId: sermon.id,
        afterJson: sermon
      });
      return ok(sermon);
    }
  );

  app.patch(
    "/v1/admin/sermons/:sermonId",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request, reply) => {
      const params = z.object({ sermonId: z.string() }).parse(request.params);
      const body = updateSermonRequestSchema.parse(request.body);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      if (
        body.status === "published" &&
        !roleHasPermission(request.adminUser!.role, "sermons:publish")
      ) {
        throw publishPermissionDenied(params.sermonId);
      }
      const sermon = await service.update(
        params.sermonId,
        body,
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
        action:
          before.status !== "published" && sermon.status === "published"
            ? "sermon.publish"
            : "sermon.update",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: notificationAudit.requested
          ? { sermon, notification: notificationAudit }
          : sermon
      });
      return ok(sermon);
    }
  );

  app.post(
    "/v1/admin/sermons/:sermonId/local-package",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request, reply) => {
      const params = z.object({ sermonId: z.string() }).parse(request.params);
      const body = localSermonPackageRequestSchema.parse(request.body);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      const sermon = await service.importLocalPackage(
        params.sermonId,
        body,
        sermonMutationContext(request)
      );
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.import_local_package",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: sermon
      });
      return ok(sermon);
    }
  );

}
