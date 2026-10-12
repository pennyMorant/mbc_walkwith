import {
  memberSharedPrayerRequestListQuerySchema,
  memberPrayerRequestListQuerySchema,
  prayerRequestCreateRequestSchema,
  prayerRequestListQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import {
  optionalMember,
  requireMember
} from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import type { PrayerService } from "./prayer.service.js";

export async function registerPrayerRoutes(
  app: FastifyInstance,
  service: PrayerService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  app.get("/v1/prayer-requests", async (request) => {
    const query = prayerRequestListQuerySchema.parse(request.query);
    const requests = await service.listVisible(query);
    return ok({ items: requests });
  });

  app.post(
    "/v1/prayer-requests",
    { preHandler: optionalMember(memberAuthService) },
    async (request) => {
      const body = prayerRequestCreateRequestSchema.parse(request.body);
      const prayerRequest = await service.create(body, request.member?.id);
      await auditService.record({
        actorUserId: request.member?.id ?? null,
        action: "prayer_request.create",
        resourceType: "prayer_request",
        resourceId: prayerRequest.id,
        afterJson: prayerCreateAuditSnapshot(prayerRequest)
      });
      return ok(publicPrayerRequest(prayerRequest));
    }
  );

  app.get(
    "/v1/member/prayer-requests",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const query = memberPrayerRequestListQuerySchema.parse(request.query);
      const requests = await service.listByAuthor(request.member!.id, query);
      return ok({ items: requests });
    }
  );

  app.get(
    "/v1/member/prayer-requests/shared",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const query = memberSharedPrayerRequestListQuerySchema.parse(request.query);
      const requests = await service.listSharedForMember(
        request.member!.fellowshipGroupId,
        query
      );
      return ok({ items: requests });
    }
  );
}

type PublicPrayerRequest = Awaited<ReturnType<PrayerService["create"]>>;

function publicPrayerRequest(prayerRequest: PublicPrayerRequest) {
  return {
    id: prayerRequest.id,
    title: prayerRequest.title,
    body: prayerRequest.body,
    visibility: prayerRequest.visibility,
    groupId: prayerRequest.groupId,
    status: prayerRequest.status,
    submitterName: prayerRequest.submitterName,
    createdAt: prayerRequest.createdAt,
    updatedAt: prayerRequest.updatedAt
  };
}

function prayerCreateAuditSnapshot(prayerRequest: PublicPrayerRequest) {
  return {
    id: prayerRequest.id,
    authorUserId: prayerRequest.authorUserId,
    visibility: prayerRequest.visibility,
    status: prayerRequest.status,
    groupId: prayerRequest.groupId,
    hasBody: prayerRequest.body.length > 0,
    bodyLength: prayerRequest.body.length,
    hasSubmitterName: prayerRequest.submitterName.trim().length > 0,
    submitterNameLength: prayerRequest.submitterName.length,
    hasSubmitterEmail: Boolean(prayerRequest.submitterEmail),
    createdAt: prayerRequest.createdAt
  };
}
