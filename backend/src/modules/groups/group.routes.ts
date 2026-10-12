import {
  groupApplicationRequestSchema,
  groupApplicationWithdrawalRequestSchema,
  ministryGroupListQuerySchema,
  type GroupApplication
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import {
  optionalMember,
  requireMember
} from "../members/auth/member-auth.middleware.js";
import type { GroupService } from "./group.service.js";

export async function registerGroupRoutes(
  app: FastifyInstance,
  service: GroupService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  const optionalMemberPreHandler = optionalMember(memberAuthService);
  const memberPreHandler = requireMember(memberAuthService);

  app.get(
    "/v1/groups",
    { preHandler: optionalMemberPreHandler },
    async (request) => {
      const query = ministryGroupListQuerySchema.parse(request.query);
      return ok({
        items: await service.listVisible(query, request.member?.id ?? null)
      });
    }
  );

  app.get(
    "/v1/groups/:groupId",
    { preHandler: optionalMemberPreHandler },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      return ok(
        await service.getVisibleById(
          params.groupId,
          request.member?.id ?? null
        )
      );
    }
  );

  app.get(
    "/v1/me/groups",
    { preHandler: memberPreHandler },
    async (request) => ok({ items: await service.listMine(request.member!.id) })
  );

  app.post(
    "/v1/groups/:groupId/applications",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const body = groupApplicationRequestSchema.parse(request.body ?? {});
      const attempt = await service.applyToGroup(
        params.groupId,
        request.member!,
        body
      );
      const application = attempt.application;
      await auditService.record({
        actorUserId: request.member!.id,
        action: attempt.created
          ? "group.application.submit"
          : "group.application.duplicate",
        resourceType: "group_application",
        resourceId: application.id,
        afterJson: applicationAuditSnapshot(application)
      });
      return ok(application);
    }
  );

  app.patch(
    "/v1/groups/:groupId/applications/:applicationId",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = applicationParamsSchema.parse(request.params);
      const body = groupApplicationWithdrawalRequestSchema.parse(
        request.body ?? {}
      );
      const attempt = await service.withdrawApplication(
        params.groupId,
        params.applicationId,
        request.member!.id,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: attempt.changed
          ? "group.application.withdraw"
          : "group.application.withdraw_duplicate",
        resourceType: "group_application",
        resourceId: attempt.application.id,
        afterJson: applicationAuditSnapshot(attempt.application)
      });
      return ok(attempt.application);
    }
  );
}

const groupParamsSchema = z.object({
  groupId: z.string()
});

const applicationParamsSchema = groupParamsSchema.extend({
  applicationId: z.string()
});

function applicationAuditSnapshot(application: GroupApplication) {
  return {
    id: application.id,
    groupId: application.groupId,
    userId: application.userId,
    status: application.status,
    hasNote: application.note.trim().length > 0
  };
}
