import type { MediaCleanupListQuery } from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  MediaCleanupRepository,
  MediaCleanupTaskRecord,
  ScheduleMediaCleanupInput
} from "./media_cleanup.repository.js";

export class InMemoryMediaCleanupRepository
  implements MediaCleanupRepository
{
  private readonly tasks = new Map<string, MediaCleanupTaskRecord>();

  async schedule(
    input: ScheduleMediaCleanupInput
  ): Promise<MediaCleanupTaskRecord> {
    const existing = await this.getByStorageKey(input.storageKey);
    if (existing) return existing;
    const now = new Date().toISOString();
    const task: MediaCleanupTaskRecord = {
      id: randomUUID(),
      ...input,
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

  async list(query: MediaCleanupListQuery): Promise<MediaCleanupTaskRecord[]> {
    return [...this.tasks.values()]
      .filter((task) => !query.status || task.status === query.status)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, query.limit);
  }

  async getById(id: string): Promise<MediaCleanupTaskRecord | null> {
    return this.tasks.get(id) ?? null;
  }

  async getByStorageKey(
    storageKey: string
  ): Promise<MediaCleanupTaskRecord | null> {
    return (
      [...this.tasks.values()].find(
        (task) => task.storageKey === storageKey
      ) ?? null
    );
  }

  async discardByStorageKey(storageKey: string): Promise<void> {
    const task = await this.getByStorageKey(storageKey);
    if (task) this.tasks.delete(task.id);
  }

  async completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<MediaCleanupTaskRecord | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    const now = new Date().toISOString();
    const updated: MediaCleanupTaskRecord = {
      ...task,
      status: result.succeeded ? "succeeded" : "failed",
      attempts: task.attempts + 1,
      lastError: result.error,
      completedAt: result.succeeded ? now : null,
      updatedAt: now
    };
    this.tasks.set(id, updated);
    return updated;
  }
}
