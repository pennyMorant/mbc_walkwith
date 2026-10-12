import type { FastifyReply, FastifyRequest } from "fastify";

import type { MemberAuthService } from "./member-auth.service.js";
import { memberAuthRequired } from "./member-auth-errors.js";

export function requireMember(authService: MemberAuthService) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) {
      throw memberAuthRequired();
    }
    const verified = await authService.verifyAccessToken(token);
    request.member = verified.member;
    request.memberAccessToken = {
      tokenId: verified.tokenId,
      expiresAt: verified.expiresAt
    };
  };
}

export function optionalMember(authService: MemberAuthService) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) {
      return;
    }
    try {
      const verified = await authService.verifyAccessToken(token);
      request.member = verified.member;
      request.memberAccessToken = {
        tokenId: verified.tokenId,
        expiresAt: verified.expiresAt
      };
    } catch (error) {
      // Public endpoints must remain available after a locally cached session
      // expires. Required-member routes still use requireMember and return 401.
      if (isUnauthenticatedMemberToken(error)) {
        return;
      }
      throw error;
    }
  };
}

function isUnauthenticatedMemberToken(
  error: unknown
): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 401
  );
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (typeof header !== "string") {
    return null;
  }
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}
