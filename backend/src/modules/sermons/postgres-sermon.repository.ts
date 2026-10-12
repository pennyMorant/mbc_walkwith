import type {
  CreateLocalSermonDraftRequest,
  Sermon,
  SermonListQuery,
  SermonRecommendationQuery,
  SermonStatus,
  UpdateSermonRequest
} from "@mbc/api-contracts";
import { asc, count, eq, inArray, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  sermonOutlines,
  sermonReferences,
  sermonTopics,
  sermonTranscripts,
  sermons
} from "../../shared/db/schema.js";
import type {
  SermonAudioInput,
  SermonAudioRecord,
  SermonListResult,
  SermonRepository,
  SermonUpdateOptions
} from "./sermon.repository.js";
import { replaceSermonChildren } from "./postgres_sermon_aggregate.js";
import {
  discardSermonAudioCleanupCandidate,
  scheduleSermonAudioCleanup
} from "./postgres_sermon_audio_cleanup.js";
import {
  listSermonDiscoveryRows,
  rankedSermonRecommendationIds,
  readSermonDiscoveryFacets
} from "./postgres_sermon_discovery.js";

export class PostgresSermonRepository implements SermonRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: SermonListQuery): Promise<SermonListResult> {
    const result = await listSermonDiscoveryRows(this.db, query);
    const loaded = await Promise.all(
      result.rows.map((row) => this.loadChildren(row))
    );
    return {
      sermons: loaded,
      nextCursor: result.nextCursor
    };
  }

  async countByStatus(status: SermonStatus): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(sermons)
      .where(eq(sermons.status, status));
    return Number(row?.value ?? 0);
  }

  async getById(id: string): Promise<Sermon | null> {
    const [row] = await this.db
      .select()
      .from(sermons)
      .where(eq(sermons.id, id))
      .limit(1);
    return row ? this.loadChildren(row) : null;
  }

  async createDraft(input: CreateLocalSermonDraftRequest): Promise<Sermon> {
    return this.db.transaction(async (transaction) => {
      const now = new Date();
      const [row] = await transaction
        .insert(sermons)
        .values({
          title: input.title,
          speaker: input.speaker,
          sermonDate: dateFromInput(input.sermonDate, now),
          series: input.series ?? null,
          primaryReference: input.primaryReference ?? null,
          summary: input.summary ?? null,
          durationSeconds: 0,
          revision: 0,
          sourceLocale: input.sourceLocale,
          reviewMarkdown: input.reviewMarkdown ?? null,
          processingMetadata: null,
          status: "draft",
          createdAt: now,
          updatedAt: now
        })
        .returning();
      if (!row) {
        throw new Error("Failed to create sermon draft.");
      }
      await replaceSermonChildren(transaction, row.id, input, now);
      return this.loadChildren(row, transaction);
    });
  }

  async recommendations(query: SermonRecommendationQuery): Promise<Sermon[]> {
    const rankedIds = await rankedSermonRecommendationIds(this.db, query);
    if (rankedIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(sermons)
      .where(inArray(sermons.id, rankedIds));
    const loaded = await Promise.all(rows.map((row) => this.loadChildren(row)));
    const sermonsById = new Map(loaded.map((sermon) => [sermon.id, sermon]));
    return rankedIds.flatMap((id) => {
      const sermon = sermonsById.get(id);
      return sermon ? [sermon] : [];
    });
  }

  async discoveryFacets() {
    return readSermonDiscoveryFacets(this.db);
  }

  async update(
    id: string,
    input: UpdateSermonRequest,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    return this.withLockedSermon(id, options, async (transaction, existing) => {
      const now = new Date();
      const nextStatus = input.status ?? existing.status;
      const [row] = await transaction
        .update(sermons)
        .set({
          title: input.title ?? existing.title,
          speaker: input.speaker ?? existing.speaker,
          sermonDate: dateFromInput(input.sermonDate, existing.sermonDate),
          series: input.series === undefined ? existing.series : input.series,
          primaryReference:
            input.primaryReference === undefined
              ? existing.primaryReference
              : input.primaryReference,
          summary: input.summary === undefined ? existing.summary : input.summary,
          durationSeconds: input.durationSeconds ?? existing.durationSeconds,
          revision: sql`${sermons.revision} + 1`,
          sourceLocale: input.sourceLocale ?? existing.sourceLocale,
          reviewMarkdown:
            input.reviewMarkdown === undefined
              ? existing.reviewMarkdown
              : input.reviewMarkdown,
          processingMetadata:
            input.processingMetadata === undefined
              ? existing.processingMetadata
              : input.processingMetadata,
          status: nextStatus,
          publishedAt: nextPublishedAt(existing.publishedAt, nextStatus),
          updatedAt: now
        })
        .where(eq(sermons.id, id))
        .returning();
      if (!row) {
        return null;
      }

      await replaceSermonChildren(transaction, id, input, now);
      return this.loadChildren(row, transaction);
    });
  }

  async attachAudio(
    id: string,
    input: SermonAudioInput,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    return this.withLockedSermon(id, options, async (transaction) => {
      const [row] = await transaction
        .update(sermons)
        .set({
          audioStoragePath: input.storagePath,
          audioUrl: input.url,
          audioFileName: input.fileName,
          audioMimeType: input.mimeType,
          audioSizeBytes: input.sizeBytes,
          audioStatus: "ready",
          audioUploadedAt: input.uploadedAt,
          revision: sql`${sermons.revision} + 1`,
          updatedAt: new Date()
        })
        .where(eq(sermons.id, id))
        .returning();
      if (row && options.audioCleanup) {
        await scheduleSermonAudioCleanup(transaction, {
          sermonId: id,
          ...options.audioCleanup
        });
      }
      if (row && options.audioCleanupCandidateStoragePath) {
        await discardSermonAudioCleanupCandidate(
          transaction,
          options.audioCleanupCandidateStoragePath
        );
      }
      return row ? this.loadChildren(row, transaction) : null;
    });
  }

  async markAudioFailed(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    return this.withLockedSermon(id, options, async (transaction) => {
      const [row] = await transaction
        .update(sermons)
        .set({
          audioStatus: "failed",
          revision: sql`${sermons.revision} + 1`,
          updatedAt: new Date()
        })
        .where(eq(sermons.id, id))
        .returning();
      return row ? this.loadChildren(row, transaction) : null;
    });
  }

  async removeAudio(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    return this.withLockedSermon(id, options, async (transaction) => {
      const [row] = await transaction
        .update(sermons)
        .set({
          audioStoragePath: null,
          audioUrl: null,
          audioFileName: null,
          audioMimeType: null,
          audioSizeBytes: 0,
          audioStatus: "missing",
          audioUploadedAt: null,
          revision: sql`${sermons.revision} + 1`,
          updatedAt: new Date()
        })
        .where(eq(sermons.id, id))
        .returning();
      if (row && options.audioCleanup) {
        await scheduleSermonAudioCleanup(transaction, {
          sermonId: id,
          ...options.audioCleanup
        });
      }
      return row ? this.loadChildren(row, transaction) : null;
    });
  }

  async getAudioRecord(id: string): Promise<SermonAudioRecord | null> {
    const [row] = await this.db
      .select()
      .from(sermons)
      .where(eq(sermons.id, id))
      .limit(1);
    if (!row?.audioStoragePath || row.audioStatus !== "ready") {
      return null;
    }
    return {
      storagePath: row.audioStoragePath,
      url: row.audioUrl ?? "",
      fileName: row.audioFileName ?? "sermon-audio",
      mimeType: row.audioMimeType ?? "application/octet-stream",
      sizeBytes: row.audioSizeBytes,
      uploadedAt: row.audioUploadedAt ?? new Date(),
      status: row.audioStatus
    };
  }

  async delete(
    id: string,
    options: SermonUpdateOptions = {}
  ): Promise<boolean> {
    const deleted = await this.withLockedSermon(
      id,
      options,
      async (transaction) => {
        if (options.audioCleanup) {
          await scheduleSermonAudioCleanup(transaction, {
            sermonId: id,
            ...options.audioCleanup
          });
        }
        const rows = await transaction
          .delete(sermons)
          .where(eq(sermons.id, id))
          .returning({ id: sermons.id });
        return rows.length > 0;
      }
    );
    return deleted ?? false;
  }

  private async withLockedSermon<T>(
    id: string,
    options: SermonUpdateOptions,
    action: (
      transaction: AppTransaction,
      existing: SermonRow
    ) => Promise<T>
  ): Promise<T | null> {
    return this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(sermons)
        .where(eq(sermons.id, id))
        .for("update");
      if (!existing) {
        return null;
      }
      if (
        options.expectedRevision !== undefined &&
        existing.revision !== options.expectedRevision
      ) {
        return null;
      }
      return action(transaction, existing);
    });
  }

  private async loadChildren(
    row: SermonRow,
    database: SermonReadDatabase = this.db
  ): Promise<Sermon> {
    const [outlineRows, referenceRows, topicRows, transcriptRows] =
      await Promise.all([
        database
          .select()
          .from(sermonOutlines)
          .where(eq(sermonOutlines.sermonId, row.id))
          .orderBy(sermonOutlines.sortOrder),
        database
          .select()
          .from(sermonReferences)
          .where(eq(sermonReferences.sermonId, row.id)),
        database
          .select()
          .from(sermonTopics)
          .where(eq(sermonTopics.sermonId, row.id))
          .orderBy(asc(sermonTopics.topic)),
        database
          .select()
          .from(sermonTranscripts)
          .where(eq(sermonTranscripts.sermonId, row.id))
          .limit(1)
      ]);
    const transcript = transcriptRows[0];

    return {
      id: row.id,
      revision: row.revision,
      sourceLocale: row.sourceLocale as Sermon["sourceLocale"],
      title: row.title,
      speaker: row.speaker,
      sermonDate: dateOnly(row.sermonDate),
      series: row.series,
      topics: topicRows.map((topic) => topic.topic),
      primaryReference: row.primaryReference,
      summary: row.summary,
      durationSeconds: row.durationSeconds,
      thumbnailUrl: row.thumbnailUrl,
      audio: {
        url: row.audioUrl,
        fileName: row.audioFileName,
        mimeType: row.audioMimeType,
        sizeBytes: row.audioSizeBytes,
        status: row.audioStatus,
        uploadedAt: row.audioUploadedAt?.toISOString() ?? null
      },
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      outline: outlineRows.map((outline) => ({
        title: outline.title,
        startSeconds: outline.startSeconds,
        summary: outline.summary
      })),
      references: referenceRows.map((reference) => ({
        reference: reference.referenceText,
        verseId: reference.verseId,
        note: reference.note ?? "",
        startSeconds: reference.startSeconds
      })),
      transcript: transcript
        ? {
            text: transcript.text,
            source: transcript.source,
            updatedAt: transcript.updatedAt.toISOString()
          }
        : null,
      reviewMarkdown: row.reviewMarkdown,
      processingMetadata:
        (row.processingMetadata as Sermon["processingMetadata"] | null) ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

}

type SermonRow = typeof sermons.$inferSelect;
type AppTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type SermonReadDatabase = Pick<AppDb, "select">;

function dateFromInput(value: string | undefined, fallback: string | Date): Date {
  if (!value) {
    return fallback instanceof Date ? fallback : new Date(fallback);
  }
  return new Date(value);
}

function dateOnly(value: Date): string {
  return value.toISOString().split("T")[0] ?? value.toISOString();
}

function nextPublishedAt(
  existingPublishedAt: string | Date | null,
  status: Sermon["status"]
): Date | null {
  if (status === "published" && existingPublishedAt === null) {
    return new Date();
  }
  if (status !== "published") {
    return null;
  }
  if (!existingPublishedAt) {
    return new Date();
  }
  return existingPublishedAt instanceof Date
    ? existingPublishedAt
    : new Date(existingPublishedAt);
}
