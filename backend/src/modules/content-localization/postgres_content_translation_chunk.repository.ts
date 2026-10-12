import { and, asc, eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { contentTranslationChunks } from "../../shared/db/schema.js";
import type {
  ContentTranslationChunk,
  ContentTranslationChunkKey,
  ContentTranslationChunkRepository
} from "./content_translation_chunk.repository.js";

export class PostgresContentTranslationChunkRepository
  implements ContentTranslationChunkRepository
{
  constructor(private readonly db: AppDb) {}

  async list(key: ContentTranslationChunkKey) {
    const rows = await this.db
      .select()
      .from(contentTranslationChunks)
      .where(whereKey(key))
      .orderBy(asc(contentTranslationChunks.field), asc(contentTranslationChunks.chunkIndex));
    return rows.map(toChunk);
  }

  async ensure(
    key: ContentTranslationChunkKey,
    chunks: Array<Pick<ContentTranslationChunk, "field" | "chunkIndex" | "sourceText">>
  ) {
    for (const chunk of chunks) {
      await this.db
        .insert(contentTranslationChunks)
        .values({ ...key, ...chunk })
        .onConflictDoNothing();
    }
    const existing = new Map(
      (await this.list(key)).map((chunk) => [
        `${chunk.field}:${chunk.chunkIndex}`,
        chunk
      ])
    );
    for (const chunk of chunks) {
      const current = existing.get(`${chunk.field}:${chunk.chunkIndex}`);
      if (!current) {
        throw new Error("Content translation chunk was not persisted.");
      }
      if (current.sourceText !== chunk.sourceText) {
        await this.db
          .update(contentTranslationChunks)
          .set({
            sourceText: chunk.sourceText,
            translatedText: null,
            status: "pending",
            provider: null,
            model: null,
            inputTokens: null,
            outputTokens: null,
            errorCode: null,
            updatedAt: new Date()
          })
          .where(
            and(
              whereKey(key),
              eq(contentTranslationChunks.field, chunk.field),
              eq(contentTranslationChunks.chunkIndex, chunk.chunkIndex)
            )
          );
      }
    }
    return this.list(key);
  }

  async markSucceeded(
    key: ContentTranslationChunkKey,
    chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">,
    result: Pick<ContentTranslationChunk, "translatedText" | "provider" | "model" | "inputTokens" | "outputTokens">
  ) {
    await this.db
      .update(contentTranslationChunks)
      .set({ ...result, status: "succeeded", errorCode: null, updatedAt: new Date() })
      .where(and(whereKey(key), eq(contentTranslationChunks.field, chunk.field), eq(contentTranslationChunks.chunkIndex, chunk.chunkIndex)));
  }

  async markFailed(
    key: ContentTranslationChunkKey,
    chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">,
    errorCode: string
  ) {
    await this.db
      .update(contentTranslationChunks)
      .set({ status: "failed", errorCode, updatedAt: new Date() })
      .where(and(whereKey(key), eq(contentTranslationChunks.field, chunk.field), eq(contentTranslationChunks.chunkIndex, chunk.chunkIndex)));
  }
}

function whereKey(key: ContentTranslationChunkKey) {
  return and(
    eq(contentTranslationChunks.resourceType, key.resourceType),
    eq(contentTranslationChunks.resourceId, key.resourceId),
    eq(contentTranslationChunks.locale, key.locale),
    eq(contentTranslationChunks.sourceVersion, key.sourceVersion)
  );
}

function toChunk(row: typeof contentTranslationChunks.$inferSelect): ContentTranslationChunk {
  return {
    field: row.field,
    chunkIndex: row.chunkIndex,
    sourceText: row.sourceText,
    translatedText: row.translatedText,
    status: row.status,
    provider: row.provider,
    model: row.model,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    errorCode: row.errorCode
  };
}
