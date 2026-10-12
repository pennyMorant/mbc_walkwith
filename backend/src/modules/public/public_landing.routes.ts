import { publicLandingQuerySchema } from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { SettingsService } from "../settings/settings.service.js";
import { getPublicLandingContent } from "./public_landing_content.js";

export async function registerPublicLandingRoutes(
  app: FastifyInstance,
  settingsService: SettingsService
) {
  app.get("/v1/public/landing", async (request) => {
    const query = publicLandingQuerySchema.parse(request.query);
    return ok(await getPublicLandingContent(settingsService, query.locale));
  });
}
