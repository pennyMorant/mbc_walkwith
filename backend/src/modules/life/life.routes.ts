import {
  type EventRegistration,
  eventCheckInCodeCheckInRequestSchema,
  eventRegistrationMemberUpdateRequestSchema,
  eventRegistrationRequestSchema,
  lifePostListQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import { lifeImageNotFound, lifePostNotFound } from "./life-post-errors.js";
import type { LifePostImageStorageService } from "./life-post-image-storage.service.js";
import type { LifePostService } from "./life-post.service.js";
import { contentLocaleFromHeader } from "../content-localization/content_locale.js";
import type { ContentLocalizationService } from "../content-localization/content-localization.service.js";

export async function registerLifeRoutes(
  app: FastifyInstance,
  service: LifePostService,
  imageStorageService: LifePostImageStorageService,
  memberAuthService: MemberAuthService,
  auditService: AuditService,
  contentLocalizationService: ContentLocalizationService
) {
  const memberPreHandler = requireMember(memberAuthService);

  app.get("/v1/life/posts", async (request) => {
    const query = lifePostListQuerySchema.parse(request.query);
    const posts = await service.listPublic({
      ...query,
      visibility: "public",
      status: "published"
    });
    return ok(await localizePosts(posts, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService));
  });

  app.get("/v1/life/posts/:postId", async (request, reply) => {
    const params = postParamsSchema.parse(request.params);
    const post = await service.getByIdForMember(params.postId);
    if (!post || post.visibility !== "public" || post.status !== "published") {
      throw lifePostNotFound(params.postId);
    }
    return ok(await localizePost(post, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService));
  });

  app.get(
    "/v1/member/life/posts",
    { preHandler: memberPreHandler },
    async (request) => {
      const query = lifePostListQuerySchema.parse(request.query);
      return ok(await localizePosts(await service.listForMember(query, request.member!.id), contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService));
    }
  );

  app.get(
    "/v1/member/life/posts/:postId",
    { preHandler: memberPreHandler },
    async (request, reply) => {
      const params = postParamsSchema.parse(request.params);
      const post = await service.getByIdForMemberWithRegistration(
        params.postId,
        request.member!.id
      );
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      return ok(await localizePost(post, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService));
    }
  );

  app.post(
    "/v1/member/life/posts/:postId/read",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const post = await service.markReadForMember(
        params.postId,
        request.member!.id
      );
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      return ok(post);
    }
  );

  app.post(
    "/v1/member/life/posts/:postId/register",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const body = eventRegistrationRequestSchema.parse(request.body ?? {});
      const registration = await service.registerForEvent(
        params.postId,
        request.member!,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "life_post.registration.member_register",
        resourceType: "event_registration",
        resourceId: registration.id,
        afterJson: registrationAuditSnapshot(registration)
      });
      return ok(
        await service.getByIdForMemberWithRegistration(
          params.postId,
          request.member!.id
        )
      );
    }
  );

  app.post(
    "/v1/member/life/posts/:postId/registration/cancel",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const registration = await service.cancelEventRegistration(
        params.postId,
        request.member!.id
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "life_post.registration.member_cancel",
        resourceType: "event_registration",
        resourceId: registration.id,
        afterJson: registrationAuditSnapshot(registration)
      });
      return ok(
        await service.getByIdForMemberWithRegistration(
          params.postId,
          request.member!.id
        )
      );
    }
  );

  app.patch(
    "/v1/member/life/posts/:postId/registration",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const body = eventRegistrationMemberUpdateRequestSchema.parse(
        request.body ?? {}
      );
      const registration = await service.updateEventRegistrationForMember(
        params.postId,
        request.member!.id,
        body
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "life_post.registration.member_update",
        resourceType: "event_registration",
        resourceId: registration.id,
        afterJson: registrationAuditSnapshot(registration)
      });
      return ok(
        await service.getByIdForMemberWithRegistration(
          params.postId,
          request.member!.id
        )
      );
    }
  );

  app.post(
    "/v1/member/life/check-in-code",
    { preHandler: memberPreHandler },
    async (request) => {
      const body = eventCheckInCodeCheckInRequestSchema.parse(
        request.body ?? {}
      );
      const result = await service.checkInEventRegistrationWithCode(
        body.code,
        request.member!.id
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "life_post.registration.qr_check_in",
        resourceType: "event_registration",
        resourceId: result.registration.id,
        afterJson: registrationAuditSnapshot(result.registration)
      });
      return ok(result);
    }
  );

  app.post(
    "/v1/member/life/posts/:postId/registration/check-in",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const registration = await service.checkInEventRegistrationForMember(
        params.postId,
        request.member!.id
      );
      await auditService.record({
        actorUserId: request.member!.id,
        action: "life_post.registration.member_check_in",
        resourceType: "event_registration",
        resourceId: registration.id,
        afterJson: registrationAuditSnapshot(registration)
      });
      return ok(
        await service.getByIdForMemberWithRegistration(
          params.postId,
          request.member!.id
        )
      );
    }
  );

  app.get("/v1/life/images/:fileName", async (request, reply) => {
    const params = imageParamsSchema.parse(request.params);
    const image = await imageStorageService.readImage(params.fileName);
    if (!image) {
      throw lifeImageNotFound(params.fileName);
    }
    return sendImage(reply, image);
  });
}

const postParamsSchema = z.object({
  postId: z.string()
});

const imageParamsSchema = z.object({
  fileName: z.string()
});

async function localizePosts<T extends { id: string }>(posts: T[], locale: import("@mbc/api-contracts").ContentLocale, service: LifePostService, localizations: ContentLocalizationService) {
  return Promise.all(posts.map((post) => localizePost(post, locale, service, localizations)));
}

async function localizePost<T extends { id: string }>(post: T, locale: import("@mbc/api-contracts").ContentLocale, service: LifePostService, localizations: ContentLocalizationService) {
  const source = await service.getById(post.id);
  return source ? localizations.project("life_post", post.id, locale, source.revision, post, ["title", "body", "meta", "ctaLabel"]) : post;
}

function sendImage(
  reply: FastifyReply,
  image: Awaited<ReturnType<LifePostImageStorageService["readImage"]>>
) {
  if (!image) {
    throw lifeImageNotFound("unknown");
  }
  reply.header("content-type", image.mimeType);
  reply.header("content-length", String(image.sizeBytes));
  reply.header("cache-control", "public, max-age=31536000, immutable");
  return reply.send(image.stream);
}

function registrationAuditSnapshot(registration: EventRegistration) {
  return {
    id: registration.id,
    lifePostId: registration.lifePostId,
    userId: registration.userId,
    status: registration.status,
    partySize: registration.partySize,
    checkedInAt: registration.checkedInAt,
    checkInMethod: registration.checkInMethod,
    hasAttendeeEmail: Boolean(registration.attendeeEmail),
    hasNote: registration.note.trim().length > 0
  };
}
