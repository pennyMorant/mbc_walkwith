import type {
  BibleKnowledgeEntity,
  BibleKnowledgeSection,
  BibleKnowledgeListQuery,
  BibleKnowledgeUpdateRequest,
  BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";
import { and, eq, ilike, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { bibleKnowledgeEntities } from "../../shared/db/schema.js";
import type { BibleKnowledgeRepository } from "./bible-knowledge.repository.js";

export class PostgresBibleKnowledgeRepository
  implements BibleKnowledgeRepository
{
  constructor(private readonly db: AppDb) {}

  async list(query: BibleKnowledgeListQuery): Promise<BibleKnowledgeEntity[]> {
    const filters = [
      eq(bibleKnowledgeEntities.locale, query.locale),
      eq(bibleKnowledgeEntities.translationId, query.translationId),
      query.type ? eq(bibleKnowledgeEntities.type, query.type) : undefined,
      query.status ? eq(bibleKnowledgeEntities.status, query.status) : undefined,
      query.query
        ? or(
            ilike(bibleKnowledgeEntities.id, `%${query.query}%`),
            ilike(bibleKnowledgeEntities.name, `%${query.query}%`),
            ilike(bibleKnowledgeEntities.category, `%${query.query}%`),
            ilike(bibleKnowledgeEntities.summary, `%${query.query}%`),
            ilike(bibleKnowledgeEntities.description, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await this.db
      .select()
      .from(bibleKnowledgeEntities)
      .where(and(...filters))
      .limit(query.limit);
    return rows.map(entityFromRow);
  }

  async getByKey(input: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<BibleKnowledgeEntity | null> {
    const [row] = await this.db
      .select()
      .from(bibleKnowledgeEntities)
      .where(keyFilter(input))
      .limit(1);
    return row ? entityFromRow(row) : null;
  }

  async create(
    input: BibleKnowledgeUpsertRequest
  ): Promise<BibleKnowledgeEntity> {
    const [row] = await this.db
      .insert(bibleKnowledgeEntities)
      .values({
        id: input.id,
        type: input.type,
        locale: input.locale,
        translationId: input.translationId,
        name: input.name,
        category: input.category,
        summary: input.summary,
        description: input.description,
        sections: input.sections,
        aliases: input.aliases,
        verseAliases: input.verseAliases,
        status: input.status,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create Bible knowledge entity.");
    }
    return entityFromRow(row);
  }

  async update(
    key: { id: string; locale: string; translationId: string },
    input: BibleKnowledgeUpdateRequest
  ): Promise<BibleKnowledgeEntity | null> {
    const existing = await this.getByKey(key);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(bibleKnowledgeEntities)
      .set({
        type: input.type ?? existing.type,
        name: input.name ?? existing.name,
        category: input.category ?? existing.category,
        summary: input.summary ?? existing.summary,
        description: input.description ?? existing.description,
        sections: input.sections ?? existing.sections,
        aliases: input.aliases ?? existing.aliases,
        verseAliases: input.verseAliases ?? existing.verseAliases,
        status: input.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(keyFilter(key))
      .returning();
    return row ? entityFromRow(row) : null;
  }

  async delete(key: {
    id: string;
    locale: string;
    translationId: string;
  }): Promise<boolean> {
    const deleted = await this.db
      .delete(bibleKnowledgeEntities)
      .where(keyFilter(key))
      .returning({ id: bibleKnowledgeEntities.id });
    return deleted.length > 0;
  }
}

type BibleKnowledgeRow = typeof bibleKnowledgeEntities.$inferSelect;

function entityFromRow(row: BibleKnowledgeRow): BibleKnowledgeEntity {
  return {
    id: row.id,
    type: row.type as BibleKnowledgeEntity["type"],
    locale: row.locale,
    translationId: row.translationId as BibleKnowledgeEntity["translationId"],
    name: row.name,
    category: row.category,
    summary: row.summary,
    description: row.description,
    sections: sectionsFromJson(row.sections),
    aliases: stringArrayFromJson(row.aliases),
    verseAliases: verseAliasesFromJson(row.verseAliases),
    status: row.status as BibleKnowledgeEntity["status"]
  };
}

function sectionsFromJson(value: unknown): BibleKnowledgeSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => {
      return Boolean(item) && typeof item === "object" && !Array.isArray(item);
    })
    .map((item) => ({
      type: typeof item.type === "string" ? item.type : "overview",
      title: typeof item.title === "string" ? item.title : "Overview",
      body: typeof item.body === "string" ? item.body : ""
    }))
    .filter((section) => section.title.trim() && section.body.trim());
}

function keyFilter(input: {
  id: string;
  locale: string;
  translationId: string;
}) {
  return and(
    eq(bibleKnowledgeEntities.id, input.id),
    eq(bibleKnowledgeEntities.locale, input.locale),
    eq(bibleKnowledgeEntities.translationId, input.translationId)
  );
}

function stringArrayFromJson(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function verseAliasesFromJson(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).map(([verseId, aliases]) => [
      verseId,
      stringArrayFromJson(aliases)
    ])
  );
}
