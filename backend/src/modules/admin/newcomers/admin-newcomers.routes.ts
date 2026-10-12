import {
  newcomerFollowUpCreateRequestSchema,
  newcomerListQuerySchema,
  newcomerUpdateRequestSchema,
  type AdminPermission,
  type NewcomerFollowUp
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import {
  newcomerAuditSnapshot
} from "../../newcomers/newcomer.routes.js";
import type { NewcomerService } from "../../newcomers/newcomer.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminNewcomerRoutes(
  app: FastifyInstance,
  service: NewcomerService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/newcomers",
    { preHandler: permissionPreHandler("newcomers:read") },
    async (request) => {
      const query = newcomerListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.get(
    "/v1/admin/newcomers/:newcomerId",
    { preHandler: permissionPreHandler("newcomers:read") },
    async (request) => {
      const params = newcomerParamsSchema.parse(request.params);
      return ok(await service.getById(params.newcomerId));
    }
  );

  app.patch(
    "/v1/admin/newcomers/:newcomerId",
    { preHandler: permissionPreHandler("newcomers:manage") },
    async (request) => {
      const params = newcomerParamsSchema.parse(request.params);
      const body = newcomerUpdateRequestSchema.parse(request.body ?? {});
      const before = await service.getById(params.newcomerId);
      const newcomer = await service.update(params.newcomerId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "newcomer.update",
        resourceType: "newcomer",
        resourceId: newcomer.id,
        beforeJson: newcomerAuditSnapshot(before),
        afterJson: newcomerAuditSnapshot(newcomer)
      });
      return ok(newcomer);
    }
  );

  app.get(
    "/v1/admin/newcomers/:newcomerId/follow-ups",
    { preHandler: permissionPreHandler("newcomers:read") },
    async (request) => {
      const params = newcomerParamsSchema.parse(request.params);
      return ok({ items: await service.listFollowUps(params.newcomerId) });
    }
  );

  app.post(
    "/v1/admin/newcomers/:newcomerId/follow-ups",
    { preHandler: permissionPreHandler("newcomers:manage") },
    async (request) => {
      const params = newcomerParamsSchema.parse(request.params);
      const body = newcomerFollowUpCreateRequestSchema.parse(request.body ?? {});
      const followUp = await service.createFollowUp(
        params.newcomerId,
        request.adminUser
          ? { id: request.adminUser.id, name: request.adminUser.name }
          : null,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "newcomer.follow_up.create",
        resourceType: "newcomer_follow_up",
        resourceId: followUp.id,
        afterJson: followUpAuditSnapshot(followUp)
      });
      return ok(followUp);
    }
  );
}

const newcomerParamsSchema = z.object({
  newcomerId: z.string()
});

function followUpAuditSnapshot(followUp: NewcomerFollowUp) {
  return {
    id: followUp.id,
    newcomerId: followUp.newcomerId,
    status: followUp.status,
    hasNote: followUp.note.trim().length > 0
  };
}
