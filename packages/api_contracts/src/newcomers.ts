import { z } from "zod";

export const newcomerStatusSchema = z.enum([
  "new",
  "assigned",
  "contacted",
  "visited",
  "invited_to_group",
  "invited_to_course",
  "in_discipleship",
  "converted_to_member",
  "paused",
  "closed"
]);

export const newcomerFollowUpStatusSchema = z.enum([
  "planned",
  "completed",
  "missed",
  "cancelled"
]);

export const newcomerConversionStatusSchema = z.enum([
  "none",
  "linked_existing_member",
  "created_member",
  "declined"
]);

export const newcomerProfileSchema = z.object({
  id: z.string(),
  externalUserId: z.string().nullable().default(null),
  linkedMemberUserId: z.string().nullable().default(null),
  displayName: z.string(),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  preferredLanguage: z.string().default(""),
  source: z.string().default("app"),
  interest: z.string().default(""),
  status: newcomerStatusSchema.default("new"),
  assigneeAdminUserId: z.string().nullable().default(null),
  assigneeName: z.string().default(""),
  nextFollowUpAt: z.string().nullable().default(null),
  conversionStatus: newcomerConversionStatusSchema.default("none"),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const newcomerSubmissionSchema = newcomerProfileSchema.pick({
  id: true,
  displayName: true,
  status: true,
  createdAt: true
});

export const newcomerCreateRequestSchema = z.object({
  externalUserId: z
    .string()
    .trim()
    .min(5)
    .max(160)
    .regex(/^ext_[A-Za-z0-9_-]+$/, "externalUserId must use the ext_ format.")
    .optional(),
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(60).optional(),
  preferredLanguage: z.string().trim().max(32).default(""),
  source: z.string().trim().max(80).default("app"),
  interest: z.string().trim().max(2000).default("")
}).superRefine((input, context) => {
  if (input.externalUserId || input.email || input.phone) {
    return;
  }
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["externalUserId"],
    message: "Provide an external user id, email, or phone number."
  });
});

export const newcomerUpdateRequestSchema = z
  .object({
    linkedMemberUserId: z.string().trim().max(160).nullable().optional(),
    preferredLanguage: z.string().trim().max(32).optional(),
    interest: z.string().trim().max(2000).optional(),
    status: newcomerStatusSchema.optional(),
    assigneeAdminUserId: z.string().uuid().nullable().optional(),
    assigneeName: z.string().trim().max(120).optional(),
    nextFollowUpAt: z.string().datetime().nullable().optional(),
    conversionStatus: newcomerConversionStatusSchema.optional()
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "Provide at least one newcomer field to update."
  });

export const newcomerListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  status: newcomerStatusSchema.optional(),
  assigneeAdminUserId: z.string().uuid().optional(),
  query: z.string().optional()
});

export const newcomerFollowUpSchema = z.object({
  id: z.string(),
  newcomerId: z.string(),
  authorAdminUserId: z.string().nullable().default(null),
  authorName: z.string().default(""),
  note: z.string(),
  status: newcomerFollowUpStatusSchema.default("completed"),
  plannedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  createdAt: z.string()
});

export const newcomerFollowUpCreateRequestSchema = z.object({
  note: z.string().trim().min(1).max(4000),
  status: newcomerFollowUpStatusSchema.default("completed"),
  plannedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional()
});

export const newcomerProfileListResponseSchema = z.object({
  items: z.array(newcomerProfileSchema)
});

export const newcomerFollowUpListResponseSchema = z.object({
  items: z.array(newcomerFollowUpSchema)
});

export type NewcomerStatus = z.infer<typeof newcomerStatusSchema>;
export type NewcomerFollowUpStatus = z.infer<
  typeof newcomerFollowUpStatusSchema
>;
export type NewcomerConversionStatus = z.infer<
  typeof newcomerConversionStatusSchema
>;
export type NewcomerProfile = z.infer<typeof newcomerProfileSchema>;
export type NewcomerSubmission = z.infer<typeof newcomerSubmissionSchema>;
export type NewcomerCreateRequest = z.infer<
  typeof newcomerCreateRequestSchema
>;
export type NewcomerUpdateRequest = z.infer<
  typeof newcomerUpdateRequestSchema
>;
export type NewcomerListQuery = z.infer<typeof newcomerListQuerySchema>;
export type NewcomerFollowUp = z.infer<typeof newcomerFollowUpSchema>;
export type NewcomerFollowUpCreateRequest = z.infer<
  typeof newcomerFollowUpCreateRequestSchema
>;
export type NewcomerProfileListResponse = z.infer<
  typeof newcomerProfileListResponseSchema
>;
export type NewcomerFollowUpListResponse = z.infer<
  typeof newcomerFollowUpListResponseSchema
>;
