import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { Readable } from "node:stream";

import type { MediaAssetKind, MediaVisibility } from "@mbc/api-contracts";

import type { AppConfig } from "../../config/env.js";
import { localMediaUploadDir } from "./local_media_path.js";
import { mediaObjectUploadFailed } from "./media.errors.js";

export type StoreMediaObjectInput = {
  id: string;
  kind: MediaAssetKind;
  visibility: MediaVisibility;
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

interface MediaStorageDriver {
  put(input: StoreMediaObjectInput): Promise<StoredMediaObject>;
  read(storageKey: string): Promise<ReadMediaObjectResult | null>;
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
        input.visibility === "public"
          ? `${this.publicApiBaseUrl}/media/${input.id}/content`
          : null
    };
  }

  async read(storageKey: string): Promise<ReadMediaObjectResult | null> {
    if (!storageKey.startsWith("local:")) {
      return null;
    }
    const fileName = storageKey.slice("local:".length);
    if (!fileName || fileName.includes("/") || fileName.includes("\\")) {
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
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: AppConfig) {
    if (
      !config.s3Endpoint ||
      !config.s3Bucket ||
      !config.s3AccessKeyId ||
      !config.s3SecretAccessKey ||
      !config.mediaPublicBaseUrl
    ) {
      throw new Error("R2 media storage is not fully configured.");
    }
    this.bucket = config.s3Bucket;
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
    const prefix = input.visibility === "public" ? "public" : "private";
    const storageKey = `${prefix}/${input.kind}s/${input.id}${extension}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: input.buffer,
          ContentType: input.mimeType,
          ContentLength: input.buffer.length,
          CacheControl:
            input.visibility === "public"
              ? "public, max-age=31536000, immutable"
              : "private, no-store"
        })
      );
    } catch {
      throw mediaObjectUploadFailed();
    }
    return {
      storageKey: `s3:${this.bucket}:${storageKey}`,
      publicUrl:
        input.visibility === "public"
          ? `${this.publicBaseUrl}/${storageKey}`
          : null
    };
  }

  async read(storagePath: string): Promise<ReadMediaObjectResult | null> {
    const prefix = `s3:${this.bucket}:`;
    if (!storagePath.startsWith(prefix)) {
      return null;
    }
    const key = storagePath.slice(prefix.length);
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
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
