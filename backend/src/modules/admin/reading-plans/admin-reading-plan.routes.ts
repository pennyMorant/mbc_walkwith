import {
  readingPlanAssignmentCreateRequestSchema,
  readingPlanAssignmentListQuerySchema,
  readingPlanCreateRequestSchema,
  readingPlanDayUpsertRequestSchema,
  readingPlanListQuerySchema,
  readingPlanUpdateRequestSchema,
  type AdminPermission,
  type ReadingPlan,
  type ReadingPlanAssignment,
  type ReadingPlanDay
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { ReadingPlanService } from "../../reading-plans/reading-plan.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminReadingPlanRoutes(
  app: FastifyInstance,
  service: ReadingPlanService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/reading-plans",
    { preHandler: permissionPreHandler("reading_plans:read") },
    async (request) => {
      const query = readingPlanListQuerySchema.parse(request.query);
      return ok({ items: await service.listPlans(query) });
    }
  );

  app.post(
    "/v1/admin/reading-plans",
    { preHandler: permissionPreHandler("reading_plans:manage") },
    async (request) => {
      const body = readingPlanCreateRequestSchema.parse(request.body);
      const plan = await service.createPlan(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "reading_plan.create",
        resourceType: "reading_plan",
        resourceId: plan.id,
        afterJson: planAuditSnapshot(plan)
      });
      return ok(plan);
    }
  );

  app.patch(
    "/v1/admin/reading-plans/:planId",
    { preHandler: permissionPreHandler("reading_plans:manage") },
    async (request) => {
      const params = planParamsSchema.parse(request.params);
      const body = readingPlanUpdateRequestSchema.parse(request.body ?? {});
      const plan = await service.updatePlan(params.planId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "reading_plan.update",
        resourceType: "reading_plan",
        resourceId: plan.id,
        afterJson: planAuditSnapshot(plan)
      });
      return ok(plan);
    }
  );

  app.get(
    "/v1/admin/reading-plans/:planId/days",
    { preHandler: permissionPreHandler("reading_plans:read") },
    async (request) => {
      const params = planParamsSchema.parse(request.params);
      return ok({ items: await service.listAdminDays(params.planId) });
    }
  );

  app.post(
    "/v1/admin/reading-plans/:planId/days",
    { preHandler: permissionPreHandler("reading_plans:manage") },
    async (request) => {
      const params = planParamsSchema.parse(request.params);
      const body = readingPlanDayUpsertRequestSchema.parse(request.body);
      const day = await service.upsertDay(params.planId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "reading_plan.day.upsert",
        resourceType: "reading_plan_day",
        resourceId: day.id,
        afterJson: dayAuditSnapshot(day)
      });
      return ok(day);
    }
  );

  app.get(
    "/v1/admin/reading-plans/assignments",
    { preHandler: permissionPreHandler("reading_plans:read") },
    async (request) => {
      const query = readingPlanAssignmentListQuerySchema.parse(request.query);
      return ok({ items: await service.listAssignments(query) });
    }
  );

  app.post(
    "/v1/admin/reading-plans/assignments",
    { preHandler: permissionPreHandler("reading_plans:manage") },
    async (request) => {
      const body = readingPlanAssignmentCreateRequestSchema.parse(request.body);
      const assignment = await service.createAssignment(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "reading_plan.assignment.create",
        resourceType: "reading_plan_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );
}

const planParamsSchema = z.object({
  planId: z.string()
});

function planAuditSnapshot(plan: ReadingPlan) {
  return {
    id: plan.id,
    status: plan.status,
    visibility: plan.visibility,
    durationDays: plan.durationDays
  };
}

function dayAuditSnapshot(day: ReadingPlanDay) {
  return {
    id: day.id,
    planId: day.planId,
    dayNumber: day.dayNumber,
    referenceCount: day.references.length
  };
}

function assignmentAuditSnapshot(assignment: ReadingPlanAssignment) {
  return {
    id: assignment.id,
    planId: assignment.planId,
    userType: assignment.userType,
    status: assignment.status,
    sourceType: assignment.sourceType
  };
}
