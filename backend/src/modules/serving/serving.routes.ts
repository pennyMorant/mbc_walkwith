import {
  servingAssignmentActionRequestSchema,
  servingAvailabilityUpsertRequestSchema,
  servingCheckInUpsertRequestSchema,
  type ServingAvailabilityRecord,
  type ServingAssignment
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import type { ServingService } from "./serving.service.js";

export async function registerServingRoutes(
  app: FastifyInstance,
  service: ServingService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  const memberPreHandler = requireMember(memberAuthService);

  app.get(
    "/v1/me/serving-assignments",
    { preHandler: memberPreHandler },
    async (request) =>
      ok({ items: await service.listAssignmentsForUser(request.member!.id) })
  );

  app.post(
    "/v1/serving-assignments/:assignmentId/confirm",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const body = servingAssignmentActionRequestSchema.parse(request.body ?? {});
      const assignment = await service.confirmAssignment(
        params.assignmentId,
        request.member!.id,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "serving.assignment.confirm",
        resourceType: "serving_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.post(
    "/v1/serving-assignments/:assignmentId/leave-request",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const body = servingAssignmentActionRequestSchema.parse(request.body ?? {});
      const assignment = await service.requestLeave(
        params.assignmentId,
        request.member!.id,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "serving.assignment.leave_request",
        resourceType: "serving_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.get(
    "/v1/me/serving-availability",
    { preHandler: memberPreHandler },
    async (request) =>
      ok({ items: await service.listAvailabilityForUser(request.member!.id) })
  );

  app.get(
    "/v1/me/serving-check-ins",
    { preHandler: memberPreHandler },
    async (request) =>
      ok({ items: await service.listCheckInsForUser(request.member!.id) })
  );

  app.post(
    "/v1/me/serving-availability",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = servingAvailabilityUpsertRequestSchema.parse(
        request.body ?? {}
      );
      const record = await service.createAvailability(request.member!.id, body);
      await auditService.record({
        actorUserId: request.member!.id,
        action: "serving.availability.create",
        resourceType: "serving_availability",
        resourceId: record.id,
        afterJson: availabilityAuditSnapshot(record)
      });
      return ok(record);
    }
  );

  app.post(
    "/v1/serving-assignments/:assignmentId/check-in",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const body = servingCheckInUpsertRequestSchema.parse(request.body ?? {});
      const checkIn = await service.checkInAssignment(
        params.assignmentId,
        request.member!.id,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "serving.assignment.check_in",
        resourceType: "serving_check_in",
        resourceId: checkIn.id,
        afterJson: {
          id: checkIn.id,
          assignmentId: checkIn.assignmentId,
          userId: checkIn.userId,
          status: checkIn.status,
          hasNote: checkIn.note.trim().length > 0
        }
      });
      return ok(checkIn);
    }
  );
}

const assignmentParamsSchema = z.object({
  assignmentId: z.string()
});

function assignmentAuditSnapshot(assignment: ServingAssignment) {
  return {
    id: assignment.id,
    userId: assignment.userId,
    status: assignment.status,
    startsAt: assignment.startsAt,
    hasResponseNote: assignment.responseNote.trim().length > 0
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
