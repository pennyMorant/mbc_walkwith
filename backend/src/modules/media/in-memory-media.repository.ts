import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest
} from "@mbc/api-contracts";

import type {
  CreateMediaAssetInput,
  MediaRepository,
  RelocateMediaAssetLifecycle,
  UpdateMediaAssetRecordInput
} from "./media.repository.js";
import type { MediaCleanupRepository } from "./media_cleanup.repository.js";

type StoredMediaAsset = MediaAsset & { storageKey: string };

export class InMemoryMediaRepository implements MediaRepository {
  private readonly assets = new Map<string, StoredMediaAsset>();

  constructor(
    private readonly cleanupRepository?: MediaCleanupRepository
  ) {}

  async create(
    input: CreateMediaAssetInput,
    cleanupTaskId?: string
  ): Promise<MediaAsset> {
    if (cleanupTaskId) {
      const task = await this.cleanupRepository?.getById(cleanupTaskId);
      if (
        !task ||
        task.mediaAssetId !== input.id ||
        task.storageKey !== input.storageKey
      ) {
        throw new Error("Media cleanup candidate was not found during binding.");
      }
      await this.cleanupRepository!.discardByStorageKey(input.storageKey);
    }
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

  async relocate(
    id: string,
    input: UpdateMediaAssetRecordInput,
    lifecycle: RelocateMediaAssetLifecycle
  ): Promise<MediaAsset | null> {
    const asset = this.assets.get(id);
    const targetTask = await this.cleanupRepository?.getById(
      lifecycle.targetCleanupTaskId
    );
    if (
      !asset ||
      asset.storageKey !== lifecycle.sourceStorageKey ||
      !input.storageKey ||
      input.storageKey !== lifecycle.targetStorageKey ||
      !targetTask ||
      targetTask.mediaAssetId !== id ||
      targetTask.storageKey !== lifecycle.targetStorageKey
    ) {
      return null;
    }
    await this.cleanupRepository!.discardByStorageKey(
      lifecycle.targetStorageKey
    );
    await this.cleanupRepository!.schedule({
      mediaAssetId: id,
      storageKey: lifecycle.sourceStorageKey,
      reason: "relocated_source"
    });
    return this.update(id, input);
  }
}

function publicAsset(asset: StoredMediaAsset): MediaAsset {
  const { storageKey: _storageKey, ...result } = asset;
  return result;
}
