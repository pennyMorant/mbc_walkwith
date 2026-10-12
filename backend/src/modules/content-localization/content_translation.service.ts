import type { ContentLocale, LocalizedContent, LocalizedResourceType } from "@mbc/api-contracts";

import type { AiService } from "../ai/ai.service.js";
import { isAppError } from "../../shared/http/app-error.js";
import type { ContentTranslationChunkRepository } from "./content_translation_chunk.repository.js";
import type { ContentLocalizationService } from "./content-localization.service.js";

const maximumChunkLength = 3_000;
type GeneratedContentTranslation = {
  localized: LocalizedContent;
  latencyMs: number;
};

export type ContentTranslationProviderCall = {
  field: string;
  chunkIndex: number;
  outcome: "generated" | "failed";
  provider?: string | null;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number;
  errorCode?: string;
};

export class ContentTranslationService {
  constructor(
    private readonly localizations: ContentLocalizationService,
    private readonly chunks: ContentTranslationChunkRepository,
    private readonly ai: AiService
  ) {}

  async generate(input: {
    resourceType: LocalizedResourceType;
    resourceId: string;
    locale: ContentLocale;
    sourceVersion: number;
    fields: Record<string, string>;
    onProviderCall?: (call: ContentTranslationProviderCall) => Promise<void>;
  }): Promise<GeneratedContentTranslation> {
    const key = {
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      locale: input.locale,
      sourceVersion: input.sourceVersion
    };
    await this.chunks.ensure(key, chunkFields(input.fields));
    let records = await this.chunks.list(key);
    let latencyMs = 0;
    for (const record of records.filter((item) => item.status !== "succeeded")) {
      let result: Awaited<ReturnType<AiService["translateContent"]>>;
      try {
        result = await this.ai.translateContent(input.locale, {
          [record.field]: record.sourceText
        });
        latencyMs += result.latencyMs;
        await this.chunks.markSucceeded(key, record, {
          translatedText: result.fields[record.field]!,
          provider: result.provider,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens
        });
      } catch (error) {
        await this.chunks.markFailed(
          key,
          record,
          isAppError(error) ? error.code : "internal_error"
        );
        await input.onProviderCall?.({
          field: record.field,
          chunkIndex: record.chunkIndex,
          outcome: "failed",
          errorCode: isAppError(error) ? error.code : "internal_error"
        });
        throw error;
      }
      await input.onProviderCall?.({
        field: record.field,
        chunkIndex: record.chunkIndex,
        outcome: "generated",
        provider: result.provider,
        model: result.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        latencyMs: result.latencyMs
      });
    }
    records = await this.chunks.list(key);
    const fields = mergeChunks(records, input.fields);
    const completed = records.filter((item) => item.status === "succeeded");
    const last = completed.at(-1);
    const localized = await this.localizations.upsert(input.resourceType, input.resourceId, {
      locale: input.locale,
      sourceVersion: input.sourceVersion,
      source: "ai",
      fields,
      provider: last?.provider ?? null,
      model: last?.model ?? null,
      inputTokens: total(completed.map((item) => item.inputTokens)),
      outputTokens: total(completed.map((item) => item.outputTokens)),
      generatedAt: new Date().toISOString()
    });
    return { localized, latencyMs };
  }
}

export function contentTranslationChunkCount(fields: Record<string, string>) {
  return chunkFields(fields).length;
}

function chunkFields(fields: Record<string, string>) {
  return Object.entries(fields).flatMap(([field, value]) =>
    splitText(value).map((sourceText, chunkIndex) => ({ field, chunkIndex, sourceText }))
  );
}

function splitText(value: string) {
  if (value.length <= maximumChunkLength) return [value];
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of value.split(/(\n\n+)/)) {
    if (current.length > 0 && current.length + paragraph.length > maximumChunkLength) {
      chunks.push(current);
      current = "";
    }
    if (paragraph.length > maximumChunkLength) {
      for (let offset = 0; offset < paragraph.length; offset += maximumChunkLength) {
        if (current) chunks.push(current);
        current = paragraph.slice(offset, offset + maximumChunkLength);
      }
    } else {
      current += paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function mergeChunks(
  records: Awaited<ReturnType<ContentTranslationChunkRepository["list"]>>,
  sourceFields: Record<string, string>
) {
  const grouped = new Map<string, string[]>();
  for (const record of records) {
    if (record.status !== "succeeded" || record.translatedText === null) {
      throw new Error(`Translation chunk ${record.field}:${record.chunkIndex} is incomplete.`);
    }
    grouped.set(record.field, [...(grouped.get(record.field) ?? []), record.translatedText]);
  }
  return Object.fromEntries(
    Object.keys(sourceFields).map((field) => [field, (grouped.get(field) ?? []).join("")])
  );
}

function total(values: Array<number | null>) {
  return values.some((value) => value === null)
    ? null
    : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
