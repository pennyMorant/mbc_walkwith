import { z } from "zod";

export const discipleshipJourneyStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "archived"
]);

export const discipleshipAssignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "paused",
  "cancelled"
]);

export const discipleshipTaskStatusSchema = z.enum([
  "locked",
  "available",
  "in_progress",
  "completed",
  "skipped",
  "needs_review"
]);

export const discipleshipTaskReferenceTypeSchema = z.enum([
  "reading_plan",
  "sermon",
  "sermon_discussion_guide",
  "course",
  "group_application",
  "serving_assignment",
  "event_registration",
  "care_request",
  "manual_review"
]);

export const discipleshipJourneySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  status: discipleshipJourneyStatusSchema.default("draft"),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const discipleshipStageSchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  title: z.string(),
  description: z.string().default(""),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const discipleshipTaskSchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  stageId: z.string().nullable().default(null),
  title: z.string(),
  description: z.string().default(""),
  referenceType: discipleshipTaskReferenceTypeSchema,
  referenceId: z.string().default(""),
  required: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const discipleshipTaskProgressSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  taskId: z.string(),
  status: discipleshipTaskStatusSchema.default("available"),
  note: z.string().default(""),
  completedAt: z.string().nullable().default(null),
  updatedAt: z.string()
});

export const discipleshipAssignmentSchema = z.object({
  id: z.string(),
  journeyId: z.string(),
  userId: z.string(),
  sourceType: z.enum(["member", "newcomer"]).default("member"),
  sourceId: z.string().nullable().default(null),
  assigneeAdminUserId: z.string().nullable().default(null),
  assigneeName: z.string().default(""),
  status: discipleshipAssignmentStatusSchema.default("not_started"),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  taskTotalCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative(),
  progress: z.array(discipleshipTaskProgressSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const memberDiscipleshipTaskProgressSchema =
  discipleshipTaskProgressSchema.omit({ note: true });

export const memberDiscipleshipAssignmentSchema = discipleshipAssignmentSchema
  .omit({
    userId: true,
    sourceType: true,
    sourceId: true,
    assigneeAdminUserId: true,
    progress: true
  })
  .extend({
    progress: z.array(memberDiscipleshipTaskProgressSchema).default([])
  });

export const discipleshipJourneyCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  status: discipleshipJourneyStatusSchema.default("draft")
});

export const discipleshipJourneyUpdateRequestSchema =
  discipleshipJourneyCreateRequestSchema.partial();

export const discipleshipStageCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  sortOrder: z.number().int().default(0)
});

export const discipleshipTaskCreateRequestSchema = z.object({
  stageId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(""),
  referenceType: discipleshipTaskReferenceTypeSchema,
  referenceId: z.string().trim().max(200).default(""),
  required: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

export const discipleshipAssignmentCreateRequestSchema = z
  .object({
    journeyId: z.string().uuid(),
    userId: z.string().trim().min(1).max(160),
    sourceType: z.enum(["member", "newcomer"]).default("member"),
    sourceId: z.string().trim().max(160).nullable().optional(),
    assigneeAdminUserId: z.string().uuid().nullable().optional(),
    assigneeName: z.string().trim().max(120).default("")
  })
  .superRefine((input, context) => {
    const sourceShapeValid =
      (input.sourceType === "member" && !input.sourceId) ||
      (input.sourceType === "newcomer" && Boolean(input.sourceId));
    if (!sourceShapeValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceId"],
        message: "sourceId is required only for newcomer assignments."
      });
    }
  });

export const discipleshipTaskProgressUpdateRequestSchema = z.object({
  status: discipleshipTaskStatusSchema,
  note: z.string().trim().max(2000).default("")
}).strict();

export const discipleshipJourneyListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  status: discipleshipJourneyStatusSchema.optional(),
  query: z.string().optional()
});

export const discipleshipAssignmentListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  status: discipleshipAssignmentStatusSchema.optional(),
  userId: z.string().optional(),
  journeyId: z.string().uuid().optional()
});

export const discipleshipJourneyListResponseSchema = z.object({
  items: z.array(discipleshipJourneySchema)
});

export const discipleshipStageListResponseSchema = z.object({
  items: z.array(discipleshipStageSchema)
});

export const discipleshipTaskListResponseSchema = z.object({
  items: z.array(discipleshipTaskSchema)
});

export const discipleshipAssignmentListResponseSchema = z.object({
  items: z.array(discipleshipAssignmentSchema)
});

export const memberDiscipleshipAssignmentListResponseSchema = z.object({
  items: z.array(memberDiscipleshipAssignmentSchema)
});

export type DiscipleshipJourneyStatus = z.infer<
  typeof discipleshipJourneyStatusSchema
>;
export type DiscipleshipAssignmentStatus = z.infer<
  typeof discipleshipAssignmentStatusSchema
>;
export type DiscipleshipTaskStatus = z.infer<
  typeof discipleshipTaskStatusSchema
>;
export type DiscipleshipTaskReferenceType = z.infer<
  typeof discipleshipTaskReferenceTypeSchema
>;
export type DiscipleshipJourney = z.infer<typeof discipleshipJourneySchema>;
export type DiscipleshipStage = z.infer<typeof discipleshipStageSchema>;
export type DiscipleshipTask = z.infer<typeof discipleshipTaskSchema>;
export type DiscipleshipTaskProgress = z.infer<
  typeof discipleshipTaskProgressSchema
>;
export type DiscipleshipAssignment = z.infer<
  typeof discipleshipAssignmentSchema
>;
export type MemberDiscipleshipAssignment = z.infer<
  typeof memberDiscipleshipAssignmentSchema
>;
export type DiscipleshipJourneyCreateRequest = z.infer<
  typeof discipleshipJourneyCreateRequestSchema
>;
export type DiscipleshipJourneyUpdateRequest = z.infer<
  typeof discipleshipJourneyUpdateRequestSchema
>;
export type DiscipleshipStageCreateRequest = z.infer<
  typeof discipleshipStageCreateRequestSchema
>;
export type DiscipleshipTaskCreateRequest = z.infer<
  typeof discipleshipTaskCreateRequestSchema
>;
export type DiscipleshipAssignmentCreateRequest = z.infer<
  typeof discipleshipAssignmentCreateRequestSchema
>;
export type DiscipleshipTaskProgressUpdateRequest = z.infer<
  typeof discipleshipTaskProgressUpdateRequestSchema
>;
export type DiscipleshipJourneyListQuery = z.infer<
  typeof discipleshipJourneyListQuerySchema
>;
export type DiscipleshipAssignmentListQuery = z.infer<
  typeof discipleshipAssignmentListQuerySchema
>;
