import type {
  MediaCleanupListQuery,
  MediaCleanupTask
} from "@mbc/api-contracts";
import { desc, eq, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { mediaObjectCleanupTasks } from "../../shared/db/schema.js";
import type {
  MediaCleanupRepository,
  MediaCleanupTaskRecord,
  ScheduleMediaCleanupInput
} from "./media_cleanup.repository.js";

export class PostgresMediaCleanupRepository implements MediaCleanupRepository {
  constructor(private readonly db: AppDb) {}

  async schedule(
    input: ScheduleMediaCleanupInput
  ): Promise<MediaCleanupTaskRecord> {
    const [inserted] = await this.db
      .insert(mediaObjectCleanupTasks)
      .values(input)
      .onConflictDoNothing({ target: mediaObjectCleanupTasks.storageKey })
      .returning();
    if (inserted) return toRecord(inserted);
    const existing = await this.getByStorageKey(input.storageKey);
    if (!existing) throw new Error("Failed to schedule media cleanup.");
    return existing;
  }

  async list(query: MediaCleanupListQuery): Promise<MediaCleanupTask[]> {
    const rows = await this.db
      .select()
      .from(mediaObjectCleanupTasks)
      .where(
        query.status
          ? eq(mediaObjectCleanupTasks.status, query.status)
          : undefined
      )
      .orderBy(desc(mediaObjectCleanupTasks.updatedAt))
      .limit(query.limit);
    return rows.map((row) => toPublicTask(toRecord(row)));
  }

  async getById(id: string): Promise<MediaCleanupTaskRecord | null> {
    const [row] = await this.db
      .select()
      .from(mediaObjectCleanupTasks)
      .where(eq(mediaObjectCleanupTasks.id, id))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async getByStorageKey(
    storageKey: string
  ): Promise<MediaCleanupTaskRecord | null> {
    const [row] = await this.db
      .select()
      .from(mediaObjectCleanupTasks)
      .where(eq(mediaObjectCleanupTasks.storageKey, storageKey))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async discardByStorageKey(storageKey: string): Promise<void> {
    await this.db
      .delete(mediaObjectCleanupTasks)
      .where(eq(mediaObjectCleanupTasks.storageKey, storageKey));
  }

  async completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<MediaCleanupTaskRecord | null> {
    const now = new Date();
    const [row] = await this.db
      .update(mediaObjectCleanupTasks)
      .set({
        status: result.succeeded ? "succeeded" : "failed",
        attempts: sql`${mediaObjectCleanupTasks.attempts} + 1`,
        lastError: result.error,
        completedAt: result.succeeded ? now : null,
        updatedAt: now
      })
      .where(eq(mediaObjectCleanupTasks.id, id))
      .returning();
    return row ? toRecord(row) : null;
  }
}

type CleanupRow = typeof mediaObjectCleanupTasks.$inferSelect;

function toRecord(row: CleanupRow): MediaCleanupTaskRecord {
  return {
    id: row.id,
    mediaAssetId: row.mediaAssetId,
    storageKey: row.storageKey,
    reason: row.reason,
    status: row.status,
    attempts: row.attempts,
    lastError: row.lastError,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toPublicTask(task: MediaCleanupTaskRecord): MediaCleanupTask {
  const { storageKey: _storageKey, ...publicTask } = task;
  return publicTask;
}
