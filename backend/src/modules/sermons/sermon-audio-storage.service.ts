import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable } from "node:stream";

import type { AppConfig } from "../../config/env.js";
import { appError, isAppError } from "../../shared/http/app-error.js";
import {
  localMediaUploadDir,
  resolveLocalStoredPath
} from "../media/local_media_path.js";

const allowedAudioMimeTypes = new Set([
  "audio/aac",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/x-wav",
  "application/octet-stream"
]);

export type StoredSermonAudio = {
  storagePath: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
};

export type SermonAudioReadResult = {
  stream: NodeJS.ReadableStream;
  mimeType: string;
  sizeBytes: number;
  rangeStart: number;
  rangeEnd: number;
  partial: boolean;
};

export type SermonAudioBufferResult = {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
};

type SaveAudioInput = {
  sermonId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

type ReadAudioInput = {
  storagePath: string;
  mimeType: string;
  rangeHeader: string | undefined;
};

interface SermonAudioStorageDriver {
  saveAudio(input: SaveAudioInput): Promise<StoredSermonAudio>;
  deleteAudio(storagePath: string | null | undefined): Promise<void>;
  readAudio(input: ReadAudioInput): Promise<SermonAudioReadResult>;
}

export class SermonAudioStorageService implements SermonAudioStorageDriver {
  constructor(private readonly driver: SermonAudioStorageDriver) {}

  static fromConfig(config: AppConfig) {
    if (config.mediaStorageDriver === "s3") {
      return new SermonAudioStorageService(new S3SermonAudioStorageDriver(config));
    }
    return new SermonAudioStorageService(new LocalSermonAudioStorageDriver(config));
  }

  saveAudio(input: SaveAudioInput): Promise<StoredSermonAudio> {
    validateAudioInput(input);
    return this.driver.saveAudio(normalizeAudioInput(input));
  }

  async deleteAudio(storagePath: string | null | undefined): Promise<void> {
    try {
      await this.driver.deleteAudio(storagePath);
    } catch (error) {
      if (isAppError(error) && error.code === "object_delete_failed") {
        throw error;
      }
      throw objectDeleteFailed("Audio object deletion failed.", error);
    }
  }

  readAudio(input: ReadAudioInput): Promise<SermonAudioReadResult> {
    return this.driver.readAudio(input);
  }

  async readAudioBuffer(input: {
    storagePath: string;
    mimeType: string;
  }): Promise<SermonAudioBufferResult> {
    const audio = await this.driver.readAudio({
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      rangeHeader: undefined
    });
    const chunks: Buffer[] = [];
    for await (const chunk of audio.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return {
      buffer: Buffer.concat(chunks),
      mimeType: audio.mimeType,
      sizeBytes: audio.sizeBytes
    };
  }
}

class LocalSermonAudioStorageDriver implements SermonAudioStorageDriver {
  private readonly uploadDir: string;

  constructor(config: AppConfig) {
    this.uploadDir = localMediaUploadDir(config, "sermon-audio");
  }

  async saveAudio(input: SaveAudioInput): Promise<StoredSermonAudio> {
    await mkdir(this.uploadDir, { recursive: true });
    const storedFileName = `${input.sermonId}-${Date.now()}-${safeFileName(
      input.fileName,
      input.mimeType
    )}`;
    const storagePath = join(this.uploadDir, storedFileName);
    try {
      await writeFile(storagePath, input.buffer);
    } catch (error) {
      throw objectUploadFailed(input.sermonId, "Audio upload failed.", error);
    }

    return {
      storagePath: `local:${storagePath}`,
      url: `/v1/sermons/${input.sermonId}/audio`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      uploadedAt: new Date()
    };
  }

  async deleteAudio(storagePath: string | null | undefined) {
    if (!storagePath) {
      return;
    }
    const filePath = resolveLocalStoredPath(storagePath, this.uploadDir);
    if (!filePath) {
      throw objectDeleteFailed("Audio storage path is invalid.", undefined, false);
    }
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async readAudio(input: ReadAudioInput): Promise<SermonAudioReadResult> {
    const filePath = resolveLocalStoredPath(input.storagePath, this.uploadDir);
    if (!filePath) {
      throw objectNotFound("Audio storage path is invalid.", {
        storagePath: input.storagePath
      });
    }
    const fileStat = await stat(filePath).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw objectNotFound("Audio object was not found.", {
          storagePath: input.storagePath
        });
      }
      throw error;
    });
    const sizeBytes = fileStat.size;
    const range = parseRange(input.rangeHeader, sizeBytes);
    return {
      stream: createReadStream(filePath, {
        start: range.start,
        end: range.end
      }),
      mimeType: input.mimeType,
      sizeBytes,
      rangeStart: range.start,
      rangeEnd: range.end,
      partial: range.partial
    };
  }
}

class S3SermonAudioStorageDriver implements SermonAudioStorageDriver {
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

  async saveAudio(input: SaveAudioInput): Promise<StoredSermonAudio> {
    const key = `sermon-audio/${input.sermonId}/${Date.now()}-${safeFileName(
      input.fileName,
      input.mimeType
    )}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: input.buffer,
          ContentType: input.mimeType,
          ContentLength: input.buffer.length
        })
      );
    } catch (error) {
      throw objectUploadFailed(input.sermonId, "Audio upload failed.", error);
    }

    return {
      storagePath: `s3:${this.bucket}:${key}`,
      url: `/v1/sermons/${input.sermonId}/audio`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      uploadedAt: new Date()
    };
  }

  async deleteAudio(storagePath: string | null | undefined) {
    if (!storagePath) {
      return;
    }
    const location = s3Location(storagePath, this.bucket);
    if (!location) {
      throw objectDeleteFailed("Audio storage path is invalid.", undefined, false);
    }
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: location.bucket,
        Key: location.key
      })
    );
  }

  async readAudio(input: ReadAudioInput): Promise<SermonAudioReadResult> {
    const location = s3Location(input.storagePath, this.bucket);
    if (!location) {
      throw objectNotFound("Audio storage path is invalid.", {
        storagePath: input.storagePath
      });
    }
    const head = await this.client
      .send(
        new HeadObjectCommand({
          Bucket: location.bucket,
          Key: location.key
        })
      )
      .catch((error: unknown) => {
        throw objectNotFound("Audio object was not found.", {
          storagePath: input.storagePath,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    const sizeBytes = head.ContentLength ?? 0;
    const range = parseRange(input.rangeHeader, sizeBytes);
    const response = await this.client
      .send(
        new GetObjectCommand({
          Bucket: location.bucket,
          Key: location.key,
          Range: `bytes=${range.start}-${range.end}`
        })
      )
      .catch((error: unknown) => {
        throw objectNotFound("Audio object was not found.", {
          storagePath: input.storagePath,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    if (!response.Body) {
      throw objectNotFound("Audio object body is empty.", {
        storagePath: input.storagePath
      });
    }
    return {
      stream: response.Body instanceof Readable
        ? response.Body
        : Readable.from(response.Body as AsyncIterable<Uint8Array>),
      mimeType: input.mimeType,
      sizeBytes,
      rangeStart: range.start,
      rangeEnd: range.end,
      partial: range.partial
    };
  }
}

function validateAudioInput(input: SaveAudioInput) {
  const mimeType = input.mimeType.split(";")[0]?.trim() ?? "";
  if (!allowedAudioMimeTypes.has(mimeType)) {
    throw objectUploadFailed(input.sermonId, "Unsupported audio file type.", {
      mimeType: input.mimeType
    });
  }
  if (input.buffer.length === 0) {
    throw objectUploadFailed(input.sermonId, "Audio file is empty.");
  }
}

function objectNotFound(
  message: string,
  evidence: Record<string, unknown> = {}
) {
  return appError({
    code: "object_not_found",
    category: "not_found",
    sourceLayer: "capability",
    statusCode: 404,
    message,
    recoverable: true,
    retryable: false,
    evidence,
    nextAction: "refresh"
  });
}

function objectUploadFailed(
  sermonId: string,
  message: string,
  errorOrDetails?: unknown
) {
  return appError({
    code: "object_upload_failed",
    category: "validation_error",
    sourceLayer: "capability",
    statusCode: 400,
    message,
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "review_request",
    details:
      errorOrDetails instanceof Error
        ? { message: errorOrDetails.message }
        : typeof errorOrDetails === "object" && errorOrDetails !== null
          ? (errorOrDetails as Record<string, unknown>)
          : {}
  });
}

function objectDeleteFailed(
  message: string,
  error?: unknown,
  retryable = true
) {
  return appError({
    code: "object_delete_failed",
    category: retryable ? "external_dependency_failed" : "validation_error",
    sourceLayer: "capability",
    statusCode: retryable ? 503 : 400,
    message,
    recoverable: true,
    retryable,
    evidence: {},
    nextAction: retryable ? "retry" : "review_configuration",
    details: error instanceof Error ? { message: error.message } : {}
  });
}

function normalizeAudioInput(input: SaveAudioInput): SaveAudioInput {
  return {
    ...input,
    mimeType: input.mimeType.split(";")[0]?.trim() ?? "application/octet-stream"
  };
}

function s3Location(
  storagePath: string | null | undefined,
  expectedBucket: string
) {
  if (!storagePath?.startsWith("s3:")) {
    return null;
  }
  const [, bucket, ...keyParts] = storagePath.split(":");
  const key = keyParts.join(":");
  if (!bucket || !key || bucket !== expectedBucket) {
    return null;
  }
  return { bucket, key };
}

function safeFileName(fileName: string, mimeType: string) {
  const cleanBaseName = basename(fileName)
    .replaceAll(/[^a-zA-Z0-9._-]/g, "-")
    .replaceAll(/-+/g, "-")
    .slice(0, 120);
  if (cleanBaseName && extname(cleanBaseName)) {
    return cleanBaseName;
  }
  return `${cleanBaseName || "audio"}${extensionForMimeType(mimeType)}`;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "audio/mpeg") {
    return ".mp3";
  }
  if (mimeType === "audio/mp4" || mimeType === "audio/x-m4a") {
    return ".m4a";
  }
  if (mimeType === "audio/aac") {
    return ".aac";
  }
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return ".wav";
  }
  return ".audio";
}

function parseRange(rangeHeader: string | undefined, sizeBytes: number) {
  if (sizeBytes <= 0) {
    return { start: 0, end: 0, partial: false };
  }
  if (!rangeHeader?.startsWith("bytes=")) {
    return { start: 0, end: sizeBytes - 1, partial: false };
  }

  const rangeSpec = rangeHeader.replace("bytes=", "").trim();
  if (!rangeSpec || rangeSpec.includes(",")) {
    return { start: 0, end: sizeBytes - 1, partial: false };
  }
  const [startRaw = "", endRaw = ""] = rangeSpec.split("-");
  const hasStart = startRaw.trim().length > 0;
  const hasEnd = endRaw.trim().length > 0;

  if (!hasStart && hasEnd) {
    const suffixLength = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return { start: 0, end: sizeBytes - 1, partial: false };
    }
    const length = Math.min(suffixLength, sizeBytes);
    return {
      start: sizeBytes - length,
      end: sizeBytes - 1,
      partial: true
    };
  }

  const start = Number.parseInt(startRaw, 10);
  if (!hasStart || !Number.isFinite(start) || start < 0 || start >= sizeBytes) {
    return { start: 0, end: sizeBytes - 1, partial: false };
  }
  const end = hasEnd ? Number.parseInt(endRaw, 10) : sizeBytes - 1;
  if (!Number.isFinite(end) || end < start) {
    return { start: 0, end: sizeBytes - 1, partial: false };
  }
  return {
    start,
    end: Math.min(end, sizeBytes - 1),
    partial: true
  };
}
