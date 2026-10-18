import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest,
  MediaAssetUploadMetadata
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { MediaRepository } from "./media.repository.js";
import type { MediaStorageService } from "./media-storage.service.js";
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
    private readonly storage: MediaStorageService
  ) {}

  async uploadImage(input: UploadMediaImageInput): Promise<MediaAsset> {
    const mimeType = input.mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
    validateImage(input.buffer, mimeType);
    const id = randomUUID();
    const stored = await this.storage.put({
      id,
      kind: "image",
      visibility: input.visibility,
      fileName: input.fileName,
      mimeType,
      buffer: input.buffer
    });
    return this.repository.create({
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
    });
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

  async update(id: string, input: MediaAssetUpdateRequest) {
    const asset = await this.repository.update(id, input);
    if (!asset) {
      throw mediaAssetNotFound(id);
    }
    return asset;
  }

  async readPublic(id: string) {
    const asset = await this.getById(id);
    if (
      asset.visibility !== "public" ||
      asset.consentStatus === "restricted"
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
