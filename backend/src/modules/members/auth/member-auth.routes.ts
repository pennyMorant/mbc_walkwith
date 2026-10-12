import {
  memberAuthLoginRequestSchema,
  memberFirebaseAuthRequestSchema,
  memberAuthRegisterRequestSchema,
  memberAuthVerifyCodeRequestSchema,
  memberPasswordResetConfirmRequestSchema,
  memberPasswordResetRequestSchema,
  memberSelfUpdateRequestSchema,
  type MemberProfile
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { memberNotFound } from "../member-errors.js";
import type { MemberService } from "../member.service.js";
import type { MemberAuthService } from "./member-auth.service.js";
import { requireMember } from "./member-auth.middleware.js";
import {
  enforceMemberAuthRateLimit,
  type MemberAuthRateLimitAction,
  type MemberAuthRateLimiter
} from "./member_auth_rate_limiter.js";

export async function registerMemberAuthRoutes(
  app: FastifyInstance,
  authService: MemberAuthService,
  memberService: MemberService,
  auditService: AuditService,
  rateLimiter: MemberAuthRateLimiter
) {
  const memberPreHandler = requireMember(authService);

  app.get("/v1/member/auth/registration-settings", async () => {
    return ok(await authService.getRegistrationSettings());
  });

  app.post("/v1/member/auth/register", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "register");
    const body = memberAuthRegisterRequestSchema.parse(request.body);
    return ok(await authService.register(body, tokenContext(request)));
  });

  app.post("/v1/member/auth/login", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "login");
    const body = memberAuthLoginRequestSchema.parse(request.body);
    return ok(await authService.login(body, tokenContext(request)));
  });

  app.post("/v1/member/auth/firebase", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "firebase");
    const body = memberFirebaseAuthRequestSchema.parse(request.body);
    return ok(await authService.signInWithFirebase(body, tokenContext(request)));
  });

  app.post("/v1/member/auth/password-reset/request", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "password_reset_request");
    const body = memberPasswordResetRequestSchema.parse(request.body);
    return ok(await authService.requestPasswordReset(body, tokenContext(request)));
  });

  app.post("/v1/member/auth/password-reset/confirm", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "password_reset_confirm");
    const body = memberPasswordResetConfirmRequestSchema.parse(request.body);
    return ok(await authService.confirmPasswordReset(body));
  });

  app.post("/v1/member/auth/verify-code", async (request, reply) => {
    enforceRateLimit(request, reply, rateLimiter, "verify_code");
    const body = memberAuthVerifyCodeRequestSchema.parse(request.body);
    return ok(await authService.verifyCode(body, tokenContext(request)));
  });

  app.get(
    "/v1/member/auth/me",
    { preHandler: memberPreHandler },
    async (request) => ok({ member: request.member! })
  );

  app.patch(
    "/v1/member/profile",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = memberSelfUpdateRequestSchema.parse(request.body ?? {});
      const before = request.member!;
      const member = await memberService.updateSelf(before.id, body);
      if (!member) {
        throw memberNotFound(before.id);
      }
      await auditService.record({
        actorUserId: before.id,
        action: "member.profile.self_update",
        resourceType: "member",
        resourceId: member.id,
        beforeJson: profileAuditSnapshot(before),
        afterJson: profileAuditSnapshot(member)
      });
      return ok({ member });
    }
  );

  app.post(
    "/v1/member/auth/logout",
    { preHandler: memberPreHandler },
    async (request) => {
      await authService.logout(request.memberAccessToken!.tokenId);
      return ok({ accepted: true });
    }
  );
}

function enforceRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  rateLimiter: MemberAuthRateLimiter,
  action: MemberAuthRateLimitAction
) {
  enforceMemberAuthRateLimit(
    reply,
    rateLimiter.check(action, request.ip ?? "unknown"),
    action
  );
}

function profileAuditSnapshot(member: MemberProfile) {
  return {
    id: member.id,
    status: member.status,
    roles: member.roles,
    appLocale: member.appLocale,
    fellowshipGroupId: member.fellowshipGroupId,
    hasPhone: Boolean(member.phone),
    hasAddress: Boolean(member.address),
    hasEmergencyContact: Boolean(
      member.emergencyContactName || member.emergencyContactPhone
    ),
    hasFaithStartYear: member.faithStartYear !== null,
    hasBaptizedYear: member.baptizedYear !== null,
    hasJoinedChurchAt: member.joinedChurchAt !== null
  };
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
