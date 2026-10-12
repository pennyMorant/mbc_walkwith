import {
  auditLogListQuerySchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminAuditRoutes(
  app: FastifyInstance,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/audit-logs",
    { preHandler: permissionPreHandler("audit:read") },
    async (request) => {
      const query = auditLogListQuerySchema.parse(request.query);
      return ok({ items: await auditService.list(query) });
    }
  );
}
