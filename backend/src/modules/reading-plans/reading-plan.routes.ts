import {
  readingPlanAssignmentStatusUpdateRequestSchema,
  readingPlanDayProgressUpdateRequestSchema,
  readingPlanListQuerySchema,
  readingPlanMyAssignmentListQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import { externalUserIdFromRequest } from "../../shared/http/external-user-id.js";
import {
  optionalMember
} from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import type { ReadingPlanViewer } from "./reading-plan.repository.js";
import type { ReadingPlanService } from "./reading-plan.service.js";

export async function registerReadingPlanRoutes(
  app: FastifyInstance,
  service: ReadingPlanService,
  memberAuthService: MemberAuthService
) {
  const memberPreHandler = optionalMember(memberAuthService);

  app.get(
    "/v1/reading-plans",
    { preHandler: memberPreHandler },
    async (request) => {
      const query = readingPlanListQuerySchema.parse(request.query);
      return ok({
        items: await service.listPublishedPlans(
          query,
          readingPlanViewerFromRequest(request) ?? undefined
        )
      });
    }
  );

  app.get(
    "/v1/reading-plans/:planId/days",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = planParamsSchema.parse(request.params);
      return ok({
        items: await service.getPlanDays(
          params.planId,
          readingPlanViewerFromRequest(request) ?? undefined
        )
      });
    }
  );

  app.post(
    "/v1/reading-plans/:planId/assignments",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = planParamsSchema.parse(request.params);
      return ok(
        await service.selfAssign(
          params.planId,
          readingPlanViewerFromRequest(request)
        )
      );
    }
  );

  app.get(
    "/v1/me/reading-plans",
    { preHandler: memberPreHandler },
    async (request) => {
      const query = readingPlanMyAssignmentListQuerySchema.parse(request.query);
      return ok(
        await service.listAssignmentsForViewer(
          readingPlanViewerFromRequest(request),
          query
        )
      );
    }
  );

  app.get(
    "/v1/me/reading-plans/:assignmentId",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      return ok(
        await service.getAssignmentDetail(
          params.assignmentId,
          readingPlanViewerFromRequest(request)
        )
      );
    }
  );

  app.patch(
    "/v1/reading-plans/assignments/:assignmentId/status",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = assignmentParamsSchema.parse(request.params);
      const body = readingPlanAssignmentStatusUpdateRequestSchema.parse(
        request.body ?? {}
      );
      return ok(
        await service.updateAssignmentStatus(
          params.assignmentId,
          readingPlanViewerFromRequest(request),
          body
        )
      );
    }
  );

  app.patch(
    "/v1/reading-plans/assignments/:assignmentId/days/:dayId",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = progressParamsSchema.parse(request.params);
      const body = readingPlanDayProgressUpdateRequestSchema.parse(
        request.body ?? {}
      );
      return ok(
        await service.updateDayProgress(
          params.assignmentId,
          params.dayId,
          readingPlanViewerFromRequest(request),
          body
        )
      );
    }
  );
}

function readingPlanViewerFromRequest(
  request: FastifyRequest
): ReadingPlanViewer | null {
  if (request.member) {
    return {
      userType: "member",
      userId: request.member.id
    };
  }
  const externalUserId = externalUserIdFromRequest(request);
  if (!externalUserId) {
    return null;
  }
  return {
    userType: "external",
    userId: externalUserId
  };
}

const planParamsSchema = z.object({
  planId: z.string()
});

const progressParamsSchema = z.object({
  assignmentId: z.string(),
  dayId: z.string()
});

const assignmentParamsSchema = z.object({
  assignmentId: z.string()
});
