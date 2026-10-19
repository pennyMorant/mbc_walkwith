import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest,
  MediaAssetUploadMetadata
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { MediaRepository } from "./media.repository.js";
import type { MediaStorageService } from "./media-storage.service.js";
import type { MediaCleanupService } from "./media_cleanup.service.js";
import {
  mediaAssetNotFound,
  mediaImageInvalid,
  mediaImageTooLarge,
  mediaImageUnsupportedType
} from "./media.errors.js";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);

export type UploadMediaImageInput = MediaAssetUploadMetadata & {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export class MediaService {
  constructor(
    private readonly repository: MediaRepository,
    private readonly storage: MediaStorageService,
    private readonly cleanupService: MediaCleanupService
  ) {}

  async uploadImage(input: UploadMediaImageInput): Promise<MediaAsset> {
    const mimeType = input.mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
    validateImage(input.buffer, mimeType);
    const id = randomUUID();
    const stored = await this.storage.put({
      id,
      kind: "image",
      publicAccess: isPubliclyAccessible(
        input.visibility,
        input.consentStatus
      ),
      fileName: input.fileName,
      mimeType,
      buffer: input.buffer
    });
    let cleanupTask;
    try {
      cleanupTask = await this.cleanupService.schedule({
        mediaAssetId: id,
        storageKey: stored.storageKey,
        reason: "unbound_upload"
      });
    } catch (error) {
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }
    try {
      return await this.repository.create(
        {
          id,
          kind: "image",
          visibility: input.visibility,
          consentStatus: input.consentStatus,
          storageKey: stored.storageKey,
          url: stored.publicUrl,
          originalFileName: input.fileName,
          mimeType,
          sizeBytes: input.buffer.length,
          width: null,
          height: null,
          focalX: 50,
          focalY: 50,
          altText: input.altText,
          caption: input.caption,
          copyrightSource: input.copyrightSource
        },
        cleanupTask.id
      );
    } catch (error) {
      await this.cleanupService.processBestEffortByStorageKey(stored.storageKey);
      throw error;
    }
  }

  list(query: MediaAssetListQuery) {
    return this.repository.list(query);
  }

  async getById(id: string) {
    const asset = await this.repository.getById(id);
    if (!asset) {
      throw mediaAssetNotFound(id);
    }
    return asset;
  }

  async findPublicById(id: string) {
    const asset = await this.repository.getById(id);
    if (
      !asset ||
      asset.visibility !== "public" ||
      asset.consentStatus !== "approved" ||
      !asset.url
    ) {
      return null;
    }
    return asset;
  }

  async findPublicByIds(ids: string[]) {
    const assets = await this.repository.getByIds(ids);
    return new Map(
      assets
        .filter(
          (asset) =>
            asset.visibility === "public" &&
            asset.consentStatus === "approved" &&
            Boolean(asset.url)
        )
        .map((asset) => [asset.id, asset])
    );
  }

  async update(id: string, input: MediaAssetUpdateRequest) {
    const before = await this.getById(id);
    const consentStatus = input.consentStatus ?? before.consentStatus;
    const wasPublic = isPubliclyAccessible(
      before.visibility,
      before.consentStatus
    );
    const willBePublic = isPubliclyAccessible(
      before.visibility,
      consentStatus
    );
    if (wasPublic === willBePublic) {
      const asset = await this.repository.update(id, input);
      if (!asset) {
        throw mediaAssetNotFound(id);
      }
      return asset;
    }

    const storageKey = await this.repository.getStorageKey(id);
    if (!storageKey) {
      throw mediaAssetNotFound(id);
    }
    const relocationInput = {
      id: before.id,
      kind: before.kind,
      mimeType: before.mimeType,
      publicAccess: willBePublic
    };
    const relocation = this.storage.planRelocation(
      storageKey,
      relocationInput
    );
    if (!relocation.requiresCopy) {
      const asset = await this.repository.update(id, {
        ...input,
        storageKey: relocation.storageKey,
        url: relocation.publicUrl
      });
      if (!asset) throw mediaAssetNotFound(id);
      return asset;
    }

    const targetCleanup = await this.cleanupService.schedule({
      mediaAssetId: id,
      storageKey: relocation.storageKey,
      reason: "unbound_upload"
    });
    try {
      await this.storage.copyRelocation(relocation, relocationInput);
    } catch (error) {
      await this.cleanupService.processBestEffortByStorageKey(
        relocation.storageKey
      );
      throw error;
    }

    let asset: MediaAsset | null;
    try {
      asset = await this.repository.relocate(
        id,
        {
          ...input,
          storageKey: relocation.storageKey,
          url: relocation.publicUrl
        },
        {
          targetCleanupTaskId: targetCleanup.id,
          targetStorageKey: relocation.storageKey,
          sourceStorageKey: relocation.sourceStorageKey
        }
      );
    } catch (error) {
      await this.cleanupService.processBestEffortByStorageKey(
        relocation.storageKey
      );
      throw error;
    }
    if (!asset) {
      await this.cleanupService.processBestEffortByStorageKey(
        relocation.storageKey
      );
      throw mediaAssetNotFound(id);
    }
    await this.cleanupService.processBestEffortByStorageKey(
      relocation.sourceStorageKey
    );
    return asset;
  }

  async readPublic(id: string) {
    const asset = await this.getById(id);
    if (
      asset.visibility !== "public" ||
      asset.consentStatus !== "approved"
    ) {
      throw mediaAssetNotFound(id);
    }
    const storageKey = await this.repository.getStorageKey(id);
    if (!storageKey) {
      throw mediaAssetNotFound(id);
    }
    const object = await this.storage.read(storageKey);
    if (!object) {
      throw mediaAssetNotFound(id);
    }
    return { asset, ...object };
  }
}

function isPubliclyAccessible(
  visibility: MediaAsset["visibility"],
  consentStatus: MediaAsset["consentStatus"]
) {
  return visibility === "public" && consentStatus === "approved";
}

function validateImage(buffer: Buffer, mimeType: string) {
  if (!imageMimeTypes.has(mimeType)) {
    throw mediaImageUnsupportedType(mimeType);
  }
  if (buffer.length === 0 || !matchesImageSignature(buffer, mimeType)) {
    throw mediaImageInvalid();
  }
  if (buffer.length > 12 * 1024 * 1024) {
    throw mediaImageTooLarge(buffer.length);
  }
}

function matchesImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }
  if (mimeType === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "image/avif") {
    return buffer.subarray(4, 12).toString("ascii").includes("ftypavif");
  }
  return false;
}
