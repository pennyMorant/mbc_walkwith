import { contentStatuses } from "@mbc/shared-types";
import { z } from "zod";
import { contentLocaleSchema } from "./content_localization.js";

export const sermonStatusSchema = z.enum(contentStatuses);
export const sermonDateSchema = z.string().date();
export const sermonRevisionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(2_147_483_647);
export const sermonRevisionHeaderSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .transform(Number)
  .pipe(sermonRevisionSchema);

export const sermonOutlineItemSchema = z.object({
  title: z.string().min(1),
  startSeconds: z.number().int().nonnegative(),
  summary: z.string().default("")
});

export const sermonReferenceSchema = z.object({
  reference: z.string().min(1),
  verseId: z.string().min(1),
  note: z.string().default(""),
  startSeconds: z.number().int().nonnegative().nullable().optional()
});

export const sermonTranscriptSchema = z.object({
  text: z.string().default(""),
  source: z.string().nullable().default(null),
  updatedAt: z.string().nullable().default(null)
});

export const sermonProcessingMetadataSchema = z
  .record(z.string(), z.unknown())
  .default({});

export const sermonTopicsSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(12)
  .transform((topics) => [
    ...new Map(
      topics.map((topic) => [topic.toLowerCase(), topic])
    ).values()
  ]);

export const sermonAudioStatusSchema = z.enum(["missing", "ready", "failed"]);

export const sermonAudioSchema = z.object({
  url: z.string().nullable().default(null),
  fileName: z.string().nullable().default(null),
  mimeType: z.string().nullable().default(null),
  sizeBytes: z.number().int().nonnegative().default(0),
  status: sermonAudioStatusSchema.default("missing"),
  uploadedAt: z.string().nullable().default(null)
});

export const sermonSchema = z.object({
  id: z.string(),
  revision: sermonRevisionSchema,
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  title: z.string(),
  speaker: z.string(),
  sermonDate: sermonDateSchema,
  series: z.string().nullable().default(null),
  topics: sermonTopicsSchema.default([]),
  primaryReference: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  durationSeconds: z.number().int().nonnegative().default(0),
  thumbnailUrl: z.string().nullable().default(null),
  audio: sermonAudioSchema.default({
    url: null,
    fileName: null,
    mimeType: null,
    sizeBytes: 0,
    status: "missing",
    uploadedAt: null
  }),
  status: sermonStatusSchema,
  publishedAt: z.string().nullable().default(null),
  outline: z.array(sermonOutlineItemSchema).default([]),
  references: z.array(sermonReferenceSchema).default([]),
  transcript: sermonTranscriptSchema.nullable().default(null),
  reviewMarkdown: z.string().nullable().default(null),
  processingMetadata: sermonProcessingMetadataSchema.nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const sermonListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
  speaker: z.string().optional(),
  series: z.string().optional(),
  topic: z.string().trim().min(1).max(80).optional(),
  bookId: z.string().optional(),
  query: z.string().optional(),
  status: sermonStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const sermonRecommendationQuerySchema = z.object({
  bookId: z.string().min(1),
  chapter: z.coerce.number().int().positive().optional(),
  verseId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(20).default(3)
});

export const updateSermonRequestSchema = z.object({
  sourceLocale: contentLocaleSchema.optional(),
  title: z.string().min(1).optional(),
  speaker: z.string().min(1).optional(),
  sermonDate: sermonDateSchema.optional(),
  series: z.string().nullable().optional(),
  topics: sermonTopicsSchema.optional(),
  primaryReference: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  status: sermonStatusSchema.optional(),
  outline: z.array(sermonOutlineItemSchema).optional(),
  references: z.array(sermonReferenceSchema).optional(),
  transcript: sermonTranscriptSchema.nullable().optional(),
  reviewMarkdown: z.string().nullable().optional(),
  processingMetadata: sermonProcessingMetadataSchema.nullable().optional()
});

export const createLocalSermonDraftRequestSchema = z.object({
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  title: z.string().min(1),
  speaker: z.string().min(1),
  sermonDate: sermonDateSchema,
  series: z.string().nullable().optional(),
  topics: sermonTopicsSchema.optional(),
  primaryReference: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  transcript: sermonTranscriptSchema.optional(),
  reviewMarkdown: z.string().nullable().optional()
});

export const localSermonPackageRequestSchema = z.object({
  title: z.string().min(1).optional(),
  speaker: z.string().min(1).optional(),
  sermonDate: sermonDateSchema.optional(),
  series: z.string().nullable().optional(),
  topics: sermonTopicsSchema.optional(),
  primaryReference: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  transcript: sermonTranscriptSchema,
  outline: z.array(sermonOutlineItemSchema).default([]),
  references: z.array(sermonReferenceSchema).default([]),
  reviewMarkdown: z.string().nullable().optional(),
  processingMetadata: sermonProcessingMetadataSchema.default({}),
  submitForReview: z.boolean().default(true)
});

export const sermonListResponseSchema = z.object({
  items: z.array(sermonSchema),
  nextCursor: z.string().nullable().default(null)
});

export const publicSermonSchema = sermonSchema.omit({
  revision: true,
  reviewMarkdown: true,
  processingMetadata: true
});

export const publicSermonListResponseSchema = z.object({
  items: z.array(publicSermonSchema),
  nextCursor: z.string().nullable().default(null)
});

export const sermonDiscoveryFacetsSchema = z.object({
  speakers: z.array(z.string()),
  series: z.array(z.string()),
  topics: z.array(z.string())
});

export const sermonProgressUpdateRequestSchema = z.object({
  positionSeconds: z.number().int().nonnegative(),
  completed: z.boolean().default(false)
});

export const sermonProgressSchema = z.object({
  sermonId: z.string(),
  positionSeconds: z.number().int().nonnegative(),
  completed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime()
});

export const sermonAudioCleanupStatusSchema = z.enum([
  "pending",
  "failed",
  "succeeded"
]);

export const sermonAudioCleanupReasonSchema = z.enum([
  "audio_replaced",
  "audio_removed",
  "sermon_deleted",
  "unbound_upload"
]);

export const sermonAudioCleanupTaskSchema = z.object({
  id: z.string(),
  sermonId: z.string(),
  reason: sermonAudioCleanupReasonSchema,
  status: sermonAudioCleanupStatusSchema,
  attempts: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const sermonAudioCleanupListQuerySchema = z.object({
  status: sermonAudioCleanupStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const sermonAudioCleanupListResponseSchema = z.object({
  items: z.array(sermonAudioCleanupTaskSchema)
});

export type SermonStatus = z.infer<typeof sermonStatusSchema>;
export type SermonAudioStatus = z.infer<typeof sermonAudioStatusSchema>;
export type SermonAudio = z.infer<typeof sermonAudioSchema>;
export type SermonOutlineItem = z.infer<typeof sermonOutlineItemSchema>;
export type SermonReference = z.infer<typeof sermonReferenceSchema>;
export type SermonTranscript = z.infer<typeof sermonTranscriptSchema>;
export type SermonProcessingMetadata = z.infer<
  typeof sermonProcessingMetadataSchema
>;
export type SermonTopics = z.infer<typeof sermonTopicsSchema>;
export type Sermon = z.infer<typeof sermonSchema>;
export type PublicSermon = z.infer<typeof publicSermonSchema>;
export type SermonProgress = z.infer<typeof sermonProgressSchema>;
export type SermonProgressUpdateRequest = z.infer<
  typeof sermonProgressUpdateRequestSchema
>;
export type SermonAudioCleanupStatus = z.infer<
  typeof sermonAudioCleanupStatusSchema
>;
export type SermonAudioCleanupReason = z.infer<
  typeof sermonAudioCleanupReasonSchema
>;
export type SermonAudioCleanupTask = z.infer<
  typeof sermonAudioCleanupTaskSchema
>;
export type SermonAudioCleanupListQuery = z.infer<
  typeof sermonAudioCleanupListQuerySchema
>;
export type SermonListQuery = z.infer<typeof sermonListQuerySchema>;
export type SermonRecommendationQuery = z.infer<
  typeof sermonRecommendationQuerySchema
>;
export type SermonDiscoveryFacets = z.infer<
  typeof sermonDiscoveryFacetsSchema
>;
export type SermonListResponse = z.infer<typeof sermonListResponseSchema>;
export type UpdateSermonRequest = z.infer<typeof updateSermonRequestSchema>;
export type CreateLocalSermonDraftRequest = z.infer<
  typeof createLocalSermonDraftRequestSchema
>;
export type LocalSermonPackageRequest = z.infer<
  typeof localSermonPackageRequestSchema
>;
