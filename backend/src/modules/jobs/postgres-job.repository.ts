import type {
  Job,
  JobListQuery,
  JobStatus,
  JobStatsResponse,
  JobType,
  UpdateJobStatusRequest
} from "@mbc/api-contracts";
import { and, desc, eq, lt } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { jobs } from "../../shared/db/schema.js";
import type { JobListResult, JobRepository } from "./job.repository.js";

export class PostgresJobRepository implements JobRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: JobListQuery): Promise<JobListResult> {
    const filters = [
      query.status ? eq(jobs.status, query.status) : undefined,
      query.type ? eq(jobs.type, query.type) : undefined,
      query.resourceType ? eq(jobs.resourceType, query.resourceType) : undefined,
      query.resourceId ? eq(jobs.resourceId, query.resourceId) : undefined,
      query.cursor ? lt(jobs.createdAt, new Date(query.cursor)) : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await this.db
      .select()
      .from(jobs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(query.limit + 1);

    return {
      jobs: rows.slice(0, query.limit).map(jobFromRow),
      nextCursor:
        rows.length > query.limit
          ? rows[query.limit]?.createdAt.toISOString() ?? null
          : null
    };
  }

  async getById(id: string): Promise<Job | null> {
    const [row] = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    return row ? jobFromRow(row) : null;
  }

  async stats(): Promise<JobStatsResponse> {
    const rows = await this.db.select().from(jobs);
    return buildJobStats(rows.map(jobFromRow));
  }

  async updateStatus(
    id: string,
    input: UpdateJobStatusRequest
  ): Promise<Job | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const now = new Date();
    const existingStartedAt = dateFromIso(existing.startedAt);
    const existingFinishedAt = dateFromIso(existing.finishedAt);
    const [row] = await this.db
      .update(jobs)
      .set({
        status: input.status,
        result: input.result === undefined ? existing.result : input.result,
        errorMessage:
          input.errorMessage === undefined
            ? existing.errorMessage
            : input.errorMessage,
        attempts:
          input.status === "running" ? existing.attempts + 1 : existing.attempts,
        startedAt: input.status === "running" ? now : existingStartedAt,
        finishedAt: ["succeeded", "failed", "canceled"].includes(input.status)
          ? now
          : existingFinishedAt,
        updatedAt: now
      })
      .where(eq(jobs.id, id))
      .returning();
    return row ? jobFromRow(row) : null;
  }

  async cancel(id: string): Promise<Job | null> {
    return this.updateStatus(id, { status: "canceled" });
  }
}

function buildJobStats(rows: Job[]): JobStatsResponse {
  const byStatus = Object.fromEntries(
    jobStatuses.map((status) => [status, 0])
  ) as JobStatsResponse["byStatus"];
  const byType = Object.fromEntries(
    jobTypes.map((type) => [type, 0])
  ) as JobStatsResponse["byType"];

  for (const job of rows) {
    byStatus[job.status] += 1;
    byType[job.type] += 1;
  }

  const recent = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

const jobStatuses: JobStatus[] = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled"
];

const jobTypes: JobType[] = [
  "transcript_import",
  "outline_generation",
  "scripture_extraction"
];

type JobRow = typeof jobs.$inferSelect;

function jobFromRow(row: JobRow): Job {
  return {
    id: row.id,
    type: row.type as Job["type"],
    status: row.status as Job["status"],
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    payload: recordFromJson(row.payload),
    result: row.result === null ? null : recordFromJson(row.result),
    errorMessage: row.errorMessage,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    availableAt: row.availableAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function recordFromJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function dateFromIso(value: string | null): Date | null {
  return value === null ? null : new Date(value);
}
