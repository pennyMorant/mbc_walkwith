import {
  discipleshipAssignmentCreateRequestSchema,
  discipleshipAssignmentListQuerySchema,
  discipleshipJourneyCreateRequestSchema,
  discipleshipJourneyListQuerySchema,
  discipleshipJourneyUpdateRequestSchema,
  discipleshipStageCreateRequestSchema,
  discipleshipTaskCreateRequestSchema,
  discipleshipTaskProgressUpdateRequestSchema,
  type AdminPermission,
  type DiscipleshipAssignment,
  type DiscipleshipJourney,
  type DiscipleshipStage,
  type DiscipleshipTask,
  type DiscipleshipTaskProgress
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { DiscipleshipService } from "../../discipleship/discipleship.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminDiscipleshipRoutes(
  app: FastifyInstance,
  service: DiscipleshipService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/discipleship/journeys",
    { preHandler: permissionPreHandler("discipleship:read") },
    async (request) => {
      const query = discipleshipJourneyListQuerySchema.parse(request.query);
      return ok({ items: await service.listJourneys(query) });
    }
  );

  app.post(
    "/v1/admin/discipleship/journeys",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const body = discipleshipJourneyCreateRequestSchema.parse(request.body);
      const journey = await service.createJourney(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.journey.create",
        resourceType: "discipleship_journey",
        resourceId: journey.id,
        afterJson: journeyAuditSnapshot(journey)
      });
      return ok(journey);
    }
  );

  app.patch(
    "/v1/admin/discipleship/journeys/:journeyId",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const params = journeyParamsSchema.parse(request.params);
      const body = discipleshipJourneyUpdateRequestSchema.parse(request.body ?? {});
      const journey = await service.updateJourney(params.journeyId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.journey.update",
        resourceType: "discipleship_journey",
        resourceId: journey.id,
        afterJson: journeyAuditSnapshot(journey)
      });
      return ok(journey);
    }
  );

  app.post(
    "/v1/admin/discipleship/journeys/:journeyId/stages",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const params = journeyParamsSchema.parse(request.params);
      const body = discipleshipStageCreateRequestSchema.parse(request.body);
      const stage = await service.createStage(params.journeyId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.stage.create",
        resourceType: "discipleship_stage",
        resourceId: stage.id,
        afterJson: stageAuditSnapshot(stage)
      });
      return ok(stage);
    }
  );

  app.get(
    "/v1/admin/discipleship/journeys/:journeyId/stages",
    { preHandler: permissionPreHandler("discipleship:read") },
    async (request) => {
      const params = journeyParamsSchema.parse(request.params);
      return ok({ items: await service.listStagesForJourney(params.journeyId) });
    }
  );

  app.post(
    "/v1/admin/discipleship/journeys/:journeyId/tasks",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const params = journeyParamsSchema.parse(request.params);
      const body = discipleshipTaskCreateRequestSchema.parse(request.body);
      const task = await service.createTask(params.journeyId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.task.create",
        resourceType: "discipleship_task",
        resourceId: task.id,
        afterJson: taskAuditSnapshot(task)
      });
      return ok(task);
    }
  );

  app.get(
    "/v1/admin/discipleship/journeys/:journeyId/tasks",
    { preHandler: permissionPreHandler("discipleship:read") },
    async (request) => {
      const params = journeyParamsSchema.parse(request.params);
      return ok({ items: await service.listTasksForJourney(params.journeyId) });
    }
  );

  app.get(
    "/v1/admin/discipleship/assignments",
    { preHandler: permissionPreHandler("discipleship:read") },
    async (request) => {
      const query = discipleshipAssignmentListQuerySchema.parse(request.query);
      return ok({ items: await service.listAssignments(query) });
    }
  );

  app.post(
    "/v1/admin/discipleship/assignments",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const body = discipleshipAssignmentCreateRequestSchema.parse(request.body);
      const assignment = await service.createAssignment(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.assignment.create",
        resourceType: "discipleship_assignment",
        resourceId: assignment.id,
        afterJson: assignmentAuditSnapshot(assignment)
      });
      return ok(assignment);
    }
  );

  app.patch(
    "/v1/admin/discipleship/assignments/:assignmentId/tasks/:taskId",
    { preHandler: permissionPreHandler("discipleship:manage") },
    async (request) => {
      const params = taskProgressParamsSchema.parse(request.params);
      const body = discipleshipTaskProgressUpdateRequestSchema.parse(
        request.body ?? {}
      );
      const progress = await service.updateTaskProgress(
        params.assignmentId,
        params.taskId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "discipleship.task_progress.update",
        resourceType: "discipleship_task_progress",
        resourceId: progress.id,
        afterJson: progressAuditSnapshot(progress)
      });
      return ok(progress);
    }
  );
}

const journeyParamsSchema = z.object({
  journeyId: z.string()
});

const taskProgressParamsSchema = z.object({
  assignmentId: z.string(),
  taskId: z.string()
});

function journeyAuditSnapshot(journey: DiscipleshipJourney) {
  return {
    id: journey.id,
    status: journey.status
  };
}

function stageAuditSnapshot(stage: DiscipleshipStage) {
  return {
    id: stage.id,
    journeyId: stage.journeyId,
    sortOrder: stage.sortOrder
  };
}

function taskAuditSnapshot(task: DiscipleshipTask) {
  return {
    id: task.id,
    journeyId: task.journeyId,
    stageId: task.stageId,
    referenceType: task.referenceType,
    hasReferenceId: task.referenceId.trim().length > 0,
    required: task.required,
    sortOrder: task.sortOrder
  };
}

function assignmentAuditSnapshot(assignment: DiscipleshipAssignment) {
  return {
    id: assignment.id,
    journeyId: assignment.journeyId,
    userId: assignment.userId,
    status: assignment.status,
    assigneeAdminUserId: assignment.assigneeAdminUserId
  };
}

function progressAuditSnapshot(progress: DiscipleshipTaskProgress) {
  return {
    id: progress.id,
    assignmentId: progress.assignmentId,
    taskId: progress.taskId,
    status: progress.status,
    hasNote: progress.note.trim().length > 0
  };
}
