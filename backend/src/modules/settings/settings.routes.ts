import { appSettingListQuerySchema } from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import type { SettingsService } from "./settings.service.js";

export async function registerSettingsRoutes(
  app: FastifyInstance,
  service: SettingsService
) {
  app.get("/v1/settings/public", async (request) => {
    const query = appSettingListQuerySchema.parse(request.query);
    return ok({ items: await service.listPublic(query) });
  });
}
