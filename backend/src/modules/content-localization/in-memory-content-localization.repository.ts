import type { ContentLocale, ContentLocalizationUpsert, LocalizedContent, LocalizedResourceType } from "@mbc/api-contracts";
import type { ContentLocalizationRepository, ContentLocalizationWriteInput } from "./content-localization.repository.js";

export class InMemoryContentLocalizationRepository implements ContentLocalizationRepository {
  private readonly values = new Map<string, LocalizedContent>();
  async list(resourceType: LocalizedResourceType, resourceId: string) {
    return [...this.values.entries()].filter(([key]) => key.startsWith(`${resourceType}:${resourceId}:`)).map(([, value]) => value);
  }
  async upsert(resourceType: LocalizedResourceType, resourceId: string, input: ContentLocalizationWriteInput) {
    const value: LocalizedContent = { ...input, inputTokens: input.inputTokens ?? null, outputTokens: input.outputTokens ?? null, generatedAt: input.generatedAt ?? null, updatedAt: new Date().toISOString() };
    this.values.set(key(resourceType, resourceId, input.locale), value);
    return value;
  }
  async remove(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale) {
    this.values.delete(key(resourceType, resourceId, locale));
  }
}
function key(type: string, id: string, locale: string) { return `${type}:${id}:${locale}`; }
