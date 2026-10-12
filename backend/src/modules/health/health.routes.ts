import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { ok } from "../../shared/http/api-response.js";

export async function registerHealthRoutes(app: FastifyInstance, config: AppConfig) {
  app.get("/v1/health", async () => {
    return ok({
      ok: true,
      service: "mbc-walkwith-backend",
      data: {
        mode: config.useMockData ? "mock" : "postgres",
        databaseConfigured: Boolean(config.databaseUrl)
      },
      timestamp: new Date().toISOString()
    });
  });
}
