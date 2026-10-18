import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest
} from "@mbc/api-contracts";

import type {
  CreateMediaAssetInput,
  MediaRepository,
  UpdateMediaAssetRecordInput
} from "./media.repository.js";

type StoredMediaAsset = MediaAsset & { storageKey: string };

export class InMemoryMediaRepository implements MediaRepository {
  private readonly assets = new Map<string, StoredMediaAsset>();

  async create(input: CreateMediaAssetInput): Promise<MediaAsset> {
    const timestamp = new Date().toISOString();
    const asset: StoredMediaAsset = {
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.assets.set(asset.id, asset);
    return publicAsset(asset);
  }

  async getById(id: string): Promise<MediaAsset | null> {
    const asset = this.assets.get(id);
    return asset ? publicAsset(asset) : null;
  }

  async getStorageKey(id: string): Promise<string | null> {
    return this.assets.get(id)?.storageKey ?? null;
  }

  async getByIds(ids: string[]): Promise<MediaAsset[]> {
    return ids.flatMap((id) => {
      const asset = this.assets.get(id);
      return asset ? [publicAsset(asset)] : [];
    });
  }

  async list(query: MediaAssetListQuery): Promise<MediaAsset[]> {
    return [...this.assets.values()]
      .filter((asset) => !query.kind || asset.kind === query.kind)
      .filter(
        (asset) => !query.visibility || asset.visibility === query.visibility
      )
      .filter(
        (asset) =>
          !query.consentStatus || asset.consentStatus === query.consentStatus
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, query.limit)
      .map(publicAsset);
  }

  async update(
    id: string,
    input: UpdateMediaAssetRecordInput
  ): Promise<MediaAsset | null> {
    const asset = this.assets.get(id);
    if (!asset) {
      return null;
    }
    const updated: StoredMediaAsset = {
      ...asset,
      ...(input.consentStatus === undefined
        ? {}
        : { consentStatus: input.consentStatus }),
      ...(input.focalX === undefined ? {} : { focalX: input.focalX }),
      ...(input.focalY === undefined ? {} : { focalY: input.focalY }),
      ...(input.altText === undefined ? {} : { altText: input.altText }),
      ...(input.caption === undefined ? {} : { caption: input.caption }),
      ...(input.copyrightSource === undefined
        ? {}
        : { copyrightSource: input.copyrightSource }),
      ...(input.storageKey === undefined
        ? {}
        : { storageKey: input.storageKey }),
      ...(input.url === undefined ? {} : { url: input.url }),
      updatedAt: new Date().toISOString()
    };
    this.assets.set(id, updated);
    return publicAsset(updated);
  }
}

function publicAsset(asset: StoredMediaAsset): MediaAsset {
  const { storageKey: _storageKey, ...result } = asset;
  return result;
}
