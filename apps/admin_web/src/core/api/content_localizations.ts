import {
  contentLocalizationListResponseSchema,
  contentLocalizationAutoTranslateRequestSchema,
  contentLocalizationUpsertSchema,
  localizedContentSchema,
  localizedResourceTypeSchema,
  type ContentLocale,
  type ContentLocalizationUpsert,
  type LocalizedContent,
  type LocalizedResourceType
} from "@mbc/api-contracts";
import { apiClient } from "./client";

export function listContentLocalizations(resourceType: LocalizedResourceType, resourceId: string) {
  return apiClient.getData(`/admin/content-localizations/${encodeURIComponent(localizedResourceTypeSchema.parse(resourceType))}/${encodeURIComponent(resourceId)}`, contentLocalizationListResponseSchema);
}

export function saveContentLocalization(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale, input: Omit<ContentLocalizationUpsert, "locale">): Promise<LocalizedContent> {
  return apiClient.putData(`/admin/content-localizations/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/${encodeURIComponent(locale)}`, contentLocalizationUpsertSchema.omit({ locale: true }).parse(input), localizedContentSchema);
}

export function autoTranslateContentLocalization(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale, sourceVersion: number): Promise<LocalizedContent> {
  return apiClient.postData(`/admin/content-localizations/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/${encodeURIComponent(locale)}/auto-translate`, contentLocalizationAutoTranslateRequestSchema.parse({ sourceVersion }), localizedContentSchema);
}
