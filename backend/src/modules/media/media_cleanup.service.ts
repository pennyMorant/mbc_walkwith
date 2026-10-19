import type {
  MediaCleanupListQuery,
  MediaCleanupTask
} from "@mbc/api-contracts";

import { isAppError } from "../../shared/http/app-error.js";
import type { MediaStorageService } from "./media-storage.service.js";
import type {
  MediaCleanupRepository,
  MediaCleanupTaskRecord,
  ScheduleMediaCleanupInput
} from "./media_cleanup.repository.js";

export class MediaCleanupService {
  constructor(
    private readonly repository: MediaCleanupRepository,
    private readonly storage: MediaStorageService
  ) {}

  list(query: MediaCleanupListQuery) {
    return this.repository.list(query);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  schedule(input: ScheduleMediaCleanupInput) {
    return this.repository.schedule(input);
  }

  async processBestEffortByStorageKey(
    storageKey: string
  ): Promise<MediaCleanupTask | null> {
    try {
      const task = await this.repository.getByStorageKey(storageKey);
      return task ? this.process(task.id) : null;
    } catch {
      return null;
    }
  }

  retry(id: string) {
    return this.process(id);
  }

  private async process(id: string): Promise<MediaCleanupTask | null> {
    const task = await this.repository.getById(id);
    if (!task) return null;
    if (task.status === "succeeded") return toPublicTask(task);
    try {
      await this.storage.delete(task.storageKey);
      const completed = await this.repository.completeAttempt(task.id, {
        succeeded: true,
        error: null
      });
      return completed ? toPublicTask(completed) : null;
    } catch (error) {
      const failed = await this.repository.completeAttempt(task.id, {
        succeeded: false,
        error: safeCleanupError(error)
      });
      return failed ? toPublicTask(failed) : null;
    }
  }
}

function safeCleanupError(error: unknown): string {
  if (isAppError(error)) return `${error.code}: ${error.message}`;
  return "object_delete_failed: Media object deletion failed.";
}

function toPublicTask(task: MediaCleanupTaskRecord): MediaCleanupTask {
  const { storageKey: _storageKey, ...publicTask } = task;
  return publicTask;
}
