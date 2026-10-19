import type {
  MediaAsset,
  MediaAssetListQuery,
  MediaAssetUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, inArray } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  mediaAssets,
  mediaObjectCleanupTasks
} from "../../shared/db/schema.js";
import type {
  CreateMediaAssetInput,
  MediaRepository,
  UpdateMediaAssetRecordInput
} from "./media.repository.js";

export class PostgresMediaRepository implements MediaRepository {
  constructor(private readonly db: AppDb) {}

  async create(
    input: CreateMediaAssetInput,
    cleanupTaskId?: string
  ): Promise<MediaAsset> {
    if (!cleanupTaskId) {
      const [row] = await this.db
        .insert(mediaAssets)
        .values(toInsertValues(input))
        .returning();
      return mediaAssetFromRow(row!);
    }
    return this.db.transaction(async (transaction) => {
      const [row] = await transaction
        .insert(mediaAssets)
        .values(toInsertValues(input))
        .returning();
      const [discarded] = await transaction
        .delete(mediaObjectCleanupTasks)
        .where(eq(mediaObjectCleanupTasks.id, cleanupTaskId))
        .returning({ id: mediaObjectCleanupTasks.id });
      if (!discarded) {
        throw new Error("Media cleanup candidate was not found during binding.");
      }
      return mediaAssetFromRow(row!);
    });
  }

  async getById(id: string): Promise<MediaAsset | null> {
    const [row] = await this.db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);
    return row ? mediaAssetFromRow(row) : null;
  }

  async getStorageKey(id: string): Promise<string | null> {
    const [row] = await this.db
      .select({ storageKey: mediaAssets.storageKey })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);
    return row?.storageKey ?? null;
  }

  async getByIds(ids: string[]): Promise<MediaAsset[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(mediaAssets)
      .where(inArray(mediaAssets.id, [...new Set(ids)]));
    return rows.map(mediaAssetFromRow);
  }

  async list(query: MediaAssetListQuery): Promise<MediaAsset[]> {
    const filters = [
      query.kind ? eq(mediaAssets.kind, query.kind) : undefined,
      query.visibility
        ? eq(mediaAssets.visibility, query.visibility)
        : undefined,
      query.consentStatus
        ? eq(mediaAssets.consentStatus, query.consentStatus)
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(mediaAssets)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(query.limit);
    return rows.map(mediaAssetFromRow);
  }

  async update(
    id: string,
    input: UpdateMediaAssetRecordInput
  ): Promise<MediaAsset | null> {
    const { storageKey, url, ...metadata } = input;
    const [row] = await this.db
      .update(mediaAssets)
      .set({
        ...metadata,
        ...(storageKey === undefined ? {} : { storageKey }),
        ...(url === undefined ? {} : { publicUrl: url ?? "" }),
        updatedAt: new Date()
      })
      .where(eq(mediaAssets.id, id))
      .returning();
    return row ? mediaAssetFromRow(row) : null;
  }
}

function toInsertValues(input: CreateMediaAssetInput) {
  return {
    id: input.id,
    kind: input.kind,
    visibility: input.visibility,
    consentStatus: input.consentStatus,
    storageKey: input.storageKey,
    publicUrl: input.url ?? "",
    originalFileName: input.originalFileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    focalX: input.focalX,
    focalY: input.focalY,
    altText: input.altText,
    caption: input.caption,
    copyrightSource: input.copyrightSource
  };
}

type MediaAssetRow = typeof mediaAssets.$inferSelect;

function mediaAssetFromRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    kind: row.kind,
    visibility: row.visibility,
    consentStatus: row.consentStatus,
    url: row.publicUrl || null,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    focalX: row.focalX,
    focalY: row.focalY,
    altText: row.altText,
    caption: row.caption,
    copyrightSource: row.copyrightSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
