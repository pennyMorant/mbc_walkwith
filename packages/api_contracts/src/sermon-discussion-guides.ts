import { z } from "zod";
import { contentLocaleSchema } from "./content_localization.js";

export const sermonDiscussionGuideStatusSchema = z.enum([
  "draft",
  "review",
  "published",
  "archived"
]);

export const sermonDiscussionQuestionTypeSchema = z.enum([
  "observation",
  "interpretation",
  "application",
  "prayer",
  "action"
]);

export const sermonDiscussionAudienceTypeSchema = z.enum([
  "public",
  "group",
  "course",
  "discipleship"
]);

export const sermonDiscussionResponseStatusSchema = z.enum([
  "private",
  "shared_with_group",
  "hidden",
  "archived"
]);

export const sermonDiscussionQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: sermonDiscussionQuestionTypeSchema,
  prompt: z.string().trim().min(1).max(1000),
  sortOrder: z.number().int().default(0),
  startSeconds: z.number().int().nonnegative().nullable().default(null)
});

export const sermonDiscussionActionStepSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(""),
  sortOrder: z.number().int().default(0)
});

export const sermonDiscussionQuestionListSchema = z
  .array(sermonDiscussionQuestionSchema)
  .max(50)
  .superRefine(addUniqueIdIssues);

export const sermonDiscussionActionStepListSchema = z
  .array(sermonDiscussionActionStepSchema)
  .max(50)
  .superRefine(addUniqueIdIssues);

export const sermonDiscussionPrayerPromptListSchema = z
  .array(z.string().trim().min(1).max(500))
  .max(50);

export const sermonDiscussionGuideSchema = z.object({
  id: z.string(),
  sermonId: z.string(),
  revision: z.number().int().nonnegative(),
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  title: z.string(),
  summary: z.string().default(""),
  status: sermonDiscussionGuideStatusSchema.default("draft"),
  audienceType: sermonDiscussionAudienceTypeSchema.default("public"),
  audienceId: z.string().nullable().default(null),
  questions: sermonDiscussionQuestionListSchema.default([]),
  actionSteps: sermonDiscussionActionStepListSchema.default([]),
  prayerPrompts: sermonDiscussionPrayerPromptListSchema.default([]),
  generatedMetadata: z.record(z.string(), z.unknown()).default({}),
  publishedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const publicSermonDiscussionGuideSchema =
  sermonDiscussionGuideSchema
    .omit({
      generatedMetadata: true
    })
    .extend({
      status: z.literal("published"),
      audienceType: z.literal("public"),
      audienceId: z.null()
    });

export const sermonDiscussionResponseSchema = z.object({
  id: z.string(),
  guideId: z.string(),
  questionId: z.string().nullable().default(null),
  userType: z.enum(["member", "external"]),
  userId: z.string(),
  status: sermonDiscussionResponseStatusSchema.default("private"),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const sermonDiscussionGuideCreateRequestSchema = z.object({
  sermonId: z.string().trim().min(1),
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(2000).default(""),
  status: sermonDiscussionGuideStatusSchema.default("draft"),
  audienceType: sermonDiscussionAudienceTypeSchema.default("public"),
  audienceId: z.string().trim().max(160).nullable().optional(),
  questions: sermonDiscussionQuestionListSchema.default([]),
  actionSteps: sermonDiscussionActionStepListSchema.default([]),
  prayerPrompts: sermonDiscussionPrayerPromptListSchema.default([]),
  generatedMetadata: z.record(z.string(), z.unknown()).default({})
});

export const sermonDiscussionGuideUpdateRequestSchema =
  sermonDiscussionGuideCreateRequestSchema
    .partial()
    .omit({
      sermonId: true
    })
    .extend({
      expectedRevision: z.number().int().nonnegative()
    });

export const sermonDiscussionResponseCreateRequestSchema = z.object({
  questionId: z.string().trim().min(1).max(80).nullable().optional(),
  content: z.string().trim().min(1).max(5000),
  status: z
    .enum(["private", "shared_with_group"])
    .default("private")
});

export const sermonDiscussionGuideListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  sermonId: z.string().optional(),
  status: sermonDiscussionGuideStatusSchema.optional(),
  audienceType: sermonDiscussionAudienceTypeSchema.optional(),
  query: z.string().optional()
});

export const sermonDiscussionResponseListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  guideId: z.string().optional(),
  status: sermonDiscussionResponseStatusSchema.optional(),
  userType: z.enum(["member", "external"]).optional()
});

export const sermonDiscussionGuideListResponseSchema = z.object({
  items: z.array(sermonDiscussionGuideSchema)
});

export const sermonDiscussionResponseListResponseSchema = z.object({
  items: z.array(sermonDiscussionResponseSchema)
});

export type SermonDiscussionGuideStatus = z.infer<
  typeof sermonDiscussionGuideStatusSchema
>;
export type SermonDiscussionQuestionType = z.infer<
  typeof sermonDiscussionQuestionTypeSchema
>;
export type SermonDiscussionAudienceType = z.infer<
  typeof sermonDiscussionAudienceTypeSchema
>;
export type SermonDiscussionResponseStatus = z.infer<
  typeof sermonDiscussionResponseStatusSchema
>;
export type SermonDiscussionQuestion = z.infer<
  typeof sermonDiscussionQuestionSchema
>;
export type SermonDiscussionActionStep = z.infer<
  typeof sermonDiscussionActionStepSchema
>;
export type SermonDiscussionGuide = z.infer<
  typeof sermonDiscussionGuideSchema
>;
export type PublicSermonDiscussionGuide = z.infer<
  typeof publicSermonDiscussionGuideSchema
>;
export type SermonDiscussionResponse = z.infer<
  typeof sermonDiscussionResponseSchema
>;
export type SermonDiscussionGuideCreateRequest = z.infer<
  typeof sermonDiscussionGuideCreateRequestSchema
>;
export type SermonDiscussionGuideUpdateRequest = z.infer<
  typeof sermonDiscussionGuideUpdateRequestSchema
>;
export type SermonDiscussionResponseCreateRequest = z.infer<
  typeof sermonDiscussionResponseCreateRequestSchema
>;
export type SermonDiscussionGuideListQuery = z.infer<
  typeof sermonDiscussionGuideListQuerySchema
>;
export type SermonDiscussionResponseListQuery = z.infer<
  typeof sermonDiscussionResponseListQuerySchema
>;

function addUniqueIdIssues(
  items: Array<{ id: string }>,
  context: z.RefinementCtx
) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Item ids must be unique.",
        path: [index, "id"]
      });
    }
    seen.add(item.id);
  });
}
