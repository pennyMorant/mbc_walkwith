import type { ContentLocale, ContentLocalizationUpsert, LocalizedContent, LocalizedResourceType } from "@mbc/api-contracts";
import { appError } from "../../shared/http/app-error.js";
import type { ContentLocalizationRepository, ContentLocalizationWriteInput } from "./content-localization.repository.js";

export class ContentLocalizationService {
  constructor(private readonly repository: ContentLocalizationRepository) {}
  list(resourceType: LocalizedResourceType, resourceId: string) { return this.repository.list(resourceType, resourceId); }
  upsert(resourceType: LocalizedResourceType, resourceId: string, input: ContentLocalizationWriteInput) { return this.repository.upsert(resourceType, resourceId, input); }
  async resolve(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale, sourceVersion: number) {
    const values = await this.repository.list(resourceType, resourceId);
    return values.find((value) => value.locale === locale && value.sourceVersion === sourceVersion) ?? null;
  }

  async assertWritable(resourceType: LocalizedResourceType, resourceId: string, sourceVersion: number, directory: ContentLocalizationResourceDirectory) {
    const source = await directory.get(resourceType, resourceId);
    if (!source) throw appError({ code: "content_localization_resource_not_found", message: "Localized resource was not found.", statusCode: 404, category: "not_found", sourceLayer: "feature", retryable: false, nextAction: "refresh" });
    if (source.version !== sourceVersion) throw appError({ code: "content_localization_source_changed", message: "The source content changed. Refresh before saving a translation.", statusCode: 409, category: "conflict", sourceLayer: "feature", retryable: false, nextAction: "refresh" });
  }

  async assertResource(resourceType: LocalizedResourceType, resourceId: string, directory: ContentLocalizationResourceDirectory) {
    if (!await directory.get(resourceType, resourceId)) {
      throw appError({ code: "content_localization_resource_not_found", message: "Localized resource was not found.", statusCode: 404, category: "not_found", sourceLayer: "feature", retryable: false, nextAction: "refresh" });
    }
  }

  async project<T extends Record<string, unknown>>(resourceType: LocalizedResourceType, resourceId: string, locale: ContentLocale, sourceVersion: number, value: T, allowedFields: readonly string[]): Promise<T> {
    const localized = await this.resolve(resourceType, resourceId, locale, sourceVersion);
    if (!localized) return value;
    const fields = Object.fromEntries(Object.entries(localized.fields).filter(([key]) => allowedFields.includes(key)));
    return { ...value, ...fields };
  }
}

export interface ContentLocalizationResourceDirectory {
  get(resourceType: LocalizedResourceType, resourceId: string): Promise<{ version: number; allowedFields: readonly string[]; sourceFields: Record<string, string> } | null>;
}
