import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";

import type { MediaAssetKind } from "@mbc/api-contracts";

import type { AppConfig } from "../../config/env.js";
import { localMediaUploadDir } from "./local_media_path.js";
import { mediaObjectUploadFailed } from "./media.errors.js";

export type StoreMediaObjectInput = {
  id: string;
  kind: MediaAssetKind;
  publicAccess: boolean;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export type StoredMediaObject = {
  storageKey: string;
  publicUrl: string | null;
};

export type ReadMediaObjectResult = {
  stream: NodeJS.ReadableStream;
  sizeBytes: number;
};

export interface MediaStorageDriver {
  put(input: StoreMediaObjectInput): Promise<StoredMediaObject>;
  read(storageKey: string): Promise<ReadMediaObjectResult | null>;
  relocate(
    storageKey: string,
    input: Omit<StoreMediaObjectInput, "buffer" | "fileName">
  ): Promise<StoredMediaObject>;
  delete(storageKey: string): Promise<void>;
}

export class MediaStorageService implements MediaStorageDriver {
  constructor(private readonly driver: MediaStorageDriver) {}

  static fromConfig(config: AppConfig) {
    return new MediaStorageService(
      config.mediaStorageDriver === "s3"
        ? new R2MediaStorageDriver(config)
        : new LocalMediaStorageDriver(config)
    );
  }

  put(input: StoreMediaObjectInput) {
    return this.driver.put(input);
  }

  read(storageKey: string) {
    return this.driver.read(storageKey);
  }

  relocate(
    storageKey: string,
    input: Omit<StoreMediaObjectInput, "buffer" | "fileName">
  ) {
    return this.driver.relocate(storageKey, input);
  }

  delete(storageKey: string) {
    return this.driver.delete(storageKey);
  }
}

class LocalMediaStorageDriver implements MediaStorageDriver {
  private readonly uploadDir: string;
  private readonly publicApiBaseUrl: string;

  constructor(config: AppConfig) {
    this.uploadDir = localMediaUploadDir(config, "media");
    this.publicApiBaseUrl = config.publicApiBaseUrl.replace(/\/$/, "");
  }

  async put(input: StoreMediaObjectInput): Promise<StoredMediaObject> {
    await mkdir(this.uploadDir, { recursive: true });
    const storageKey = `${input.id}${extensionForMimeType(input.mimeType)}`;
    try {
      await writeFile(join(this.uploadDir, storageKey), input.buffer);
    } catch {
      throw mediaObjectUploadFailed();
    }
    return {
      storageKey: `local:${storageKey}`,
      publicUrl:
        input.publicAccess
          ? `${this.publicApiBaseUrl}/media/${input.id}/content`
          : null
    };
  }

  async relocate(
    storageKey: string,
    input: Omit<StoreMediaObjectInput, "buffer" | "fileName">
  ): Promise<StoredMediaObject> {
    if (!localFileName(storageKey)) {
      throw mediaObjectUploadFailed();
    }
    return {
      storageKey,
      publicUrl: input.publicAccess
        ? `${this.publicApiBaseUrl}/media/${input.id}/content`
        : null
    };
  }

  async delete(storageKey: string): Promise<void> {
    const fileName = localFileName(storageKey);
    if (!fileName) {
      throw mediaObjectUploadFailed();
    }
    try {
      await unlink(join(this.uploadDir, fileName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw mediaObjectUploadFailed();
      }
    }
  }

  async read(storageKey: string): Promise<ReadMediaObjectResult | null> {
    const fileName = localFileName(storageKey);
    if (!fileName) {
      return null;
    }
    const path = join(this.uploadDir, fileName);
    try {
      const file = await stat(path);
      return { stream: createReadStream(path), sizeBytes: file.size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
}

class R2MediaStorageDriver implements MediaStorageDriver {
  private readonly client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: AppConfig) {
    if (
      !config.s3Endpoint ||
      !config.s3Bucket ||
      !config.s3PrivateBucket ||
      !config.s3AccessKeyId ||
      !config.s3SecretAccessKey ||
      !config.mediaPublicBaseUrl
    ) {
      throw new Error("R2 media storage is not fully configured.");
    }
    if (config.s3Bucket === config.s3PrivateBucket) {
      throw new Error("Public and private R2 media buckets must be different.");
    }
    this.publicBucket = config.s3Bucket;
    this.privateBucket = config.s3PrivateBucket;
    this.publicBaseUrl = config.mediaPublicBaseUrl.replace(/\/$/, "");
    this.client = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      forcePathStyle: config.s3ForcePathStyle,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey
      }
    });
  }

  async put(input: StoreMediaObjectInput): Promise<StoredMediaObject> {
    const extension = extensionForMimeType(input.mimeType);
    const prefix = input.publicAccess ? "public" : "private";
    const storageKey = `${prefix}/${input.kind}s/${input.id}${extension}`;
    const bucket = input.publicAccess ? this.publicBucket : this.privateBucket;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: input.buffer,
          ContentType: input.mimeType,
          ContentLength: input.buffer.length,
          CacheControl:
            input.publicAccess
              ? "public, max-age=31536000, immutable"
              : "private, no-store"
        })
      );
    } catch {
      throw mediaObjectUploadFailed();
    }
    return {
      storageKey: `s3:${bucket}:${storageKey}`,
      publicUrl:
        input.publicAccess
          ? `${this.publicBaseUrl}/${storageKey}`
          : null
    };
  }

  async read(storagePath: string): Promise<ReadMediaObjectResult | null> {
    const location = this.parseLocation(storagePath);
    if (!location) {
      return null;
    }
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: location.bucket, Key: location.key })
      );
      if (!response.Body) {
        return null;
      }
      return {
        stream:
          response.Body instanceof Readable
            ? response.Body
            : Readable.from(response.Body as AsyncIterable<Uint8Array>),
        sizeBytes: response.ContentLength ?? 0
      };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404) {
        return null;
      }
      throw error;
    }
  }

  async relocate(
    storagePath: string,
    input: Omit<StoreMediaObjectInput, "buffer" | "fileName">
  ): Promise<StoredMediaObject> {
    const source = this.parseLocation(storagePath);
    if (!source) {
      throw mediaObjectUploadFailed();
    }
    const extension = extensionForMimeType(input.mimeType);
    const prefix = input.publicAccess ? "public" : "private";
    const targetKey = `${prefix}/${input.kind}s/${input.id}${extension}`;
    const targetBucket = input.publicAccess
      ? this.publicBucket
      : this.privateBucket;
    if (source.bucket !== targetBucket || source.key !== targetKey) {
      try {
        await this.client.send(
          new CopyObjectCommand({
            Bucket: targetBucket,
            Key: targetKey,
            CopySource: `${source.bucket}/${source.key}`,
            ContentType: input.mimeType,
            MetadataDirective: "REPLACE",
            CacheControl: input.publicAccess
              ? "public, max-age=31536000, immutable"
              : "private, no-store"
          })
        );
        await this.client.send(
          new DeleteObjectCommand({ Bucket: source.bucket, Key: source.key })
        );
      } catch {
        throw mediaObjectUploadFailed();
      }
    }
    return {
      storageKey: `s3:${targetBucket}:${targetKey}`,
      publicUrl: input.publicAccess
        ? `${this.publicBaseUrl}/${targetKey}`
        : null
    };
  }

  async delete(storagePath: string): Promise<void> {
    const location = this.parseLocation(storagePath);
    if (!location) {
      throw mediaObjectUploadFailed();
    }
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: location.bucket, Key: location.key })
      );
    } catch {
      throw mediaObjectUploadFailed();
    }
  }

  private parseLocation(storagePath: string) {
    for (const bucket of [this.publicBucket, this.privateBucket]) {
      const prefix = `s3:${bucket}:`;
      if (storagePath.startsWith(prefix)) {
        const key = storagePath.slice(prefix.length);
        return key ? { bucket, key } : null;
      }
    }
    return null;
  }
}

function localFileName(storageKey: string) {
  if (!storageKey.startsWith("local:")) {
    return null;
  }
  const fileName = storageKey.slice("local:".length);
  return !fileName || fileName.includes("/") || fileName.includes("\\")
    ? null
    : fileName;
}

function extensionForMimeType(mimeType: string) {
  return {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif"
  }[mimeType] ?? ".bin";
}
