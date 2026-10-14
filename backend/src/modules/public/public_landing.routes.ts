import {
  publicLandingQuerySchema,
  type PublicLandingEvent,
  type SupportedLocale
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { ContentLocalizationService } from "../content-localization/content-localization.service.js";
import type { LifePostService } from "../life/life-post.service.js";
import type { SettingsService } from "../settings/settings.service.js";
import { getPublicLandingContent } from "./public_landing_content.js";

export async function registerPublicLandingRoutes(
  app: FastifyInstance,
  settingsService: SettingsService,
  lifePostService: LifePostService,
  contentLocalizationService: ContentLocalizationService
) {
  app.get("/v1/public/landing", async (request) => {
    const query = publicLandingQuerySchema.parse(request.query);
    const events = await listLandingEvents(
      lifePostService,
      contentLocalizationService,
      query.locale
    );
    return ok(
      await getPublicLandingContent(settingsService, query.locale, events)
    );
  });
}

async function listLandingEvents(
  lifePostService: LifePostService,
  contentLocalizationService: ContentLocalizationService,
  locale: SupportedLocale
): Promise<PublicLandingEvent[]> {
  const posts = await lifePostService.list({
    limit: 12,
    type: "event",
    sort: "starts_at_asc",
    from: new Date().toISOString(),
    visibility: "public",
    status: "published"
  });
  const localizedPosts = await Promise.all(
    posts.map((post) =>
      contentLocalizationService.project(
        "life_post",
        post.id,
        locale,
        post.revision,
        post,
        ["title", "body", "meta", "ctaLabel"]
      )
    )
  );
  return localizedPosts.map((post) => ({
    id: post.id,
    title: post.title,
    summary: eventSummary(post.meta, post.body),
    startsAt: post.startsAt,
    endsAt: post.endsAt,
    imageUrl: post.imageUrl,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl
  }));
}

function eventSummary(meta: string, body: string) {
  const value = (meta.trim() || body.trim()).replace(/\s+/g, " ");
  return value.length > 180 ? `${value.slice(0, 177)}...` : value;
}
