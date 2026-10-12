import type { AdminPermission } from "@mbc/api-contracts";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { AdminAuthService } from "./admin-auth.service.js";
import { roleHasPermission } from "./admin-rbac.js";
import {
  adminAuthRequired,
  adminPermissionDenied
} from "./admin-auth-errors.js";

export function requireAdmin(authService: AdminAuthService) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = bearerToken(header);
    if (!token) {
      throw adminAuthRequired();
    }

    const verified = await authService.verifyAccessToken(token);
    request.adminUser = verified.user;
    request.adminAccessToken = {
      tokenId: verified.tokenId,
      expiresAt: verified.expiresAt
    };
  };
}

export function requirePermission(
  authService: AdminAuthService,
  permission: AdminPermission
) {
  const adminPreHandler = requireAdmin(authService);

  return async (request: FastifyRequest, reply: FastifyReply) => {
    await adminPreHandler(request, reply);
    const user = request.adminUser;
    if (!user || !roleHasPermission(user.role, permission)) {
      throw adminPermissionDenied(permission);
    }
  };
}

function bearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}
