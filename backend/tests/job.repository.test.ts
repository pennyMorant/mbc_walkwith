import type { Job } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemoryJobRepository } from "../src/modules/jobs/in-memory-job.repository.js";

describe("InMemoryJobRepository", () => {
  it("lists seeded historical jobs by status", async () => {
    const queued = makeJob({
      id: "job-queued",
      status: "queued",
      type: "transcript_import"
    });
    const repository = new InMemoryJobRepository([queued]);

    const result = await repository.list({ limit: 20, status: "queued" });

    expect(result.jobs.map((row) => row.id)).toContain(queued.id);
  });

  it("tracks status transitions for historical diagnostics", async () => {
    const repository = new InMemoryJobRepository([
      makeJob({
        id: "job-outline",
        status: "queued",
        type: "outline_generation"
      })
    ]);

    const running = await repository.updateStatus("job-outline", {
      status: "running"
    });
    expect(running?.attempts).toBe(1);
    expect(running?.startedAt).toEqual(expect.any(String));

    const failed = await repository.updateStatus("job-outline", {
      status: "failed",
      errorMessage: "Local package missing outline."
    });
    expect(failed?.finishedAt).toEqual(expect.any(String));
    expect(failed?.errorMessage).toBe("Local package missing outline.");
  });

  it("summarizes historical job diagnostics", async () => {
    const failed = makeJob({
      id: "job-failed",
      type: "outline_generation",
      status: "failed",
      attempts: 1,
      maxAttempts: 2,
      errorMessage: "Local package missing outline."
    });
    const repository = new InMemoryJobRepository([
      makeJob({
        id: "job-queued",
        type: "transcript_import",
        status: "queued",
        payload: {
          text: "Manual transcript.",
          source: "manual"
        }
      }),
      failed
    ]);

    const stats = await repository.stats();

    expect(stats.byStatus.queued).toBe(1);
    expect(stats.byStatus.failed).toBe(1);
    expect(stats.byType.transcript_import).toBe(1);
    expect(stats.byType.outline_generation).toBe(1);
    expect(stats.retryableFailed).toBe(1);
    expect(stats.exhaustedFailed).toBe(0);
    expect(stats.recentFailures[0]?.id).toBe(failed.id);
  });
});

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = "2026-01-02T03:04:05.000Z";
  return {
    id: "job-1",
    type: "transcript_import",
    status: "queued",
    resourceType: "sermon",
    resourceId: "sermon-1",
    payload: {},
    result: null,
    errorMessage: null,
    attempts: 0,
    maxAttempts: 3,
    availableAt: now,
    startedAt: null,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}
