import {
  sermonDiscoveryFacetsSchema,
  sermonListQuerySchema,
  sermonProgressUpdateRequestSchema,
  sermonRecommendationQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { listMeta, ok } from "../../shared/http/api-response.js";
import { externalUserIdFromRequest } from "../../shared/http/external-user-id.js";
import { optionalMember } from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import type { SermonService } from "./sermon.service.js";
import { mediaMissing, sermonNotFound } from "./sermon-errors.js";
import type { SermonProgressViewer } from "./sermon_progress.repository.js";
import type { SermonProgressService } from "./sermon_progress.service.js";
import { contentLocaleFromHeader } from "../content-localization/content_locale.js";
import type { ContentLocalizationService } from "../content-localization/content-localization.service.js";

export async function registerSermonRoutes(
  app: FastifyInstance,
  service: SermonService,
  progressService: SermonProgressService,
  memberAuthService: MemberAuthService,
  contentLocalizationService: ContentLocalizationService
) {
  const memberPreHandler = optionalMember(memberAuthService);
  app.get("/v1/sermons", async (request) => {
    const query = sermonListQuerySchema.parse(request.query);
    const result = await service.listPublished(query);
    return ok(
      { items: await localizeSermons(result.sermons, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService), nextCursor: result.nextCursor },
      listMeta(query.limit, result.nextCursor)
    );
  });

  app.get("/v1/sermons/recommendations", async (request) => {
    const query = sermonRecommendationQuerySchema.parse(request.query);
    const sermons = await service.publishedRecommendations(query);
    return ok({ items: await localizeSermons(sermons, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService) });
  });

  app.get("/v1/sermons/facets", async () => {
    return ok(
      sermonDiscoveryFacetsSchema.parse(await service.discoveryFacets())
    );
  });

  app.get("/v1/sermons/:sermonId", async (request) => {
    const params = z.object({ sermonId: z.string() }).parse(request.params);
    const sermon = await service.getPublishedById(params.sermonId);
    if (!sermon) {
      throw sermonNotFound(params.sermonId);
    }
    return ok(await localizeSermon(sermon, contentLocaleFromHeader(request.headers["accept-language"]), service, contentLocalizationService));
  });

  app.get("/v1/sermons/:sermonId/audio", async (request, reply) => {
    const params = z.object({ sermonId: z.string() }).parse(request.params);
    const sermon = await service.getPublishedById(params.sermonId);
    if (!sermon) {
      throw sermonNotFound(params.sermonId);
    }
    const audio = await service.readAudio(
      params.sermonId,
      headerValue(request.headers.range)
    );
    if (!audio) {
      throw mediaMissing(params.sermonId);
    }
    return sendAudio(reply, audio);
  });

  app.get(
    "/v1/sermons/:sermonId/progress",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      return ok(
        await progressService.get(
          params.sermonId,
          sermonProgressViewerFromRequest(request)
        )
      );
    }
  );

  app.post(
    "/v1/sermons/:sermonId/progress",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const body = sermonProgressUpdateRequestSchema.parse(request.body ?? {});
      return ok(
        await progressService.save(
          params.sermonId,
          sermonProgressViewerFromRequest(request),
          body
        )
      );
    }
  );
}

const sermonParamsSchema = z.object({ sermonId: z.string() });

async function localizeSermons<T extends { id: string }>(sermons: T[], locale: import("@mbc/api-contracts").ContentLocale, service: SermonService, localizations: ContentLocalizationService) {
  return Promise.all(sermons.map((sermon) => localizeSermon(sermon, locale, service, localizations)));
}

async function localizeSermon<T extends { id: string }>(sermon: T, locale: import("@mbc/api-contracts").ContentLocale, service: SermonService, localizations: ContentLocalizationService) {
  const source = await service.getById(sermon.id);
  if (!source) return sermon;
  const localized = await localizations.resolve("sermon", sermon.id, locale, source.revision);
  if (!localized) return sermon;
  const fields = localized.fields;
  return {
    ...sermon,
    ...(fields.title ? { title: fields.title } : {}),
    ...(fields.summary ? { summary: fields.summary } : {}),
    ...(fields.transcriptText && "transcript" in sermon && sermon.transcript
      ? { transcript: { ...sermon.transcript, text: fields.transcriptText } }
      : {})
  };
}

function sermonProgressViewerFromRequest(
  request: FastifyRequest
): SermonProgressViewer | null {
  if (request.member) {
    return { userType: "member", userId: request.member.id };
  }
  const externalUserId = externalUserIdFromRequest(request);
  return externalUserId
    ? { userType: "external", userId: externalUserId }
    : null;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function sendAudio(
  reply: FastifyReply,
  audio: NonNullable<Awaited<ReturnType<SermonService["readAudio"]>>>
) {
  reply.header("accept-ranges", "bytes");
  reply.header("content-type", audio.mimeType);
  reply.header(
    "content-length",
    String(audio.rangeEnd - audio.rangeStart + 1)
  );
  if (audio.partial) {
    reply.code(206);
    reply.header(
      "content-range",
      `bytes ${audio.rangeStart}-${audio.rangeEnd}/${audio.sizeBytes}`
    );
  }
  return reply.send(audio.stream);
}
