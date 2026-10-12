import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { registerHealthRoutes } from "../src/modules/health/health.routes.js";
import { testConfig } from "./route_test_harness.js";

describe("health readiness", () => {
  it("returns 503 when the configured Postgres database cannot be reached", async () => {
    const app = Fastify({ logger: false });
    await registerHealthRoutes(
      app,
      {
        ...testConfig,
        useMockData: false,
        databaseUrl: "postgres://configured"
      },
      async () => {
        throw new Error("database unavailable");
      }
    );

    const response = await app.inject({ method: "GET", url: "/v1/health" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      data: {
        ok: false,
        data: {
          databaseConfigured: true,
          databaseReady: false,
          mode: "postgres"
        }
      }
    });
    await app.close();
  });
});
