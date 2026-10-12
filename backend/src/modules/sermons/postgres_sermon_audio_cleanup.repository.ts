import type {
  SermonAudioCleanupListQuery,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";
import { desc, eq, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { sermonAudioCleanupTasks } from "../../shared/db/schema.js";
import type {
  ScheduleSermonAudioCleanupInput,
  SermonAudioCleanupRepository,
  SermonAudioCleanupTaskRecord
} from "./sermon_audio_cleanup.repository.js";

export class PostgresSermonAudioCleanupRepository
  implements SermonAudioCleanupRepository
{
  constructor(private readonly db: AppDb) {}

  async schedule(
    input: ScheduleSermonAudioCleanupInput
  ): Promise<SermonAudioCleanupTaskRecord> {
    const [inserted] = await this.db
      .insert(sermonAudioCleanupTasks)
      .values(input)
      .onConflictDoNothing({ target: sermonAudioCleanupTasks.storagePath })
      .returning();
    if (inserted) {
      return toRecord(inserted);
    }
    const existing = await this.getByStoragePath(input.storagePath);
    if (!existing) {
      throw new Error("Failed to schedule sermon audio cleanup.");
    }
    return existing;
  }

  async list(
    query: SermonAudioCleanupListQuery
  ): Promise<SermonAudioCleanupTask[]> {
    const rows = await this.db
      .select()
      .from(sermonAudioCleanupTasks)
      .where(
        query.status ? eq(sermonAudioCleanupTasks.status, query.status) : undefined
      )
      .orderBy(desc(sermonAudioCleanupTasks.updatedAt))
      .limit(query.limit);
    return rows.map((row) => toPublicTask(toRecord(row)));
  }

  async getById(id: string): Promise<SermonAudioCleanupTaskRecord | null> {
    const [row] = await this.db
      .select()
      .from(sermonAudioCleanupTasks)
      .where(eq(sermonAudioCleanupTasks.id, id))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async getByStoragePath(
    storagePath: string
  ): Promise<SermonAudioCleanupTaskRecord | null> {
    const [row] = await this.db
      .select()
      .from(sermonAudioCleanupTasks)
      .where(eq(sermonAudioCleanupTasks.storagePath, storagePath))
      .limit(1);
    return row ? toRecord(row) : null;
  }

  async discardByStoragePath(storagePath: string): Promise<void> {
    await this.db
      .delete(sermonAudioCleanupTasks)
      .where(eq(sermonAudioCleanupTasks.storagePath, storagePath));
  }

  async completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<SermonAudioCleanupTaskRecord | null> {
    const now = new Date();
    const [row] = await this.db
      .update(sermonAudioCleanupTasks)
      .set({
        status: result.succeeded ? "succeeded" : "failed",
        attempts: sql`${sermonAudioCleanupTasks.attempts} + 1`,
        lastError: result.error,
        completedAt: result.succeeded ? now : null,
        updatedAt: now
      })
      .where(eq(sermonAudioCleanupTasks.id, id))
      .returning();
    return row ? toRecord(row) : null;
  }
}

type CleanupRow = typeof sermonAudioCleanupTasks.$inferSelect;

function toRecord(row: CleanupRow): SermonAudioCleanupTaskRecord {
  return {
    id: row.id,
    sermonId: row.sermonId,
    storagePath: row.storagePath,
    reason: row.reason,
    status: row.status,
    attempts: row.attempts,
    lastError: row.lastError,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toPublicTask(task: SermonAudioCleanupTaskRecord): SermonAudioCleanupTask {
  const { storagePath: _storagePath, ...publicTask } = task;
  return publicTask;
}
