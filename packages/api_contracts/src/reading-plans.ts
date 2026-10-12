import { z } from "zod";

export const readingPlanStatusSchema = z.enum([
  "draft",
  "published",
  "paused",
  "archived"
]);

export const readingPlanVisibilitySchema = z.enum(["public", "members"]);

export const readingPlanAssignmentStatusSchema = z.enum([
  "not_started",
  "active",
  "completed",
  "paused",
  "abandoned"
]);

export const readingPlanDayProgressStatusSchema = z.enum([
  "available",
  "completed",
  "missed"
]);

export const readingPlanUserTypeSchema = z.enum(["member", "external"]);

export const readingPlanAssignmentSourceTypeSchema = z.enum([
  "self",
  "admin",
  "group",
  "course",
  "discipleship"
]);

export const readingPlanAssignmentScopeSchema = z.enum([
  "active",
  "history",
  "all"
]);

export const scriptureReferenceSchema = z
  .object({
    bookId: z.string().trim().min(1).max(40),
    chapter: z.number().int().positive().max(200),
    startVerse: z.number().int().positive().max(200),
    endVerse: z.number().int().positive().max(200),
    referenceLabel: z.string().trim().max(120).default("")
  })
  .refine((value) => value.endVerse >= value.startVerse, {
    message: "endVerse must be greater than or equal to startVerse.",
    path: ["endVerse"]
  });

export const readingPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  status: readingPlanStatusSchema.default("draft"),
  visibility: readingPlanVisibilitySchema.default("public"),
  locale: z.string().default("zh-Hans"),
  durationDays: z.number().int().positive().default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const readingPlanDaySchema = z.object({
  id: z.string(),
  planId: z.string(),
  dayNumber: z.number().int().positive(),
  title: z.string().default(""),
  description: z.string().default(""),
  references: z.array(scriptureReferenceSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const readingPlanDayProgressSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  dayId: z.string(),
  status: readingPlanDayProgressStatusSchema.default("available"),
  note: z.string().default(""),
  completedAt: z.string().nullable().default(null),
  updatedAt: z.string()
});

export const readingPlanAssignmentSchema = z.object({
  id: z.string(),
  planId: z.string(),
  planTitle: z.string(),
  planDurationDays: z.number().int().positive(),
  attemptNumber: z.number().int().positive(),
  userType: readingPlanUserTypeSchema,
  userId: z.string(),
  sourceType: readingPlanAssignmentSourceTypeSchema.default("self"),
  sourceId: z.string().nullable().default(null),
  status: readingPlanAssignmentStatusSchema.default("not_started"),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  endedAt: z.string().nullable().default(null),
  progress: z.array(readingPlanDayProgressSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const readingPlanCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  status: readingPlanStatusSchema.default("draft"),
  visibility: readingPlanVisibilitySchema.default("public"),
  locale: z.string().trim().min(2).max(16).default("zh-Hans"),
  durationDays: z.number().int().positive().max(366).default(7)
});

export const readingPlanUpdateRequestSchema =
  readingPlanCreateRequestSchema.partial();

export const readingPlanDayUpsertRequestSchema = z.object({
  dayNumber: z.number().int().positive().max(366),
  title: z.string().trim().max(160).default(""),
  description: z.string().trim().max(2000).default(""),
  references: z.array(scriptureReferenceSchema).min(1).max(12)
});

export const readingPlanAssignmentCreateRequestSchema = z.object({
  planId: z.string().uuid(),
  userType: readingPlanUserTypeSchema,
  userId: z.string().trim().min(1).max(200),
  sourceType: readingPlanAssignmentSourceTypeSchema.default("admin"),
  sourceId: z.string().trim().max(160).nullable().optional()
});

export const readingPlanDayProgressUpdateRequestSchema = z.object({
  status: readingPlanDayProgressStatusSchema,
  note: z.string().trim().max(2000).default("")
});

export const readingPlanAssignmentStatusUpdateRequestSchema = z.object({
  status: z.enum(["active", "paused", "abandoned"])
});

export const readingPlanListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  status: readingPlanStatusSchema.optional(),
  visibility: readingPlanVisibilitySchema.optional(),
  locale: z.string().optional(),
  query: z.string().optional()
});

export const readingPlanAssignmentListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  planId: z.string().uuid().optional(),
  userType: readingPlanUserTypeSchema.optional(),
  userId: z.string().optional(),
  status: readingPlanAssignmentStatusSchema.optional()
});

export const readingPlanMyAssignmentListQuerySchema = z.object({
  scope: readingPlanAssignmentScopeSchema.default("all"),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.coerce.number().int().nonnegative().default(0)
});

export const readingPlanListResponseSchema = z.object({
  items: z.array(readingPlanSchema)
});

export const readingPlanDayListResponseSchema = z.object({
  items: z.array(readingPlanDaySchema)
});

export const readingPlanAssignmentListResponseSchema = z.object({
  items: z.array(readingPlanAssignmentSchema),
  nextCursor: z.string().nullable().default(null)
});

export const readingPlanAssignmentDetailSchema = z.object({
  assignment: readingPlanAssignmentSchema,
  days: z.array(readingPlanDaySchema),
  canRestart: z.boolean()
});

export type ScriptureReference = z.infer<typeof scriptureReferenceSchema>;
export type ReadingPlanStatus = z.infer<typeof readingPlanStatusSchema>;
export type ReadingPlanVisibility = z.infer<typeof readingPlanVisibilitySchema>;
export type ReadingPlanAssignmentStatus = z.infer<
  typeof readingPlanAssignmentStatusSchema
>;
export type ReadingPlanDayProgressStatus = z.infer<
  typeof readingPlanDayProgressStatusSchema
>;
export type ReadingPlanUserType = z.infer<typeof readingPlanUserTypeSchema>;
export type ReadingPlanAssignmentSourceType = z.infer<
  typeof readingPlanAssignmentSourceTypeSchema
>;
export type ReadingPlanAssignmentScope = z.infer<
  typeof readingPlanAssignmentScopeSchema
>;
export type ReadingPlan = z.infer<typeof readingPlanSchema>;
export type ReadingPlanDay = z.infer<typeof readingPlanDaySchema>;
export type ReadingPlanDayProgress = z.infer<
  typeof readingPlanDayProgressSchema
>;
export type ReadingPlanAssignment = z.infer<
  typeof readingPlanAssignmentSchema
>;
export type ReadingPlanCreateRequest = z.infer<
  typeof readingPlanCreateRequestSchema
>;
export type ReadingPlanUpdateRequest = z.infer<
  typeof readingPlanUpdateRequestSchema
>;
export type ReadingPlanDayUpsertRequest = z.infer<
  typeof readingPlanDayUpsertRequestSchema
>;
export type ReadingPlanAssignmentCreateRequest = z.infer<
  typeof readingPlanAssignmentCreateRequestSchema
>;
export type ReadingPlanDayProgressUpdateRequest = z.infer<
  typeof readingPlanDayProgressUpdateRequestSchema
>;
export type ReadingPlanAssignmentStatusUpdateRequest = z.infer<
  typeof readingPlanAssignmentStatusUpdateRequestSchema
>;
export type ReadingPlanListQuery = z.infer<typeof readingPlanListQuerySchema>;
export type ReadingPlanAssignmentListQuery = z.infer<
  typeof readingPlanAssignmentListQuerySchema
>;
export type ReadingPlanMyAssignmentListQuery = z.infer<
  typeof readingPlanMyAssignmentListQuerySchema
>;
export type ReadingPlanAssignmentDetail = z.infer<
  typeof readingPlanAssignmentDetailSchema
>;
