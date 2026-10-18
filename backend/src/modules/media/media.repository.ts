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

export interface MediaRepository {
  create(input: CreateMediaAssetInput): Promise<MediaAsset>;
  getById(id: string): Promise<MediaAsset | null>;
  getStorageKey(id: string): Promise<string | null>;
  list(query: MediaAssetListQuery): Promise<MediaAsset[]>;
  update(
    id: string,
    input: MediaAssetUpdateRequest
  ): Promise<MediaAsset | null>;
}
