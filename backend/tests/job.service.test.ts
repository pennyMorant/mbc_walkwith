import type { Job } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemoryJobRepository } from "../src/modules/jobs/in-memory-job.repository.js";
import { JobService } from "../src/modules/jobs/job.service.js";

describe("JobService", () => {
  it("only allows queued or running historical jobs to be canceled", async () => {
    const queued = makeJob({ id: "queued-job", status: "queued" });
    const running = makeJob({ id: "running-job", status: "running" });
    const failed = makeJob({
      id: "failed-job",
      type: "outline_generation",
      status: "failed"
    });
    const jobs = new JobService(
      new InMemoryJobRepository([queued, running, failed])
    );

    const canceled = await jobs.cancel(queued.id);
    expect(canceled?.status).toBe("canceled");
    await expect(jobs.cancel(canceled?.id ?? "")).resolves.toMatchObject({
      status: "canceled"
    });

    const canceledRunning = await jobs.cancel(running.id);
    expect(canceledRunning?.status).toBe("canceled");

    await expect(jobs.cancel(failed.id)).rejects.toMatchObject({
      name: "AppError",
      code: "job_cancel_invalid_state",
      statusCode: 409,
      category: "state_conflict",
      evidence: {
        jobId: failed.id,
        jobType: "outline_generation"
      },
      nextAction: "refresh"
    });
  });

  it("keeps job status updates available for historical diagnostics", async () => {
    const diagnostic = makeJob({
      id: "diagnostic-job",
      type: "outline_generation",
      status: "queued",
      maxAttempts: 1
    });
    const jobs = new JobService(new InMemoryJobRepository([diagnostic]));

    const failed = await jobs.updateStatus(diagnostic.id, {
      status: "failed",
      errorMessage: "Local package missing outline."
    });

    expect(failed?.status).toBe("failed");
    expect(failed?.errorMessage).toBe("Local package missing outline.");
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
