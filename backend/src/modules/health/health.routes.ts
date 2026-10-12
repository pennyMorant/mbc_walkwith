import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../../config/env.js";
import { ok } from "../../shared/http/api-response.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
  config: AppConfig,
  probeDatabase: () => Promise<void>
) {
  app.get("/v1/health", async (_request, reply) => {
    let databaseReady = config.useMockData;
    if (!config.useMockData) {
      try {
        await probeDatabase();
        databaseReady = true;
      } catch (error) {
        app.log.error({ error }, "database readiness probe failed");
      }
    }

    const response = ok({
      ok: databaseReady,
      service: "mbc-walkwith-backend",
      data: {
        mode: config.useMockData ? "mock" : "postgres",
        databaseConfigured: Boolean(config.databaseUrl),
        databaseReady
      },
      timestamp: new Date().toISOString()
    });
    return databaseReady ? response : reply.code(503).send(response);
  });
}
