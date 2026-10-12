import {
  careRequestCreateRequestSchema,
  memberCareRequestListQuerySchema,
  type CareRequestSummary
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import type { CareService } from "./care.service.js";

export async function registerCareRoutes(
  app: FastifyInstance,
  service: CareService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  const memberPreHandler = requireMember(memberAuthService);

  app.get(
    "/v1/me/care-requests",
    { preHandler: memberPreHandler },
    async (request) => {
      const query = memberCareRequestListQuerySchema.parse(request.query);
      return ok({
        items: await service.listForUser(request.member!.id, query)
      });
    }
  );

  app.get(
    "/v1/me/care-requests/:careRequestId",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = careParamsSchema.parse(request.params);
      return ok(
        await service.getForMember(params.careRequestId, request.member!.id)
      );
    }
  );

  app.post(
    "/v1/me/care-requests",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = careRequestCreateRequestSchema.parse(request.body);
      const careRequest = await service.createForMember(request.member!, body);
      await auditService.record({
        actorUserId: request.member!.id,
        action: "care.request.submit",
        resourceType: "care_request",
        resourceId: careRequest.id,
        afterJson: careRequestAuditSnapshot(careRequest)
      });
      return ok(careRequest);
    }
  );
}

const careParamsSchema = z.object({
  careRequestId: z.string()
});

function careRequestAuditSnapshot(request: CareRequestSummary) {
  return {
    id: request.id,
    userId: request.userId,
    status: request.status,
    privacyLevel: request.privacyLevel,
    hasBody: request.body.trim().length > 0
  };
}
