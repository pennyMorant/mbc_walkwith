import {
  sermonDiscussionGuideCreateRequestSchema,
  sermonDiscussionGuideListQuerySchema,
  sermonDiscussionGuideUpdateRequestSchema,
  sermonDiscussionResponseListQuerySchema,
  type AdminPermission,
  type SermonDiscussionGuide,
  type SermonDiscussionResponse
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { SermonDiscussionGuideService } from "../../sermon-discussion-guides/sermon-discussion-guide.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminSermonDiscussionGuideRoutes(
  app: FastifyInstance,
  service: SermonDiscussionGuideService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/sermon-discussion-guides",
    { preHandler: permissionPreHandler("sermon_guides:read") },
    async (request) => {
      const query = sermonDiscussionGuideListQuerySchema.parse(request.query);
      return ok({ items: await service.listGuides(query) });
    }
  );

  app.post(
    "/v1/admin/sermon-discussion-guides",
    { preHandler: permissionPreHandler("sermon_guides:manage") },
    async (request) => {
      const body = sermonDiscussionGuideCreateRequestSchema.parse(request.body);
      const guide = await service.createGuide(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon_discussion_guide.create",
        resourceType: "sermon_discussion_guide",
        resourceId: guide.id,
        afterJson: guideAuditSnapshot(guide)
      });
      return ok(guide);
    }
  );

  app.patch(
    "/v1/admin/sermon-discussion-guides/:guideId",
    { preHandler: permissionPreHandler("sermon_guides:manage") },
    async (request) => {
      const params = guideParamsSchema.parse(request.params);
      const body = sermonDiscussionGuideUpdateRequestSchema.parse(
        request.body ?? {}
      );
      const guide = await service.updateGuide(params.guideId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: guideAuditAction(body.status),
        resourceType: "sermon_discussion_guide",
        resourceId: guide.id,
        afterJson: guideAuditSnapshot(guide)
      });
      return ok(guide);
    }
  );

  app.get(
    "/v1/admin/sermon-discussion-guides/:guideId/responses",
    { preHandler: permissionPreHandler("sermon_guides:read") },
    async (request) => {
      const params = guideParamsSchema.parse(request.params);
      const rawQuery =
        typeof request.query === "object" && request.query !== null
          ? request.query
          : {};
      const query = sermonDiscussionResponseListQuerySchema.parse({
        ...rawQuery,
        guideId: params.guideId,
        status: "shared_with_group"
      });
      return ok({ items: await service.listResponses(query) });
    }
  );

  app.patch(
    "/v1/admin/sermon-discussion-guides/responses/:responseId/hide",
    { preHandler: permissionPreHandler("sermon_guides:manage") },
    async (request) => {
      const params = responseParamsSchema.parse(request.params);
      const response = await service.hideResponse(params.responseId);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon_discussion_response.hide",
        resourceType: "sermon_discussion_response",
        resourceId: response.id,
        afterJson: responseAuditSnapshot(response)
      });
      return ok(response);
    }
  );
}

function guideAuditAction(status: SermonDiscussionGuide["status"] | undefined) {
  return {
    published: "sermon_discussion_guide.publish",
    archived: "sermon_discussion_guide.archive",
    review: "sermon_discussion_guide.review",
    draft: "sermon_discussion_guide.update"
  }[status ?? "draft"];
}

const guideParamsSchema = z.object({
  guideId: z.string()
});

const responseParamsSchema = z.object({
  responseId: z.string()
});

function guideAuditSnapshot(guide: SermonDiscussionGuide) {
  return {
    id: guide.id,
    sermonId: guide.sermonId,
    status: guide.status,
    audienceType: guide.audienceType,
    questionCount: guide.questions.length,
    actionStepCount: guide.actionSteps.length,
    hasGeneratedMetadata: Object.keys(guide.generatedMetadata).length > 0
  };
}

function responseAuditSnapshot(response: SermonDiscussionResponse) {
  return {
    id: response.id,
    guideId: response.guideId,
    questionId: response.questionId,
    userType: response.userType,
    status: response.status,
    hasContent: response.content.trim().length > 0
  };
}
