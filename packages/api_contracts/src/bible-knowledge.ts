import { bibleTranslationIds, contentStatuses } from "@mbc/shared-types";
import { z } from "zod";

export const bibleKnowledgeEntityTypeSchema = z.enum(["person", "place"]);
export const bibleTranslationIdSchema = z.enum(bibleTranslationIds);
export const bibleKnowledgeStatusSchema = z.enum(contentStatuses);

export const bibleKnowledgeSectionSchema = z.object({
  type: z.string(),
  title: z.string(),
  body: z.string()
});

export const bibleKnowledgeEntitySchema = z.object({
  id: z.string(),
  type: bibleKnowledgeEntityTypeSchema,
  locale: z.string().default("en"),
  translationId: bibleTranslationIdSchema.default("web"),
  name: z.string(),
  category: z.string(),
  summary: z.string(),
  description: z.string(),
  sections: z.array(bibleKnowledgeSectionSchema),
  aliases: z.array(z.string()),
  verseAliases: z.record(z.array(z.string())).default({}),
  status: bibleKnowledgeStatusSchema.default("draft")
});

export const bibleKnowledgeListQuerySchema = z.object({
  translationId: bibleTranslationIdSchema.default("web"),
  locale: z.string().default("en"),
  query: z.string().optional(),
  type: bibleKnowledgeEntityTypeSchema.optional(),
  status: bibleKnowledgeStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const bibleKnowledgeUpsertRequestSchema = z.object({
  id: z.string().min(1),
  type: bibleKnowledgeEntityTypeSchema,
  locale: z.string().default("en"),
  translationId: bibleTranslationIdSchema.default("web"),
  name: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().default(""),
  description: z.string().default(""),
  sections: z.array(bibleKnowledgeSectionSchema).default([]),
  aliases: z.array(z.string()).default([]),
  verseAliases: z.record(z.array(z.string())).default({}),
  status: bibleKnowledgeStatusSchema.default("draft")
});

export const bibleKnowledgeUpdateRequestSchema =
  bibleKnowledgeUpsertRequestSchema.partial().omit({
    id: true,
    locale: true,
    translationId: true
  });

export const bibleKnowledgeListResponseSchema = z.object({
  items: z.array(bibleKnowledgeEntitySchema)
});

export type BibleKnowledgeEntityType = z.infer<
  typeof bibleKnowledgeEntityTypeSchema
>;
export type BibleKnowledgeSection = z.infer<typeof bibleKnowledgeSectionSchema>;
export type BibleKnowledgeEntity = z.infer<typeof bibleKnowledgeEntitySchema>;
export type BibleKnowledgeListQuery = z.infer<
  typeof bibleKnowledgeListQuerySchema
>;
export type BibleKnowledgeUpsertRequest = z.infer<
  typeof bibleKnowledgeUpsertRequestSchema
>;
export type BibleKnowledgeUpdateRequest = z.infer<
  typeof bibleKnowledgeUpdateRequestSchema
>;
export type BibleKnowledgeListResponse = z.infer<
  typeof bibleKnowledgeListResponseSchema
>;
