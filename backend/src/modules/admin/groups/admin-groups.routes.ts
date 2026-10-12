import {
  groupApplicationListQuerySchema,
  groupApplicationReviewRequestSchema,
  groupAttendanceListQuerySchema,
  groupAttendanceUpsertRequestSchema,
  groupMaterialAssignmentCreateRequestSchema,
  groupMaterialAssignmentListQuerySchema,
  groupMaterialAssignmentUpdateRequestSchema,
  groupMembershipListQuerySchema,
  groupMembershipUpdateRequestSchema,
  ministryGroupListQuerySchema,
  ministryGroupUpdateRequestSchema,
  ministryGroupUpsertRequestSchema,
  type AdminPermission,
  type GroupApplication,
  type GroupAttendanceRecord,
  type GroupMaterialAssignment,
  type GroupMembership,
  type MinistryGroup
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { GroupService } from "../../groups/group.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminGroupRoutes(
  app: FastifyInstance,
  service: GroupService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/groups",
    { preHandler: permissionPreHandler("groups:read") },
    async (request) => {
      const query = ministryGroupListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.post(
    "/v1/admin/groups",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const body = ministryGroupUpsertRequestSchema.parse(request.body);
      const group = await service.create(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "group.create",
        resourceType: "group",
        resourceId: group.id,
        afterJson: groupAuditSnapshot(group)
      });
      return ok(group);
    }
  );

  app.patch(
    "/v1/admin/groups/:groupId",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const body = ministryGroupUpdateRequestSchema.parse(request.body);
      const before = await service.getById(params.groupId);
      const group = await service.update(params.groupId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "group.update",
        resourceType: "group",
        resourceId: group.id,
        beforeJson: before ? groupAuditSnapshot(before) : null,
        afterJson: groupAuditSnapshot(group)
      });
      return ok(group);
    }
  );

  app.get(
    "/v1/admin/groups/:groupId/applications",
    { preHandler: permissionPreHandler("groups:read") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const query = groupApplicationListQuerySchema.parse(request.query);
      return ok({ items: await service.listApplications(params.groupId, query) });
    }
  );

  app.patch(
    "/v1/admin/groups/:groupId/applications/:applicationId",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = applicationParamsSchema.parse(request.params);
      const body = groupApplicationReviewRequestSchema.parse(request.body ?? {});
      const attempt = await service.reviewApplication(
        params.groupId,
        params.applicationId,
        body
      );
      const application = attempt.application;
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: attempt.changed
          ? "group.application.review"
          : "group.application.review_duplicate",
        resourceType: "group_application",
        resourceId: application.id,
        afterJson: applicationAuditSnapshot(application)
      });
      return ok(application);
    }
  );

  app.get(
    "/v1/admin/groups/:groupId/memberships",
    { preHandler: permissionPreHandler("groups:read") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const query = groupMembershipListQuerySchema.parse(request.query);
      return ok({
        items: await service.listMemberships(params.groupId, query)
      });
    }
  );

  app.patch(
    "/v1/admin/groups/:groupId/memberships/:userId",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = membershipParamsSchema.parse(request.params);
      const body = groupMembershipUpdateRequestSchema.parse(request.body);
      const attempt = await service.updateMembership(
        params.groupId,
        params.userId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: attempt.changed
          ? "group.membership.update"
          : "group.membership.update_duplicate",
        resourceType: "group_membership",
        resourceId: `${params.groupId}:${params.userId}`,
        beforeJson: membershipAuditSnapshot(
          attempt.membership,
          attempt.previousStatus
        ),
        afterJson: membershipAuditSnapshot(attempt.membership)
      });
      return ok(attempt.membership);
    }
  );

  app.get(
    "/v1/admin/groups/:groupId/materials",
    { preHandler: permissionPreHandler("groups:read") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const query = groupMaterialAssignmentListQuerySchema.parse(request.query);
      return ok({
        items: await service.listMaterialAssignments(params.groupId, query)
      });
    }
  );

  app.post(
    "/v1/admin/groups/:groupId/materials",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const body = groupMaterialAssignmentCreateRequestSchema.parse(
        request.body
      );
      const assignment = await service.createMaterialAssignment(
        params.groupId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "group.material.assign",
        resourceType: "group_material_assignment",
        resourceId: assignment.id,
        afterJson: materialAssignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.patch(
    "/v1/admin/groups/:groupId/materials/:assignmentId",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = materialParamsSchema.parse(request.params);
      const body = groupMaterialAssignmentUpdateRequestSchema.parse(
        request.body ?? {}
      );
      const assignment = await service.updateMaterialAssignment(
        params.groupId,
        params.assignmentId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "group.material.update",
        resourceType: "group_material_assignment",
        resourceId: assignment.id,
        afterJson: materialAssignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.get(
    "/v1/admin/groups/:groupId/attendance",
    { preHandler: permissionPreHandler("groups:read") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const query = groupAttendanceListQuerySchema.parse(request.query);
      return ok({
        items: await service.listAttendanceRecords(params.groupId, query)
      });
    }
  );

  app.post(
    "/v1/admin/groups/:groupId/attendance",
    { preHandler: permissionPreHandler("groups:manage") },
    async (request) => {
      const params = groupParamsSchema.parse(request.params);
      const body = groupAttendanceUpsertRequestSchema.parse(request.body);
      const record = await service.upsertAttendanceRecord(params.groupId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "group.attendance.upsert",
        resourceType: "group_attendance_record",
        resourceId: record.id,
        afterJson: attendanceAuditSnapshot(record)
      });
      return ok(record);
    }
  );
}

const groupParamsSchema = z.object({
  groupId: z.string()
});

const applicationParamsSchema = groupParamsSchema.extend({
  applicationId: z.string()
});

const membershipParamsSchema = groupParamsSchema.extend({
  userId: z.string()
});

const materialParamsSchema = groupParamsSchema.extend({
  assignmentId: z.string()
});

function groupAuditSnapshot(group: MinistryGroup) {
  return {
    id: group.id,
    status: group.status,
    visibility: group.visibility,
    capacity: group.capacity,
    memberCount: group.memberCount
  };
}

function applicationAuditSnapshot(application: GroupApplication) {
  return {
    id: application.id,
    groupId: application.groupId,
    userId: application.userId,
    status: application.status,
    hasNote: application.note.trim().length > 0
  };
}

function membershipAuditSnapshot(
  membership: GroupMembership,
  status = membership.status
) {
  return {
    groupId: membership.groupId,
    userId: membership.userId,
    status
  };
}

function materialAssignmentAuditSnapshot(assignment: GroupMaterialAssignment) {
  return {
    id: assignment.id,
    groupId: assignment.groupId,
    materialType: assignment.materialType,
    materialId: assignment.materialId,
    status: assignment.status,
    dueAt: assignment.dueAt
  };
}

function attendanceAuditSnapshot(record: GroupAttendanceRecord) {
  return {
    id: record.id,
    groupId: record.groupId,
    meetingDate: record.meetingDate,
    memberUserId: record.memberUserId,
    status: record.status,
    hasNote: record.note.trim().length > 0
  };
}
