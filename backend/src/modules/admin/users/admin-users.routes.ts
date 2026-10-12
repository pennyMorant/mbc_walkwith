import {
  type AdminPermission,
  adminCreateUserRequestSchema,
  adminResetPasswordRequestSchema,
  adminUpdateUserRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AdminAuthService } from "../auth/admin-auth.service.js";
import { adminUserNotFound } from "./admin-user-errors.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminUserRoutes(
  app: FastifyInstance,
  authService: AdminAuthService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/users",
    { preHandler: permissionPreHandler("users:read") },
    async () => {
      return ok(await authService.listUsers());
    }
  );

  app.post(
    "/v1/admin/users",
    { preHandler: permissionPreHandler("users:manage") },
    async (request) => {
      const body = adminCreateUserRequestSchema.parse(request.body);
      return ok(await authService.createUser(body));
    }
  );

  app.patch(
    "/v1/admin/users/:adminUserId",
    { preHandler: permissionPreHandler("users:manage") },
    async (request, reply) => {
      const params = adminUserParamsSchema.parse(request.params);
      const body = adminUpdateUserRequestSchema.parse(request.body);
      const user = await authService.updateUser(params.adminUserId, body);
      if (!user) {
        throw adminUserNotFound(params.adminUserId);
      }
      return ok(user);
    }
  );

  app.post(
    "/v1/admin/users/:adminUserId/reset-password",
    { preHandler: permissionPreHandler("users:manage") },
    async (request, reply) => {
      const params = adminUserParamsSchema.parse(request.params);
      const body = adminResetPasswordRequestSchema.parse(request.body);
      const user = await authService.resetPassword(
        params.adminUserId,
        body.password
      );
      if (!user) {
        throw adminUserNotFound(params.adminUserId);
      }
      return ok(user);
    }
  );
}

const adminUserParamsSchema = z.object({
  adminUserId: z.string()
});
