import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable } from "node:stream";

import type { AppConfig } from "../../config/env.js";
import { localMediaUploadDir } from "../media/local_media_path.js";
import {
  lifeImageEmpty,
  lifeImageTooLarge,
  lifeImageUnsupportedType
} from "./life-post-errors.js";

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

type SaveImageInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

export type StoredLifePostImage = {
  url: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type LifePostImageReadResult = {
  stream: NodeJS.ReadableStream;
  mimeType: string;
  sizeBytes: number;
};

interface LifePostImageStorageDriver {
  saveImage(input: SaveImageInput): Promise<StoredLifePostImage>;
  readImage(fileName: string): Promise<LifePostImageReadResult | null>;
}

export class LifePostImageStorageService implements LifePostImageStorageDriver {
  constructor(private readonly driver: LifePostImageStorageDriver) {}

  static fromConfig(config: AppConfig) {
    if (config.mediaStorageDriver === "s3") {
      return new LifePostImageStorageService(new S3LifePostImageStorageDriver(config));
    }
    return new LifePostImageStorageService(new LocalLifePostImageStorageDriver(config));
  }

  saveImage(input: SaveImageInput) {
    validateImageInput(input);
    return this.driver.saveImage(normalizeImageInput(input));
  }

  readImage(fileName: string) {
    return this.driver.readImage(fileName);
  }
}

class LocalLifePostImageStorageDriver implements LifePostImageStorageDriver {
  private readonly uploadDir: string;

  constructor(config: AppConfig) {
    this.uploadDir = localMediaUploadDir(config, "life-images");
  }

  async saveImage(input: SaveImageInput): Promise<StoredLifePostImage> {
    await mkdir(this.uploadDir, { recursive: true });
    const storedFileName = `${Date.now()}-${safeFileName(
      input.fileName,
      input.mimeType
    )}`;
    const storagePath = join(this.uploadDir, storedFileName);
    await writeFile(storagePath, input.buffer);
    return {
      url: `/v1/life/images/${storedFileName}`,
      storagePath: `local:${storagePath}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length
    };
  }

  async readImage(fileName: string): Promise<LifePostImageReadResult | null> {
    const safeName = safeRequestedFileName(fileName);
    if (!safeName) {
      return null;
    }
    const filePath = join(this.uploadDir, safeName);
    try {
      const fileStat = await stat(filePath);
      return {
        stream: createReadStream(filePath),
        mimeType: mimeTypeFromExtension(extname(filePath)),
        sizeBytes: fileStat.size
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
}

class S3LifePostImageStorageDriver implements LifePostImageStorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: AppConfig) {
    if (!config.s3Bucket) {
      throw new Error("S3_BUCKET is required when MEDIA_STORAGE_DRIVER=s3.");
    }
    this.bucket = config.s3Bucket;
    this.client = new S3Client({
      region: config.s3Region,
      ...(config.s3Endpoint ? { endpoint: config.s3Endpoint } : {}),
      forcePathStyle: config.s3ForcePathStyle,
      ...(config.s3AccessKeyId && config.s3SecretAccessKey
        ? {
            credentials: {
              accessKeyId: config.s3AccessKeyId,
              secretAccessKey: config.s3SecretAccessKey
            }
          }
        : {})
    });
  }

  async saveImage(input: SaveImageInput): Promise<StoredLifePostImage> {
    const storedFileName = `${Date.now()}-${safeFileName(
      input.fileName,
      input.mimeType
    )}`;
    const key = `life-images/${storedFileName}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
        ContentLength: input.buffer.length
      })
    );
    return {
      url: `/v1/life/images/${storedFileName}`,
      storagePath: `s3:${this.bucket}:${key}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length
    };
  }

  async readImage(fileName: string): Promise<LifePostImageReadResult | null> {
    const safeName = safeRequestedFileName(fileName);
    if (!safeName) {
      return null;
    }
    const key = `life-images/${safeName}`;
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      if (!response.Body) {
        return null;
      }
      return {
        stream: response.Body instanceof Readable
          ? response.Body
          : Readable.from(response.Body as AsyncIterable<Uint8Array>),
        mimeType: head.ContentType ?? mimeTypeFromExtension(extname(safeName)),
        sizeBytes: head.ContentLength ?? 0
      };
    } catch (error) {
      if (isMissingS3ObjectError(error)) {
        return null;
      }
      throw error;
    }
  }
}

function validateImageInput(input: SaveImageInput) {
  const mimeType = input.mimeType.split(";")[0]?.trim() ?? "";
  if (!allowedImageMimeTypes.has(mimeType)) {
    throw lifeImageUnsupportedType(mimeType);
  }
  if (input.buffer.length === 0) {
    throw lifeImageEmpty();
  }
  if (input.buffer.length > 8 * 1024 * 1024) {
    throw lifeImageTooLarge(input.buffer.length, 8 * 1024 * 1024);
  }
}

function normalizeImageInput(input: SaveImageInput): SaveImageInput {
  return {
    ...input,
    mimeType: input.mimeType.split(";")[0]?.trim() ?? "application/octet-stream"
  };
}

function isMissingS3ObjectError(error: unknown) {
  const maybeAwsError = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    maybeAwsError.name === "NoSuchKey" ||
    maybeAwsError.name === "NotFound" ||
    maybeAwsError.$metadata?.httpStatusCode === 404
  );
}

function safeFileName(fileName: string, mimeType: string) {
  const cleanBaseName = basename(fileName)
    .replaceAll(/[^a-zA-Z0-9._-]/g, "-")
    .replaceAll(/-+/g, "-")
    .slice(0, 120);
  if (cleanBaseName && extname(cleanBaseName)) {
    return cleanBaseName;
  }
  return `${cleanBaseName || "life-image"}${extensionForMimeType(mimeType)}`;
}

function safeRequestedFileName(fileName: string) {
  const clean = basename(fileName);
  return clean === fileName && clean.length > 0 ? clean : null;
}

function extensionForMimeType(mimeType: string) {
  return {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
  }[mimeType] ?? ".img";
}

function mimeTypeFromExtension(extension: string) {
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
  }[extension.toLowerCase()] ?? "application/octet-stream";
}
