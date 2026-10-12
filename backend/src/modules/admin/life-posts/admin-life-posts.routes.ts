import {
  type AdminPermission,
  lifePostListQuerySchema,
  lifePostPublishRequestSchema,
  lifePostRevisionHeaderSchema,
  lifePostNotificationTranslationRequestSchema,
  lifePostUpdateRequestSchema,
  lifePostUpsertRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import { appError, isAppError } from "../../../shared/http/app-error.js";
import type { AuditService } from "../../audit/audit.service.js";
import { adminPermissionDenied } from "../auth/admin-auth-errors.js";
import { roleHasPermission } from "../auth/admin-rbac.js";
import {
  lifeImageUploadBodyInvalid,
  lifePostNotificationTranslationNotAllowed,
  lifePostNotFound
} from "../../life/life-post-errors.js";
import type { LifePostImageStorageService } from "../../life/life-post-image-storage.service.js";
import type { LifePostService } from "../../life/life-post.service.js";
import type { LifePostMutationContext } from "../../life/life_post_mutation_policy.js";
import type { NotificationService } from "../../notifications/notification.service.js";
import { isWeeklyBulletinPost } from "../../notifications/notification_messages.js";
import { registerAdminLifePostRegistrationRoutes } from "./admin_life_post_registrations.routes.js";
import type { AiService } from "../../ai/ai.service.js";
import type { AiManagementService } from "../../ai/ai-management.service.js";
import { AiRateLimiter, enforceAiRateLimit } from "../../ai/ai-rate-limiter.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminLifePostRoutes(
  app: FastifyInstance,
  service: LifePostService,
  imageStorageService: LifePostImageStorageService,
  notificationService: NotificationService,
  auditService: AuditService,
  aiService: AiService,
  aiManagementService: AiManagementService,
  aiRateLimiter: AiRateLimiter,
  permissionPreHandler: PermissionPreHandler
) {
  app.addContentTypeParser(
    /^image\/.*/,
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body)
  );

  await registerAdminLifePostRegistrationRoutes(
    app,
    service,
    auditService,
    permissionPreHandler
  );

  app.post(
    "/v1/admin/life-posts/:postId/notification-translation",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      await permissionPreHandler("ai:use")(request, reply);
      const params = postParamsSchema.parse(request.params);
      const input = lifePostNotificationTranslationRequestSchema.parse(request.body);
      const post = await service.getById(params.postId);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      if (post.status === "published" || post.status === "archived") {
        throw lifePostNotificationTranslationNotAllowed(params.postId, post.status);
      }
      await aiManagementService.assertBudgetForTask("content_translation", {
        inputCharacters: (input.title?.length ?? 0) + (input.body?.length ?? 0)
      });
      enforceAiRateLimit(reply, aiRateLimiter.check("admin", request.adminUser!.id), "admin");
      try {
        const translated = await aiService.translateContent(input.targetLocale, {
          ...(input.title ? { title: input.title } : {}),
          ...(input.body ? { body: input.body } : {})
        });
        await auditService.record({ actorUserId: request.adminUser!.id, action: "ai.content_translation.generate", resourceType: "life_post_notification", resourceId: params.postId, afterJson: { outcome: "generated", task: "content_translation", locale: input.targetLocale, provider: translated.provider, model: translated.model, usage: translated.usage, latencyMs: translated.latencyMs, operation: "life_post_notification" } });
        return ok(translated.fields);
      } catch (error) {
        await auditService.record({ actorUserId: request.adminUser!.id, action: "ai.content_translation.failed", resourceType: "life_post_notification", resourceId: params.postId, afterJson: { outcome: "failed", task: "content_translation", locale: input.targetLocale, error: isAppError(error) ? { code: error.code, category: error.category, sourceLayer: error.sourceLayer, retryable: error.retryable } : { code: "internal_error" }, operation: "life_post_notification" } });
        throw error;
      }
    }
  );

  app.get(
    "/v1/admin/life-posts",
    { preHandler: permissionPreHandler("life_posts:read") },
    async (request) => {
      const query = lifePostListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.post(
    "/v1/admin/life-posts/images",
    {
      bodyLimit: 8 * 1024 * 1024,
      preHandler: permissionPreHandler("life_posts:update")
    },
    async (request) => {
      if (!Buffer.isBuffer(request.body)) {
        throw lifeImageUploadBodyInvalid();
      }
      const image = await imageStorageService.saveImage({
        buffer: request.body,
        fileName: decodeFileNameHeader(headerValue(request.headers["x-file-name"])),
        mimeType:
          headerValue(request.headers["content-type"]) ??
          "application/octet-stream"
      });
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.upload_image",
        resourceType: "life_post_image",
        resourceId: image.fileName,
        afterJson: image
      });
      return ok({ imageUrl: image.url });
    }
  );

  app.post(
    "/v1/admin/life-posts",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const body = lifePostUpsertRequestSchema.parse(request.body);
      assertNotDirectPublish(body);
      const post = await service.create(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.create",
        resourceType: "life_post",
        resourceId: post.id,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.patch(
    "/v1/admin/life-posts/:postId",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const body = lifePostUpdateRequestSchema.parse(request.body);
      assertNotDirectPublish(body);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.update(params.postId, body, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.update",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/publish",
    { preHandler: permissionPreHandler("life_posts:publish") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const body = lifePostPublishRequestSchema.parse(request.body ?? {});
      if (
        body.content &&
        !roleHasPermission(request.adminUser!.role, "life_posts:update")
      ) {
        throw adminPermissionDenied("life_posts:update");
      }
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.publish(params.postId, body, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      const notificationAudit = await deliverPublishNotification({
        request,
        notificationService,
        post,
        notifyApp: body.notifyApp,
        notification: body.notification
      });
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.publish",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: {
          post,
          notification: notificationAudit
        }
      });
      return ok(post);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/submit-review",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.submitReview(params.postId, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.submit_review",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/return-draft",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.returnDraft(params.postId, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.return_draft",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/archive",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.archive(params.postId, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.archive",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/unpublish",
    { preHandler: permissionPreHandler("life_posts:publish") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const post = await service.unpublish(params.postId, context);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.unpublish",
        resourceType: "life_post",
        resourceId: post.id,
        beforeJson: before,
        afterJson: post
      });
      return ok(post);
    }
  );

  app.delete(
    "/v1/admin/life-posts/:postId",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const context = lifePostMutationContext(request);
      const before = await service.getById(params.postId);
      if (!before) {
        throw lifePostNotFound(params.postId);
      }
      const deleted = await service.delete(params.postId, context);
      if (!deleted) {
        throw lifePostNotFound(params.postId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.delete",
        resourceType: "life_post",
        resourceId: params.postId,
        beforeJson: before
      });
      return ok({ deleted: true });
    }
  );
}

const postParamsSchema = z.object({
  postId: z.string()
});

function assertNotDirectPublish(body: { status?: string | undefined }) {
  if (body.status === "published") {
    throw appError({
      code: "life_post_direct_publish_not_allowed",
      message: "Use the publish action to publish life posts.",
      statusCode: 400,
      category: "state_conflict",
      sourceLayer: "surface",
      recoverable: true,
      retryable: false,
      nextAction: "use_publish_action"
    });
  }
}

function lifePostMutationContext(
  request: FastifyRequest
): LifePostMutationContext {
  const revisionHeader = request.headers["x-life-post-revision"];
  return {
    canPublish: roleHasPermission(request.adminUser!.role, "life_posts:publish"),
    expectedRevision: lifePostRevisionHeaderSchema.parse(
      Array.isArray(revisionHeader) ? revisionHeader[0] : revisionHeader
    )
  };
}

async function deliverPublishNotification(input: {
  request: FastifyRequest;
  notificationService: NotificationService;
  post: Parameters<NotificationService["sendLifePostPublished"]>[0];
  notifyApp: boolean;
  notification: Parameters<NotificationService["sendLifePostPublished"]>[1];
}) {
  if (!input.notifyApp) {
    return { requested: false };
  }
  try {
    const result = isWeeklyBulletinPost(input.post)
      ? await input.notificationService.sendWeeklyBulletinPublished(
          input.post,
          input.notification
        )
      : await input.notificationService.sendLifePostPublished(
          input.post,
          input.notification
        );
    return {
      requested: true,
      type: isWeeklyBulletinPost(input.post)
        ? "weekly_bulletin_published"
        : "life_post_published",
      status: result.failed > 0 ? "retrying" : "sent",
      result
    };
  } catch (error) {
    input.request.log.warn(
      { err: error, postId: input.post.id },
      "Life post push notification failed after publish."
    );
    return {
      requested: true,
      status: "failed",
      error:
        error instanceof Error
          ? { message: error.message }
          : { message: "Notification delivery failed." }
    };
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodeFileNameHeader(value: string | undefined): string {
  if (!value) {
    return "life-image";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
