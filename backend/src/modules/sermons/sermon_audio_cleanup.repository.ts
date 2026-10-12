import type {
  SermonAudioCleanupListQuery,
  SermonAudioCleanupReason,
  SermonAudioCleanupTask
} from "@mbc/api-contracts";

export type SermonAudioCleanupTaskRecord = SermonAudioCleanupTask & {
  storagePath: string;
};

export type ScheduleSermonAudioCleanupInput = {
  sermonId: string;
  storagePath: string;
  reason: SermonAudioCleanupReason;
};

export interface SermonAudioCleanupRepository {
  schedule(
    input: ScheduleSermonAudioCleanupInput
  ): Promise<SermonAudioCleanupTaskRecord>;
  list(query: SermonAudioCleanupListQuery): Promise<SermonAudioCleanupTask[]>;
  getById(id: string): Promise<SermonAudioCleanupTaskRecord | null>;
  getByStoragePath(
    storagePath: string
  ): Promise<SermonAudioCleanupTaskRecord | null>;
  discardByStoragePath(storagePath: string): Promise<void>;
  completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<SermonAudioCleanupTaskRecord | null>;
}
