import type { AdminPermission } from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import type { MinistryAnalyticsService } from "./ministry_analytics.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminDashboardRoutes(
  app: FastifyInstance,
  analyticsService: MinistryAnalyticsService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/dashboard",
    { preHandler: permissionPreHandler("dashboard:read") },
    async (request) => ok(await analyticsService.dashboard(request.adminUser!.role))
  );
}
