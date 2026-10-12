import type { ContentLocale, LocalizedResourceType } from "@mbc/api-contracts";

export type ContentTranslationChunkStatus = "pending" | "succeeded" | "failed";

export type ContentTranslationChunk = {
  field: string;
  chunkIndex: number;
  sourceText: string;
  translatedText: string | null;
  status: ContentTranslationChunkStatus;
  provider: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  errorCode: string | null;
};

export type ContentTranslationChunkKey = {
  resourceType: LocalizedResourceType;
  resourceId: string;
  locale: ContentLocale;
  sourceVersion: number;
};

export interface ContentTranslationChunkRepository {
  list(key: ContentTranslationChunkKey): Promise<ContentTranslationChunk[]>;
  ensure(
    key: ContentTranslationChunkKey,
    chunks: Array<Pick<ContentTranslationChunk, "field" | "chunkIndex" | "sourceText">>
  ): Promise<ContentTranslationChunk[]>;
  markSucceeded(
    key: ContentTranslationChunkKey,
    chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">,
    result: Pick<ContentTranslationChunk, "translatedText" | "provider" | "model" | "inputTokens" | "outputTokens">
  ): Promise<void>;
  markFailed(
    key: ContentTranslationChunkKey,
    chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">,
    errorCode: string
  ): Promise<void>;
}
