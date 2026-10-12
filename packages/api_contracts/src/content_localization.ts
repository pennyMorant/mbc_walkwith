import { z } from "zod";

export const contentLocaleSchema = z.enum(["en", "es", "zh-Hans", "zh-Hant"]);
export const localizedResourceTypeSchema = z.enum([
  "life_post",
  "sermon",
  "sermon_discussion_guide"
]);

export const localizedContentSchema = z.object({
  locale: contentLocaleSchema,
  sourceVersion: z.number().int().nonnegative(),
  source: z.enum(["admin", "ai"]),
  fields: z.record(z.string().min(1).max(80), z.string().max(200000)).refine(
    (fields) => Object.keys(fields).length > 0 && Object.keys(fields).length <= 12,
    "At least one and at most twelve localized fields are required."
  ),
  provider: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  inputTokens: z.number().int().nonnegative().nullable().default(null),
  outputTokens: z.number().int().nonnegative().nullable().default(null),
  generatedAt: z.string().nullable().default(null),
  updatedAt: z.string()
});

export const contentLocalizationUpsertSchema = localizedContentSchema.omit({
  inputTokens: true,
  outputTokens: true,
  generatedAt: true,
  updatedAt: true
});
export const contentLocalizationResourceIdSchema = z.string().trim().min(1).max(120);
export const contentLocalizationListResponseSchema = z.object({
  items: z.array(localizedContentSchema)
});
export const contentLocalizationAutoTranslateRequestSchema = z.object({
  sourceVersion: z.number().int().nonnegative()
});

export type ContentLocale = z.infer<typeof contentLocaleSchema>;
export type LocalizedResourceType = z.infer<typeof localizedResourceTypeSchema>;
export type LocalizedContent = z.infer<typeof localizedContentSchema>;
export type ContentLocalizationUpsert = z.infer<typeof contentLocalizationUpsertSchema>;
export type ContentLocalizationAutoTranslateRequest = z.infer<typeof contentLocalizationAutoTranslateRequestSchema>;
