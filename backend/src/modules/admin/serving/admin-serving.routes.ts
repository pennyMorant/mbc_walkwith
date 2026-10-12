import {
  memberListQuerySchema,
  servingAdminAssignmentCreateRequestSchema,
  servingAdminAssignmentUpdateRequestSchema,
  servingAdminAvailabilityCreateRequestSchema,
  servingAssignmentListQuerySchema,
  servingAvailabilityListQuerySchema,
  servingCheckInListQuerySchema,
  servingCheckInUpsertRequestSchema,
  servingListQuerySchema,
  servingRoleUpdateRequestSchema,
  servingRoleUpsertRequestSchema,
  servingTeamUpdateRequestSchema,
  servingTeamUpsertRequestSchema,
  type AdminPermission,
  type ServingAvailabilityRecord,
  type ServingAssignment,
  type ServingCheckInRecord,
  type ServingRole,
  type ServingTeam
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { ServingService } from "../../serving/serving.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminServingRoutes(
  app: FastifyInstance,
  service: ServingService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/serving/members",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) =>
      ok({
        items: await service.listMembers(
          memberListQuerySchema.parse(request.query)
        )
      })
  );

  app.get(
    "/v1/admin/serving/teams",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) =>
      ok({ items: await service.listTeams(servingListQuerySchema.parse(request.query)) })
  );

  app.post(
    "/v1/admin/serving/teams",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const team = await service.createTeam(
        servingTeamUpsertRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.team.create",
        resourceType: "serving_team",
        resourceId: team.id,
        afterJson: teamAuditSnapshot(team)
      });
      return ok(team);
    }
  );

  app.patch(
    "/v1/admin/serving/teams/:teamId",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const params = teamParamsSchema.parse(request.params);
      const team = await service.updateTeam(
        params.teamId,
        servingTeamUpdateRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.team.update",
        resourceType: "serving_team",
        resourceId: team.id,
        afterJson: teamAuditSnapshot(team)
      });
      return ok(team);
    }
  );

  app.get(
    "/v1/admin/serving/roles",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) => {
      const query = servingRoleQuerySchema.parse(request.query);
      return ok({ items: await service.listRoles(query) });
    }
  );

  app.post(
    "/v1/admin/serving/roles",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const role = await service.createRole(
        servingRoleUpsertRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.role.create",
        resourceType: "serving_role",
        resourceId: role.id,
        afterJson: roleAuditSnapshot(role)
      });
      return ok(role);
    }
  );

  app.patch(
    "/v1/admin/serving/roles/:roleId",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const params = roleParamsSchema.parse(request.params);
      const role = await service.updateRole(
        params.roleId,
        servingRoleUpdateRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.role.update",
        resourceType: "serving_role",
        resourceId: role.id,
        afterJson: roleAuditSnapshot(role)
      });
      return ok(role);
    }
  );

  app.get(
    "/v1/admin/serving/assignments",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) =>
      ok({
        items: await service.listAssignments(
          servingAssignmentListQuerySchema.parse(request.query)
        )
      })
  );

  app.post(
    "/v1/admin/serving/assignments",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const assignment = await service.createAssignment(
        servingAdminAssignmentCreateRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.assignment.create",
        resourceType: "serving_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.patch(
    "/v1/admin/serving/assignments/:assignmentId",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const assignment = await service.updateAssignment(
        params.assignmentId,
        servingAdminAssignmentUpdateRequestSchema.parse(request.body)
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.assignment.update",
        resourceType: "serving_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.get(
    "/v1/admin/serving/availability",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) =>
      ok({
        items: await service.listAvailability(
          servingAvailabilityListQuerySchema.parse(request.query)
        )
      })
  );

  app.post(
    "/v1/admin/serving/availability",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const body = servingAdminAvailabilityCreateRequestSchema.parse(
        request.body
      );
      const record = await service.createAvailability(body.userId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.availability.create",
        resourceType: "serving_availability",
        resourceId: record.id,
        afterJson: availabilityAuditSnapshot(record)
      });
      return ok(record);
    }
  );

  app.get(
    "/v1/admin/serving/check-ins",
    { preHandler: permissionPreHandler("serving:read") },
    async (request) =>
      ok({
        items: await service.listCheckIns(
          servingCheckInListQuerySchema.parse(request.query)
        )
      })
  );

  app.post(
    "/v1/admin/serving/assignments/:assignmentId/check-in",
    { preHandler: permissionPreHandler("serving:manage") },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const body = servingCheckInUpsertRequestSchema.parse(request.body ?? {});
      const checkIn = await service.adminCheckInAssignment(
        params.assignmentId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "serving.assignment.check_in",
        resourceType: "serving_check_in",
        resourceId: checkIn.id,
        afterJson: checkInAuditSnapshot(checkIn)
      });
      return ok(checkIn);
    }
  );
}

const teamParamsSchema = z.object({
  teamId: z.string()
});

const roleParamsSchema = z.object({
  roleId: z.string()
});

const assignmentParamsSchema = z.object({
  assignmentId: z.string()
});

const servingRoleQuerySchema = servingListQuerySchema.extend({
  teamId: z.string().optional()
});

function teamAuditSnapshot(team: ServingTeam) {
  return { id: team.id, status: team.status };
}

function roleAuditSnapshot(role: ServingRole) {
  return { id: role.id, teamId: role.teamId, status: role.status };
}

function assignmentAuditSnapshot(assignment: ServingAssignment) {
  return {
    id: assignment.id,
    teamId: assignment.teamId,
    roleId: assignment.roleId,
    userId: assignment.userId,
    status: assignment.status,
    startsAt: assignment.startsAt
  };
}

function availabilityAuditSnapshot(record: ServingAvailabilityRecord) {
  return {
    id: record.id,
    userId: record.userId,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    status: record.status,
    hasNote: record.note.trim().length > 0
  };
}

function checkInAuditSnapshot(checkIn: ServingCheckInRecord) {
  return {
    id: checkIn.id,
    assignmentId: checkIn.assignmentId,
    userId: checkIn.userId,
    status: checkIn.status,
    hasNote: checkIn.note.trim().length > 0
  };
}
