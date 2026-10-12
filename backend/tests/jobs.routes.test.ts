import {
  jobListResponseSchema,
  jobStatsResponseSchema,
  sermonProductionPipelineStatusResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("job routes", () => {
  it("exposes read-only job diagnostics and local sermon processing readiness", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/jobs?status=queued",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const jobs = expectResponseData(
      listResponse,
      jobListResponseSchema,
      "admin job list"
    );
    expect(jobs.items).toEqual([]);

    const statsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/jobs/stats",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statsResponse.statusCode).toBe(200);
    const stats = expectResponseData(
      statsResponse,
      jobStatsResponseSchema,
      "admin job stats"
    );
    expect(stats.byStatus.queued).toBe(0);
    expect(stats.byType.transcript_import).toBe(0);

    const missingJobResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/jobs/missing-job",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(missingJobResponse.statusCode).toBe(404);
    expect(missingJobResponse.json().error).toMatchObject({
      code: "job_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        jobId: "missing-job"
      }
    });

    const pipelineStatusResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/jobs/sermon-pipeline-status",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(pipelineStatusResponse.statusCode).toBe(200);
    const pipelineStatus = expectResponseData(
      pipelineStatusResponse,
      sermonProductionPipelineStatusResponseSchema,
      "sermon production pipeline status"
    );
    expect(pipelineStatus.ready).toBe(false);
    expect(
      pipelineStatus.checks.map((check: { id: string }) => check.id)
    ).toEqual(["data_store", "audio_storage", "local_processing"]);

    await harness.close();
  });
});
