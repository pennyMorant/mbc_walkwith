import type {
  ContentLocale,
  ContentLocalizationUpsert,
  LocalizedContent,
  LocalizedResourceType
} from "@mbc/api-contracts";
import { and, eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  lifePostTranslations,
  sermonDiscussionGuideTranslations,
  sermonTranslations
} from "../../shared/db/schema.js";
import type { ContentLocalizationRepository, ContentLocalizationWriteInput } from "./content-localization.repository.js";

type TranslationRow = {
  locale: string;
  sourceVersion: number;
  source: "admin" | "ai";
  fields: unknown;
  provider: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  generatedAt: Date | null;
  updatedAt: Date;
};

export class PostgresContentLocalizationRepository
  implements ContentLocalizationRepository
{
  constructor(private readonly db: AppDb) {}

  async list(resourceType: LocalizedResourceType, resourceId: string) {
    const rows = await this.rowsFor(resourceType, resourceId);
    return rows.map(localizedContentFromRow);
  }

  async upsert(
    resourceType: LocalizedResourceType,
    resourceId: string,
    input: ContentLocalizationWriteInput
  ) {
    const values = {
      locale: input.locale,
      sourceVersion: input.sourceVersion,
      source: input.source,
      fields: input.fields,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      generatedAt: input.generatedAt ? new Date(input.generatedAt) : null,
      updatedAt: new Date()
    };
    const row = await this.upsertFor(resourceType, resourceId, values);
    return localizedContentFromRow(row);
  }

  async remove(
    resourceType: LocalizedResourceType,
    resourceId: string,
    locale: ContentLocale
  ) {
    if (resourceType === "life_post") {
      await this.db.delete(lifePostTranslations).where(and(eq(lifePostTranslations.lifePostId, resourceId), eq(lifePostTranslations.locale, locale)));
      return;
    }
    if (resourceType === "sermon") {
      await this.db.delete(sermonTranslations).where(and(eq(sermonTranslations.sermonId, resourceId), eq(sermonTranslations.locale, locale)));
      return;
    }
    if (resourceType === "sermon_discussion_guide") {
      await this.db.delete(sermonDiscussionGuideTranslations).where(and(eq(sermonDiscussionGuideTranslations.sermonDiscussionGuideId, resourceId), eq(sermonDiscussionGuideTranslations.locale, locale)));
      return;
    }
    await this.db
      .delete(sermonDiscussionGuideTranslations)
      .where(
        and(
          eq(sermonDiscussionGuideTranslations.sermonDiscussionGuideId, resourceId),
          eq(sermonDiscussionGuideTranslations.locale, locale)
        )
      );
  }

  private async rowsFor(resourceType: LocalizedResourceType, resourceId: string): Promise<TranslationRow[]> {
    if (resourceType === "life_post") return this.db.select().from(lifePostTranslations).where(eq(lifePostTranslations.lifePostId, resourceId));
    if (resourceType === "sermon") return this.db.select().from(sermonTranslations).where(eq(sermonTranslations.sermonId, resourceId));
    return this.db
      .select()
      .from(sermonDiscussionGuideTranslations)
      .where(
        eq(sermonDiscussionGuideTranslations.sermonDiscussionGuideId, resourceId)
      );
  }

  private async upsertFor(
    resourceType: LocalizedResourceType,
    resourceId: string,
    values: Omit<TranslationRow, "updatedAt"> & { updatedAt: Date }
  ): Promise<TranslationRow> {
    if (resourceType === "life_post") {
      const [row] = await this.db.insert(lifePostTranslations).values({ ...values, lifePostId: resourceId }).onConflictDoUpdate({ target: [lifePostTranslations.lifePostId, lifePostTranslations.locale], set: values }).returning();
      return row!;
    }
    if (resourceType === "sermon") {
      const [row] = await this.db.insert(sermonTranslations).values({ ...values, sermonId: resourceId }).onConflictDoUpdate({ target: [sermonTranslations.sermonId, sermonTranslations.locale], set: values }).returning();
      return row!;
    }
    if (resourceType === "sermon_discussion_guide") {
      const [row] = await this.db.insert(sermonDiscussionGuideTranslations).values({ ...values, sermonDiscussionGuideId: resourceId }).onConflictDoUpdate({ target: [sermonDiscussionGuideTranslations.sermonDiscussionGuideId, sermonDiscussionGuideTranslations.locale], set: values }).returning();
      return row!;
    }
    const [row] = await this.db
      .insert(sermonDiscussionGuideTranslations)
      .values({ ...values, sermonDiscussionGuideId: resourceId })
      .onConflictDoUpdate({
        target: [
          sermonDiscussionGuideTranslations.sermonDiscussionGuideId,
          sermonDiscussionGuideTranslations.locale
        ],
        set: values
      })
      .returning();
    return row!;
  }
}

function localizedContentFromRow(row: TranslationRow): LocalizedContent {
  return {
    locale: row.locale as ContentLocale,
    sourceVersion: row.sourceVersion,
    source: row.source as "admin" | "ai",
    fields: row.fields as Record<string, string>,
    provider: row.provider,
    model: row.model,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    generatedAt: row.generatedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}
