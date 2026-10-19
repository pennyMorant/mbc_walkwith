import type {
  MediaCleanupListQuery,
  MediaCleanupReason,
  MediaCleanupTask
} from "@mbc/api-contracts";

export type MediaCleanupTaskRecord = MediaCleanupTask & {
  storageKey: string;
};

export type ScheduleMediaCleanupInput = {
  mediaAssetId: string;
  storageKey: string;
  reason: MediaCleanupReason;
};

export interface MediaCleanupRepository {
  schedule(input: ScheduleMediaCleanupInput): Promise<MediaCleanupTaskRecord>;
  list(query: MediaCleanupListQuery): Promise<MediaCleanupTask[]>;
  getById(id: string): Promise<MediaCleanupTaskRecord | null>;
  getByStorageKey(storageKey: string): Promise<MediaCleanupTaskRecord | null>;
  discardByStorageKey(storageKey: string): Promise<void>;
  completeAttempt(
    id: string,
    result: { succeeded: boolean; error: string | null }
  ): Promise<MediaCleanupTaskRecord | null>;
}
