import { z } from "zod";

export const jobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled"
]);

export const jobTypeSchema = z.enum([
  "transcript_import",
  "outline_generation",
  "scripture_extraction"
]);

export const jobResultErrorSchema = z
  .object({
    code: z.string(),
    category: z.string(),
    sourceLayer: z
      .enum([
        "surface",
        "feature",
        "domain",
        "capability",
        "repository",
        "external",
        "unknown"
      ])
      .optional(),
    message: z.string(),
    recoverable: z.boolean().optional(),
    retryable: z.boolean().optional(),
    evidence: z.record(z.unknown()).default({}),
    nextAction: z.string().optional(),
    details: z.record(z.unknown()).default({})
  })
  .passthrough();

export const jobResultLifecycleSchema = z
  .object({
    owner: z.string(),
    state: z.enum(["failed_recoverable", "failed_terminal"]),
    retryable: z.boolean(),
    nextAction: z.string().optional()
  })
  .passthrough();

export const jobSchema = z.object({
  id: z.string(),
  type: jobTypeSchema,
  status: jobStatusSchema,
  resourceType: z.string().nullable().default(null),
  resourceId: z.string().nullable().default(null),
  payload: z.record(z.unknown()).default({}),
  result: z.record(z.unknown()).nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3),
  availableAt: z.string(),
  startedAt: z.string().nullable().default(null),
  finishedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const jobListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
  type: jobTypeSchema.optional(),
  status: jobStatusSchema.optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional()
});

export const updateJobStatusRequestSchema = z.object({
  status: jobStatusSchema,
  result: z.record(z.unknown()).nullable().optional(),
  errorMessage: z.string().nullable().optional()
});

export const jobListResponseSchema = z.object({
  items: z.array(jobSchema),
  nextCursor: z.string().nullable().default(null)
});

export const jobStatsByStatusSchema = z.object({
  queued: z.number().int().nonnegative().default(0),
  running: z.number().int().nonnegative().default(0),
  succeeded: z.number().int().nonnegative().default(0),
  failed: z.number().int().nonnegative().default(0),
  canceled: z.number().int().nonnegative().default(0)
});

export const jobStatsByTypeSchema = z.record(
  jobTypeSchema,
  z.number().int().nonnegative()
);

export const jobStatsResponseSchema = z.object({
  byStatus: jobStatsByStatusSchema,
  byType: jobStatsByTypeSchema,
  retryableFailed: z.number().int().nonnegative().default(0),
  exhaustedFailed: z.number().int().nonnegative().default(0),
  recentFailures: z.array(jobSchema),
  recentRunning: z.array(jobSchema),
  recentSucceeded: z.array(jobSchema)
});

export const sermonProductionPipelineCheckSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["ready", "warning", "blocked"]),
  detail: z.string()
});

export const sermonProductionPipelineStatusResponseSchema = z.object({
  ready: z.boolean(),
  updatedAt: z.string(),
  checks: z.array(sermonProductionPipelineCheckSchema)
});

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type JobResultError = z.infer<typeof jobResultErrorSchema>;
export type JobResultLifecycle = z.infer<typeof jobResultLifecycleSchema>;
export type Job = z.infer<typeof jobSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
export type UpdateJobStatusRequest = z.infer<
  typeof updateJobStatusRequestSchema
>;
export type JobListResponse = z.infer<typeof jobListResponseSchema>;
export type JobStatsResponse = z.infer<typeof jobStatsResponseSchema>;
export type SermonProductionPipelineCheck = z.infer<
  typeof sermonProductionPipelineCheckSchema
>;
export type SermonProductionPipelineStatusResponse = z.infer<
  typeof sermonProductionPipelineStatusResponseSchema
>;
