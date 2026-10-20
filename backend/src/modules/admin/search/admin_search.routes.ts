import {
  adminSearchQuerySchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import type { AdminSearchService } from "./admin_search.service.js";

type PermissionPreHandler = (
  permission: AdminPermission
) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export async function registerAdminSearchRoutes(
  app: FastifyInstance,
  searchService: AdminSearchService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/search",
    { preHandler: permissionPreHandler("dashboard:read") },
    async (request) => {
      const query = adminSearchQuerySchema.parse(request.query);
      return ok(await searchService.search(request.adminUser!.role, query.query));
    }
  );
}
