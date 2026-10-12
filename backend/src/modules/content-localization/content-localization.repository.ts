import type {
  ContentLocale,
  ContentLocalizationUpsert,
  LocalizedContent,
  LocalizedResourceType
} from "@mbc/api-contracts";

export interface ContentLocalizationRepository {
  list(resourceType: LocalizedResourceType, resourceId: string): Promise<LocalizedContent[]>;
  upsert(
    resourceType: LocalizedResourceType,
    resourceId: string,
    input: ContentLocalizationWriteInput
  ): Promise<LocalizedContent>;
  remove(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale): Promise<void>;
}

export type ContentLocalizationWriteInput = ContentLocalizationUpsert & {
  inputTokens?: number | null;
  outputTokens?: number | null;
  generatedAt?: string | null;
};
