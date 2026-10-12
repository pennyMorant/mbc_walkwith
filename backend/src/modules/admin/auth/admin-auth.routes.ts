import {
  adminChangePasswordRequestSchema,
  adminLoginRequestSchema,
  adminLogoutRequestSchema,
  adminRefreshTokenRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import {
  permissionsForUser,
  type AdminAuthService
} from "./admin-auth.service.js";
import { adminRefreshTokenRequired } from "./admin-auth-errors.js";
import { requireAdmin } from "./admin-auth.middleware.js";

const refreshCookieName = "mbc_admin_refresh_token";

export async function registerAdminAuthRoutes(
  app: FastifyInstance,
  authService: AdminAuthService
) {
  const adminPreHandler = requireAdmin(authService);

  app.post("/v1/admin/auth/login", async (request, reply) => {
    const body = adminLoginRequestSchema.parse(request.body);
    const session = await authService.login(body, tokenContext(request));
    setRefreshCookie(reply, session.refreshToken, authService.isProduction);
    return ok(session);
  });

  app.post("/v1/admin/auth/refresh", async (request, reply) => {
    const body = adminRefreshTokenRequestSchema.partial().parse(request.body ?? {});
    const refreshToken = body.refreshToken ?? readRefreshCookie(request);
    if (!refreshToken) {
      throw adminRefreshTokenRequired();
    }
    const session = await authService.refresh(refreshToken, tokenContext(request));
    setRefreshCookie(reply, session.refreshToken, authService.isProduction);
    return ok(session);
  });

  app.post("/v1/admin/auth/logout", async (request, reply) => {
    const body = adminLogoutRequestSchema.parse(request.body ?? {});
    await authService.logout(body.refreshToken ?? readRefreshCookie(request));
    clearRefreshCookie(reply, authService.isProduction);

    const header = request.headers.authorization;
    const [scheme, rawToken] =
      typeof header === "string" ? header.split(" ") : [];
    const token =
      scheme?.toLowerCase() === "bearer" && rawToken ? rawToken : null;
    if (token) {
      try {
        const verified = await authService.verifyAccessToken(token);
        await authService.revokeAccessToken(
          verified.tokenId,
          verified.user.id,
          verified.expiresAt,
          "logout"
        );
      } catch {
        // Refresh token revocation above is the important logout action.
      }
    }

    return ok({ accepted: true });
  });

  app.get(
    "/v1/admin/auth/me",
    { preHandler: adminPreHandler },
    async (request) => {
      return ok({
        user: request.adminUser!,
        permissions: permissionsForUser(request.adminUser!)
      });
    }
  );

  app.post(
    "/v1/admin/auth/change-password",
    { preHandler: adminPreHandler },
    async (request, reply) => {
      const body = adminChangePasswordRequestSchema.parse(request.body);
      const user = await authService.changePassword(
        request.adminUser!.id,
        body.currentPassword,
        body.newPassword
      );
      clearRefreshCookie(reply, authService.isProduction);
      return ok({ user, permissions: permissionsForUser(user) });
    }
  );
}

function tokenContext(request: FastifyRequest) {
  return {
    ipAddress: request.ip ?? null,
    userAgent:
      typeof request.headers["user-agent"] === "string"
        ? request.headers["user-agent"]
        : null
  };
}

function setRefreshCookie(
  reply: FastifyReply,
  refreshToken: string,
  secure: boolean
) {
  reply.header(
    "set-cookie",
    serializeCookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      maxAgeSeconds: 60 * 60 * 24 * 30,
      sameSite: "Lax",
      secure,
      path: "/v1/admin/auth"
    })
  );
}

function clearRefreshCookie(reply: FastifyReply, secure: boolean) {
  reply.header(
    "set-cookie",
    serializeCookie(refreshCookieName, "", {
      httpOnly: true,
      maxAgeSeconds: 0,
      sameSite: "Lax",
      secure,
      path: "/v1/admin/auth"
    })
  );
}

function readRefreshCookie(request: FastifyRequest): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const match = cookies.find((cookie) =>
    cookie.startsWith(`${refreshCookieName}=`)
  );
  if (!match) {
    return undefined;
  }
  return decodeURIComponent(match.slice(refreshCookieName.length + 1));
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    maxAgeSeconds: number;
    sameSite: "Lax" | "Strict" | "None";
    secure: boolean;
    path: string;
  }
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAgeSeconds}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`
  ];
  if (options.httpOnly) {
    parts.push("HttpOnly");
  }
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
