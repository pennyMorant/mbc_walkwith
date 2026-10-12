import { sermonDiscussionResponseCreateRequestSchema } from "@mbc/api-contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import { externalUserIdFromRequest } from "../../shared/http/external-user-id.js";
import {
  optionalMember
} from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import type { SermonDiscussionViewer } from "./sermon-discussion-guide.repository.js";
import type { SermonDiscussionGuideService } from "./sermon-discussion-guide.service.js";
import { contentLocaleFromHeader } from "../content-localization/content_locale.js";
import type { ContentLocalizationService } from "../content-localization/content-localization.service.js";

export async function registerSermonDiscussionGuideRoutes(
  app: FastifyInstance,
  service: SermonDiscussionGuideService,
  memberAuthService: MemberAuthService,
  localizations: ContentLocalizationService
) {
  const memberPreHandler = optionalMember(memberAuthService);

  app.get("/v1/sermons/:sermonId/discussion-guide", async (request) => {
    const params = sermonParamsSchema.parse(request.params);
    const guide = await service.getPublishedGuideForSermon(params.sermonId);
    const localized = await localizations.resolve("sermon_discussion_guide", guide.id, contentLocaleFromHeader(request.headers["accept-language"]), guide.revision);
    return ok(localized ? { ...guide, ...localized.fields } : guide);
  });

  app.post(
    "/v1/sermon-discussion-guides/:guideId/responses",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = guideParamsSchema.parse(request.params);
      const body = sermonDiscussionResponseCreateRequestSchema.parse(
        request.body ?? {}
      );
      return ok(
        await service.createResponse(
          params.guideId,
          viewerFromRequest(request),
          body
        )
      );
    }
  );
}

function viewerFromRequest(
  request: FastifyRequest
): SermonDiscussionViewer | null {
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

const sermonParamsSchema = z.object({
  sermonId: z.string()
});

const guideParamsSchema = z.object({
  guideId: z.string()
});
