import type {
  SermonAudioCleanupListQuery,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  ScheduleSermonAudioCleanupInput,
  SermonAudioCleanupRepository,
  SermonAudioCleanupTaskRecord
} from "./sermon_audio_cleanup.repository.js";

export class InMemorySermonAudioCleanupRepository
  implements SermonAudioCleanupRepository
{
  private readonly tasks = new Map<string, SermonAudioCleanupTaskRecord>();

  async schedule(
    input: ScheduleSermonAudioCleanupInput
  ): Promise<SermonAudioCleanupTaskRecord> {
    const existing = await this.getByStoragePath(input.storagePath);
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const task: SermonAudioCleanupTaskRecord = {
      id: randomUUID(),
      sermonId: input.sermonId,
      storagePath: input.storagePath,
      reason: input.reason,
      status: "pending",
      attempts: 0,
      lastError: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async list(
    query: SermonAudioCleanupListQuery
  ): Promise<SermonAudioCleanupTask[]> {
    return [...this.tasks.values()]
      .filter((task) => !query.status || task.status === query.status)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, query.limit)
      .map(toPublicTask);
  }

  async getById(id: string): Promise<SermonAudioCleanupTaskRecord | null> {
    return this.tasks.get(id) ?? null;
  }

  async getByStoragePath(
    storagePath: string
  ): Promise<SermonAudioCleanupTaskRecord | null> {
    return (
      [...this.tasks.values()].find(
        (task) => task.storagePath === storagePath
      ) ?? null
    );
  }

  async discardByStoragePath(storagePath: string): Promise<void> {
    const existing = await this.getByStoragePath(storagePath);
    if (existing) {
      this.tasks.delete(existing.id);
    }
  }

  async completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<SermonAudioCleanupTaskRecord | null> {
    const existing = this.tasks.get(id);
    if (!existing) {
      return null;
    }
    const now = new Date().toISOString();
    const updated: SermonAudioCleanupTaskRecord = {
      ...existing,
      status: result.succeeded ? "succeeded" : "failed",
      attempts: existing.attempts + 1,
      lastError: result.error,
      completedAt: result.succeeded ? now : null,
      updatedAt: now
    };
    this.tasks.set(id, updated);
    return updated;
  }
}

function toPublicTask(task: SermonAudioCleanupTaskRecord): SermonAudioCleanupTask {
  const { storagePath: _storagePath, ...publicTask } = task;
  return publicTask;
}
