import type {
  ContentTranslationChunk,
  ContentTranslationChunkKey,
  ContentTranslationChunkRepository
} from "./content_translation_chunk.repository.js";

export class InMemoryContentTranslationChunkRepository
  implements ContentTranslationChunkRepository
{
  private readonly chunks = new Map<string, ContentTranslationChunk>();

  async list(key: ContentTranslationChunkKey) {
    return [...this.chunks.entries()]
      .filter(([id]) => id.startsWith(prefix(key)))
      .map(([, chunk]) => ({ ...chunk }))
      .sort((left, right) => left.field.localeCompare(right.field) || left.chunkIndex - right.chunkIndex);
  }

  async ensure(key: ContentTranslationChunkKey, chunks: Array<Pick<ContentTranslationChunk, "field" | "chunkIndex" | "sourceText">>) {
    for (const chunk of chunks) {
      const id = chunkId(key, chunk.field, chunk.chunkIndex);
      const existing = this.chunks.get(id);
      if (!existing || existing.sourceText !== chunk.sourceText) {
        this.chunks.set(id, {
          ...chunk,
          translatedText: null,
          status: "pending",
          provider: null,
          model: null,
          inputTokens: null,
          outputTokens: null,
          errorCode: null
        });
      }
    }
    return this.list(key);
  }

  async markSucceeded(key: ContentTranslationChunkKey, chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">, result: Pick<ContentTranslationChunk, "translatedText" | "provider" | "model" | "inputTokens" | "outputTokens">) {
    const id = chunkId(key, chunk.field, chunk.chunkIndex);
    const existing = this.chunks.get(id);
    if (existing) this.chunks.set(id, { ...existing, ...result, status: "succeeded", errorCode: null });
  }

  async markFailed(key: ContentTranslationChunkKey, chunk: Pick<ContentTranslationChunk, "field" | "chunkIndex">, errorCode: string) {
    const id = chunkId(key, chunk.field, chunk.chunkIndex);
    const existing = this.chunks.get(id);
    if (existing) this.chunks.set(id, { ...existing, status: "failed", errorCode });
  }
}

function prefix(key: ContentTranslationChunkKey) {
  return `${key.resourceType}:${key.resourceId}:${key.locale}:${key.sourceVersion}:`;
}

function chunkId(key: ContentTranslationChunkKey, field: string, chunkIndex: number) {
  return `${prefix(key)}${field}:${chunkIndex}`;
}
