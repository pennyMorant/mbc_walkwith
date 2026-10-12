import type {
  Job,
  JobListQuery,
  JobStatsResponse,
  UpdateJobStatusRequest
} from "@mbc/api-contracts";

import type { JobListResult, JobRepository } from "./job.repository.js";

export class InMemoryJobRepository implements JobRepository {
  private jobs = new Map<string, Job>();

  constructor(initialJobs: Job[] = []) {
    for (const job of initialJobs) {
      this.jobs.set(job.id, job);
    }
  }

  async list(query: JobListQuery): Promise<JobListResult> {
    const rows = [...this.jobs.values()]
      .filter((job) => {
        if (query.cursor && job.createdAt >= query.cursor) {
          return false;
        }
        if (query.status && job.status !== query.status) {
          return false;
        }
        if (query.type && job.type !== query.type) {
          return false;
        }
        if (query.resourceType && job.resourceType !== query.resourceType) {
          return false;
        }
        if (query.resourceId && job.resourceId !== query.resourceId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pageRows = rows.slice(0, query.limit + 1);

    return {
      jobs: pageRows.slice(0, query.limit),
      nextCursor:
        pageRows.length > query.limit
          ? pageRows[query.limit]?.createdAt ?? null
          : null
    };
  }

  async getById(id: string): Promise<Job | null> {
    return this.jobs.get(id) ?? null;
  }

  async stats(): Promise<JobStatsResponse> {
    return buildJobStats([...this.jobs.values()]);
  }

  async updateStatus(
    id: string,
    input: UpdateJobStatusRequest
  ): Promise<Job | null> {
    const existing = this.jobs.get(id);
    if (!existing) {
      return null;
    }
    const now = new Date().toISOString();
    const updated: Job = {
      ...existing,
      status: input.status,
      result: input.result === undefined ? existing.result : input.result,
      errorMessage:
        input.errorMessage === undefined
          ? existing.errorMessage
          : input.errorMessage,
      attempts:
        input.status === "running" ? existing.attempts + 1 : existing.attempts,
      startedAt: input.status === "running" ? now : existing.startedAt,
      finishedAt: ["succeeded", "failed", "canceled"].includes(input.status)
        ? now
        : existing.finishedAt,
      updatedAt: now
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async cancel(id: string): Promise<Job | null> {
    return this.updateStatus(id, { status: "canceled" });
  }
}

function buildJobStats(jobs: Job[]): JobStatsResponse {
  const byStatus: JobStatsResponse["byStatus"] = {
    queued: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    canceled: 0
  };
  const byType = Object.fromEntries(
    [
      "transcript_import",
      "outline_generation",
      "scripture_extraction"
    ].map((type) => [type, 0])
  ) as JobStatsResponse["byType"];

  for (const job of jobs) {
    byStatus[job.status] += 1;
    byType[job.type] += 1;
  }

  const recent = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const failed = recent.filter((job) => job.status === "failed");
  return {
    byStatus,
    byType,
    retryableFailed: failed.filter((job) => job.attempts < job.maxAttempts)
      .length,
    exhaustedFailed: failed.filter((job) => job.attempts >= job.maxAttempts)
      .length,
    recentFailures: failed.slice(0, 5),
    recentRunning: recent.filter((job) => job.status === "running").slice(0, 5),
    recentSucceeded: recent
      .filter((job) => job.status === "succeeded")
      .slice(0, 5)
  };
}
