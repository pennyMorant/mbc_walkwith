import {
  auditLogListQuerySchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { listMeta, ok } from "../../../shared/http/api-response.js";
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
      const result = await auditService.list(query);
      return ok(
        { items: result.logs, nextCursor: result.nextCursor },
        listMeta(query.limit, result.nextCursor)
      );
    }
  );
}
