import {
  adminPrayerRequestApproveRequestSchema,
  adminPrayerRequestListQuerySchema,
  adminPrayerRequestUpdateRequestSchema,
  type AdminPermission,
  type AdminPrayerRequest
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { NotificationService } from "../../notifications/notification.service.js";
import { prayerRequestNotFound } from "../../prayer/prayer-errors.js";
import type { PrayerService } from "../../prayer/prayer.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminPrayerRequestRoutes(
  app: FastifyInstance,
  service: PrayerService,
  notificationService: NotificationService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/prayer-requests",
    { preHandler: permissionPreHandler("prayer:read") },
    async (request) => {
      const query = adminPrayerRequestListQuerySchema.parse(request.query);
      const requests = await service.listAdmin(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.list",
        resourceType: "prayer_request",
        resourceId: "list",
        afterJson: listAuditSnapshot(query, requests.length)
      });
      return ok({ items: requests });
    }
  );

  app.patch(
    "/v1/admin/prayer-requests/:requestId",
    { preHandler: permissionPreHandler("prayer:moderate") },
    async (request, reply) => {
      const params = requestParamsSchema.parse(request.params);
      const body = adminPrayerRequestUpdateRequestSchema.parse(request.body);
      const before = await service.getById(params.requestId);
      if (!before) {
        throw prayerRequestNotFound(params.requestId);
      }
      const prayerRequest = await service.moderate(
        params.requestId,
        body,
        request.adminUser?.id ?? null
      );
      if (!prayerRequest) {
        throw prayerRequestNotFound(params.requestId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.moderate",
        resourceType: "prayer_request",
        resourceId: prayerRequest.id,
        beforeJson: auditSnapshot(before),
        afterJson: auditSnapshot(prayerRequest)
      });
      return ok(prayerRequest);
    }
  );

  app.post(
    "/v1/admin/prayer-requests/:requestId/approve",
    { preHandler: permissionPreHandler("prayer:moderate") },
    async (request, reply) => {
      const params = requestParamsSchema.parse(request.params);
      const body = adminPrayerRequestApproveRequestSchema.parse(
        request.body ?? {}
      );
      const { notifyApp, ...approvalInput } = body;
      const before = await service.getById(params.requestId);
      if (!before) {
        throw prayerRequestNotFound(params.requestId);
      }
      const prayerRequest = await service.approve(
        params.requestId,
        approvalInput,
        request.adminUser?.id ?? null
      );
      if (!prayerRequest) {
        throw prayerRequestNotFound(params.requestId);
      }
      const notificationAudit = await deliverPrayerUpdateNotification({
        request,
        notificationService,
        prayerRequest,
        notifyApp
      });
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.approve",
        resourceType: "prayer_request",
        resourceId: prayerRequest.id,
        beforeJson: auditSnapshot(before),
        afterJson: {
          ...auditSnapshot(prayerRequest),
          notification: notificationAudit
        }
      });
      return ok(prayerRequest);
    }
  );

  app.post(
    "/v1/admin/prayer-requests/:requestId/hide",
    { preHandler: permissionPreHandler("prayer:moderate") },
    async (request, reply) => {
      const params = requestParamsSchema.parse(request.params);
      const body = hideRequestSchema.parse(request.body);
      const before = await service.getById(params.requestId);
      if (!before) {
        throw prayerRequestNotFound(params.requestId);
      }
      const prayerRequest = await service.hide(
        params.requestId,
        body.moderationNote,
        request.adminUser?.id ?? null
      );
      if (!prayerRequest) {
        throw prayerRequestNotFound(params.requestId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.hide",
        resourceType: "prayer_request",
        resourceId: prayerRequest.id,
        beforeJson: auditSnapshot(before),
        afterJson: auditSnapshot(prayerRequest)
      });
      return ok(prayerRequest);
    }
  );

  app.post(
    "/v1/admin/prayer-requests/:requestId/archive",
    { preHandler: permissionPreHandler("prayer:moderate") },
    async (request, reply) => {
      const params = requestParamsSchema.parse(request.params);
      const before = await service.getById(params.requestId);
      if (!before) {
        throw prayerRequestNotFound(params.requestId);
      }
      const prayerRequest = await service.archive(
        params.requestId,
        request.adminUser?.id ?? null
      );
      if (!prayerRequest) {
        throw prayerRequestNotFound(params.requestId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.archive",
        resourceType: "prayer_request",
        resourceId: prayerRequest.id,
        beforeJson: auditSnapshot(before),
        afterJson: auditSnapshot(prayerRequest)
      });
      return ok(prayerRequest);
    }
  );

  app.delete(
    "/v1/admin/prayer-requests/:requestId",
    { preHandler: permissionPreHandler("prayer:moderate") },
    async (request, reply) => {
      const params = requestParamsSchema.parse(request.params);
      const before = await service.getById(params.requestId);
      if (!before) {
        throw prayerRequestNotFound(params.requestId);
      }
      const deleted = await service.delete(params.requestId);
      if (!deleted) {
        throw prayerRequestNotFound(params.requestId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "prayer_request.delete",
        resourceType: "prayer_request",
        resourceId: params.requestId,
        beforeJson: auditSnapshot(before)
      });
      return ok({ deleted: true });
    }
  );
}

const requestParamsSchema = z.object({
  requestId: z.string()
});

const hideRequestSchema = z.object({
  moderationNote: z.string().trim().max(1000).default("")
});

function auditSnapshot(request: AdminPrayerRequest) {
  return {
    id: request.id,
    visibility: request.visibility,
    status: request.status,
    groupId: request.groupId,
    hasBody: request.body.length > 0,
    bodyLength: request.body.length,
    hasSubmitterName: request.submitterName.trim().length > 0,
    submitterNameLength: request.submitterName.length,
    hasSubmitterEmail: Boolean(request.submitterEmail),
    hasModerationNote: request.moderationNote.trim().length > 0,
    moderationNoteLength: request.moderationNote.length,
    moderatedAt: request.moderatedAt,
    moderatedByAdminUserId: request.moderatedByAdminUserId,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt
  };
}

function listAuditSnapshot(
  query: ReturnType<typeof adminPrayerRequestListQuerySchema.parse>,
  count: number
) {
  return {
    limit: query.limit,
    status: query.status,
    visibility: query.visibility,
    groupId: query.groupId,
    hasQuery: Boolean(query.query?.trim()),
    queryLength: query.query?.length ?? 0,
    count
  };
}

async function deliverPrayerUpdateNotification(input: {
  request: FastifyRequest;
  notificationService: NotificationService;
  prayerRequest: AdminPrayerRequest;
  notifyApp: boolean;
}) {
  if (!input.notifyApp) {
    return { requested: false };
  }
  const prayerRequest = input.prayerRequest;
  if (!isBroadcastPrayerRequest(prayerRequest)) {
    return {
      requested: false,
      reason: "visibility_not_broadcastable",
      visibility: prayerRequest.visibility
    };
  }
  try {
    const result = await input.notificationService.sendPrayerUpdatePublished(
      prayerRequest
    );
    return {
      requested: true,
      type: "prayer_update_published",
      status: result.failed > 0 ? "retrying" : "sent",
      result
    };
  } catch (error) {
    input.request.log.warn(
      { err: error, prayerRequestId: input.prayerRequest.id },
      "Prayer update push notification failed after approval."
    );
    return {
      requested: true,
      type: "prayer_update_published",
      status: "failed",
      error:
        error instanceof Error
          ? { message: error.message }
          : { message: "Notification delivery failed." }
    };
  }
}

function isBroadcastPrayerRequest(
  prayerRequest: AdminPrayerRequest
): prayerRequest is AdminPrayerRequest & {
  visibility: "public" | "members";
} {
  return (
    prayerRequest.visibility === "public" ||
    prayerRequest.visibility === "members"
  );
}
