import type {
  SermonAudioCleanupListQuery,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";

import { isAppError } from "../../shared/http/app-error.js";
import type { SermonAudioStorageService } from "./sermon-audio-storage.service.js";
import type {
  ScheduleSermonAudioCleanupInput,
  SermonAudioCleanupRepository,
  SermonAudioCleanupTaskRecord
} from "./sermon_audio_cleanup.repository.js";

export class SermonAudioCleanupService {
  constructor(
    private readonly repository: SermonAudioCleanupRepository,
    private readonly storage: SermonAudioStorageService
  ) {}

  list(query: SermonAudioCleanupListQuery) {
    return this.repository.list(query);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  schedule(input: ScheduleSermonAudioCleanupInput) {
    return this.repository.schedule(input);
  }

  async processByStoragePath(
    storagePath: string
  ): Promise<SermonAudioCleanupTask | null> {
    const task = await this.repository.getByStoragePath(storagePath);
    return task ? this.process(task.id) : null;
  }

  async processBestEffortByStoragePath(
    storagePath: string
  ): Promise<SermonAudioCleanupTask | null> {
    try {
      return await this.processByStoragePath(storagePath);
    } catch {
      return null;
    }
  }

  async retry(id: string): Promise<SermonAudioCleanupTask | null> {
    return this.process(id);
  }

  private async process(id: string): Promise<SermonAudioCleanupTask | null> {
    const task = await this.repository.getById(id);
    if (!task) {
      return null;
    }
    if (task.status === "succeeded") {
      return toPublicTask(task);
    }
    try {
      await this.storage.deleteAudio(task.storagePath);
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
  if (isAppError(error)) {
    return `${error.code}: ${error.message}`;
  }
  return "object_delete_failed: Audio object deletion failed.";
}

function toPublicTask(task: SermonAudioCleanupTaskRecord): SermonAudioCleanupTask {
  const { storagePath: _storagePath, ...publicTask } = task;
  return publicTask;
}
