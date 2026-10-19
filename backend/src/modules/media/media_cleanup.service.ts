import type {
  MediaCleanupListQuery,
  MediaCleanupTask
} from "@mbc/api-contracts";

import { isAppError } from "../../shared/http/app-error.js";
import type { MediaStorageService } from "./media-storage.service.js";
import { mediaCleanupNotReady } from "./media.errors.js";
import type {
  MediaCleanupRepository,
  MediaCleanupTaskRecord,
  ScheduleMediaCleanupInput
} from "./media_cleanup.repository.js";

export class MediaCleanupService {
  constructor(
    private readonly repository: MediaCleanupRepository,
    private readonly storage: MediaStorageService,
    private readonly now: () => Date = () => new Date()
  ) {}

  async list(query: MediaCleanupListQuery) {
    const tasks = await this.repository.list(query);
    return tasks.map((task) => toPublicTask(task, this.now()));
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
      return task ? this.process(task.id, true) : null;
    } catch {
      return null;
    }
  }

  retry(id: string) {
    return this.process(id, false);
  }

  private async process(
    id: string,
    allowActivePending: boolean
  ): Promise<MediaCleanupTask | null> {
    const task = await this.repository.getById(id);
    if (!task) return null;
    const now = this.now();
    if (task.status === "succeeded") return toPublicTask(task, now);
    if (
      task.status === "pending" &&
      !allowActivePending &&
      !isPendingRetryable(task, now)
    ) {
      throw mediaCleanupNotReady(task.id, retryAvailableAt(task).toISOString());
    }
    try {
      await this.storage.delete(task.storageKey);
      const completed = await this.repository.completeAttempt(task.id, {
        succeeded: true,
        error: null
      });
      return completed ? toPublicTask(completed, this.now()) : null;
    } catch (error) {
      const failed = await this.repository.completeAttempt(task.id, {
        succeeded: false,
        error: safeCleanupError(error)
      });
      return failed ? toPublicTask(failed, this.now()) : null;
    }
  }
}

function safeCleanupError(error: unknown): string {
  if (isAppError(error)) return `${error.code}: ${error.message}`;
  return "object_delete_failed: Media object deletion failed.";
}

const pendingRetryDelayMs = 15 * 60 * 1000;

function retryAvailableAt(task: MediaCleanupTaskRecord) {
  return new Date(new Date(task.createdAt).getTime() + pendingRetryDelayMs);
}

function isPendingRetryable(task: MediaCleanupTaskRecord, now: Date) {
  return now.getTime() >= retryAvailableAt(task).getTime();
}

function toPublicTask(
  task: MediaCleanupTaskRecord,
  now: Date
): MediaCleanupTask {
  const { storageKey: _storageKey, ...publicTask } = task;
  return {
    ...publicTask,
    retryable:
      task.status === "failed" ||
      (task.status === "pending" && isPendingRetryable(task, now))
  };
}
