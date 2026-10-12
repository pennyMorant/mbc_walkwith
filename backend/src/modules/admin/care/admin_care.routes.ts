import {
  careFollowUpCreateRequestSchema,
  careRequestListQuerySchema,
  careRequestUpdateRequestSchema,
  type AdminPermission,
  type CareFollowUp,
  type CareRequestAdmin
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { CareService } from "../../care/care.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminCareRoutes(
  app: FastifyInstance,
  service: CareService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/care-assignees",
    { preHandler: permissionPreHandler("care:read") },
    async (request) => {
      const assignees = await service.listAssignees();
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "care.assignee.list",
        resourceType: "care_assignee",
        resourceId: "list",
        afterJson: { count: assignees.length }
      });
      return ok({ items: assignees });
    }
  );

  app.get(
    "/v1/admin/care-requests",
    { preHandler: permissionPreHandler("care:read") },
    async (request) => {
      const query = careRequestListQuerySchema.parse(request.query);
      const careRequests = await service.listForAdmin(query, request.adminUser!);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "care.request.list",
        resourceType: "care_request",
        resourceId: "list",
        afterJson: careRequestListAuditSnapshot(query, careRequests.length)
      });
      return ok({
        items: careRequests
      });
    }
  );

  app.patch(
    "/v1/admin/care-requests/:careRequestId",
    { preHandler: permissionPreHandler("care:manage") },
    async (request) => {
      const params = careParamsSchema.parse(request.params);
      const body = careRequestUpdateRequestSchema.parse(request.body ?? {});
      const result = await service.updateForAdmin(
        params.careRequestId,
        body,
        request.adminUser!
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "care.request.update",
        resourceType: "care_request",
        resourceId: result.after.id,
        beforeJson: careRequestAuditSnapshot(result.before),
        afterJson: careRequestAuditSnapshot(result.after)
      });
      return ok(result.after);
    }
  );

  app.get(
    "/v1/admin/care-requests/:careRequestId/follow-ups",
    { preHandler: permissionPreHandler("care:read") },
    async (request) => {
      const params = careParamsSchema.parse(request.params);
      const followUps = await service.listFollowUpsForAdmin(
        params.careRequestId,
        request.adminUser!
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "care.follow_up.list",
        resourceType: "care_request",
        resourceId: params.careRequestId,
        afterJson: {
          careRequestId: params.careRequestId,
          count: followUps.length
        }
      });
      return ok({
        items: followUps
      });
    }
  );

  app.post(
    "/v1/admin/care-requests/:careRequestId/follow-ups",
    { preHandler: permissionPreHandler("care:manage") },
    async (request) => {
      const params = careParamsSchema.parse(request.params);
      const body = careFollowUpCreateRequestSchema.parse(request.body);
      const result = await service.createFollowUpForAdmin(
        params.careRequestId,
        request.adminUser!,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "care.follow_up.create",
        resourceType: "care_follow_up",
        resourceId: result.followUp.id,
        afterJson: followUpAuditSnapshot(result.followUp)
      });
      if (result.before.status !== result.after.status) {
        await auditService.record({
          actorUserId: request.adminUser?.id ?? null,
          action: "care.request.follow_up_advance",
          resourceType: "care_request",
          resourceId: result.after.id,
          beforeJson: careRequestAuditSnapshot(result.before),
          afterJson: careRequestAuditSnapshot(result.after)
        });
      }
      return ok(result.followUp);
    }
  );
}

const careParamsSchema = z.object({
  careRequestId: z.string()
});

function careRequestAuditSnapshot(request: CareRequestAdmin) {
  return {
    id: request.id,
    userId: request.userId,
    status: request.status,
    privacyLevel: request.privacyLevel,
    assigneeAdminUserId: request.assigneeAdminUserId,
    hasAssigneeName: request.assigneeName.trim().length > 0,
    nextFollowUpAt: request.nextFollowUpAt,
    version: request.version,
    hasInternalNote: request.internalNote.trim().length > 0,
    internalNoteLength: request.internalNote.length
  };
}

function careRequestListAuditSnapshot(
  query: ReturnType<typeof careRequestListQuerySchema.parse>,
  count: number
) {
  return {
    status: query.status,
    hasUserId: Boolean(query.userId),
    hasQuery: Boolean(query.query?.trim()),
    queryLength: query.query?.length ?? 0,
    limit: query.limit,
    count
  };
}

function followUpAuditSnapshot(followUp: CareFollowUp) {
  return {
    id: followUp.id,
    careRequestId: followUp.careRequestId,
    status: followUp.status,
    authorAdminUserId: followUp.authorAdminUserId,
    hasNote: followUp.note.trim().length > 0
  };
}
