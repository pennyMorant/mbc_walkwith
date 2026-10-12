import {
  memberCreateRequestSchema,
  memberListQuerySchema,
  memberUpdateRequestSchema,
  type AdminPermission,
  type MemberProfile
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { memberNotFound } from "../../members/member-errors.js";
import type { MemberService } from "../../members/member.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminMemberRoutes(
  app: FastifyInstance,
  service: MemberService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/members",
    { preHandler: permissionPreHandler("users:read") },
    async (request) => {
      const query = memberListQuerySchema.parse(request.query);
      const members = await service.list(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "member.list",
        resourceType: "member",
        resourceId: "list",
        afterJson: memberListAuditSnapshot(query, members.length)
      });
      return ok({ items: members });
    }
  );

  app.get(
    "/v1/admin/members/:memberId",
    { preHandler: permissionPreHandler("users:read") },
    async (request) => {
      const params = memberParamsSchema.parse(request.params);
      const member = await service.getById(params.memberId);
      if (!member) {
        throw memberNotFound(params.memberId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "member.view",
        resourceType: "member",
        resourceId: member.id,
        afterJson: memberViewAuditSnapshot(member)
      });
      return ok(member);
    }
  );

  app.post(
    "/v1/admin/members",
    { preHandler: permissionPreHandler("users:manage") },
    async (request) => {
      const body = memberCreateRequestSchema.parse(request.body);
      const member = await service.create(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "member.create",
        resourceType: "member",
        resourceId: member.id,
        afterJson: auditSnapshot(member)
      });
      return ok(member);
    }
  );

  app.patch(
    "/v1/admin/members/:memberId",
    { preHandler: permissionPreHandler("users:manage") },
    async (request) => {
      const params = memberParamsSchema.parse(request.params);
      const body = memberUpdateRequestSchema.parse(request.body);
      const before = await service.getById(params.memberId);
      if (!before) {
        throw memberNotFound(params.memberId);
      }
      const member = await service.update(params.memberId, body);
      if (!member) {
        throw memberNotFound(params.memberId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "member.update",
        resourceType: "member",
        resourceId: member.id,
        beforeJson: auditSnapshot(before),
        afterJson: auditSnapshot(member)
      });
      return ok(member);
    }
  );
}

const memberParamsSchema = z.object({
  memberId: z.string().uuid()
});

function memberListAuditSnapshot(
  query: z.infer<typeof memberListQuerySchema>,
  count: number
) {
  return {
    status: query.status ?? null,
    hasFellowshipGroupId: Boolean(query.fellowshipGroupId),
    hasQuery: Boolean(query.query),
    queryLength: query.query?.length ?? 0,
    limit: query.limit,
    count
  };
}

function memberViewAuditSnapshot(member: MemberProfile) {
  return {
    id: member.id,
    status: member.status,
    roles: member.roles,
    hasPhone: Boolean(member.phone),
    hasAddress: Boolean(member.address),
    hasEmergencyContact: Boolean(
      member.emergencyContactName || member.emergencyContactPhone
    )
  };
}

function auditSnapshot(member: MemberProfile) {
  return {
    id: member.id,
    status: member.status,
    roles: member.roles,
    appLocale: member.appLocale,
    fellowshipGroupId: member.fellowshipGroupId,
    hasPhone: Boolean(member.phone),
    hasEmail: Boolean(member.email)
  };
}
