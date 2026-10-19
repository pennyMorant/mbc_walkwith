import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest
} from "@mbc/api-contracts";

export type CreateMediaAssetInput = Omit<
  MediaAsset,
  "createdAt" | "updatedAt"
> & {
  storageKey: string;
};

export type UpdateMediaAssetRecordInput = MediaAssetUpdateRequest & {
  storageKey?: string;
  url?: string | null;
};

export type RelocateMediaAssetLifecycle = {
  targetCleanupTaskId: string;
  targetStorageKey: string;
  sourceStorageKey: string;
};

export interface MediaRepository {
  create(
    input: CreateMediaAssetInput,
    cleanupTaskId?: string
  ): Promise<MediaAsset>;
  getById(id: string): Promise<MediaAsset | null>;
  getStorageKey(id: string): Promise<string | null>;
  getByIds(ids: string[]): Promise<MediaAsset[]>;
  list(query: MediaAssetListQuery): Promise<MediaAsset[]>;
  update(
    id: string,
    input: UpdateMediaAssetRecordInput
  ): Promise<MediaAsset | null>;
  relocate(
    id: string,
    input: UpdateMediaAssetRecordInput,
    lifecycle: RelocateMediaAssetLifecycle
  ): Promise<MediaAsset | null>;
}
