import { z } from "zod";

export const careRequestStatusSchema = z.enum([
  "submitted",
  "assigned",
  "in_progress",
  "resolved",
  "archived"
]);

export const carePrivacyLevelSchema = z.enum([
  "pastoral_only",
  "assigned_team",
  "admin_restricted"
]);

export const careFollowUpStatusSchema = z.enum([
  "planned",
  "completed",
  "cancelled"
]);

export const careRequestSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  memberDisplayName: z.string(),
  memberEmail: z.string(),
  title: z.string(),
  body: z.string(),
  status: careRequestStatusSchema.default("submitted"),
  privacyLevel: carePrivacyLevelSchema.default("pastoral_only"),
  assigneeName: z.string().default(""),
  nextFollowUpAt: z.string().nullable().default(null),
  version: z.number().int().positive().default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const careFollowUpSchema = z.object({
  id: z.string(),
  careRequestId: z.string(),
  authorAdminUserId: z.string().nullable().default(null),
  authorName: z.string().default(""),
  note: z.string(),
  status: careFollowUpStatusSchema.default("completed"),
  plannedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  createdAt: z.string()
});

export const careRequestAdminSchema = careRequestSummarySchema.extend({
  assigneeAdminUserId: z.string().nullable().default(null),
  internalNote: z.string().default(""),
  followUps: z.array(careFollowUpSchema).default([])
});

export const careAssigneeSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
});

export const careRequestCreateRequestSchema = z.object({
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(3000),
  privacyLevel: carePrivacyLevelSchema.default("pastoral_only")
});

export const careRequestUpdateRequestSchema = z.object({
  status: careRequestStatusSchema.optional(),
  privacyLevel: carePrivacyLevelSchema.optional(),
  assigneeAdminUserId: z.string().uuid().nullable().optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  internalNote: z.string().trim().max(3000).optional()
});

export const careFollowUpCreateRequestSchema = z
  .object({
    note: z.string().trim().min(1).max(3000),
    status: careFollowUpStatusSchema.default("completed"),
    plannedAt: z.string().datetime().nullable().optional(),
    completedAt: z.string().datetime().nullable().optional()
  })
  .superRefine((input, context) => {
    if (input.status === "planned" && !input.plannedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "plannedAt is required for planned care follow-ups.",
        path: ["plannedAt"]
      });
    }
    if (input.status !== "completed" && input.completedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "completedAt is only valid for completed care follow-ups.",
        path: ["completedAt"]
      });
    }
  });

export const careRequestListQuerySchema = z.object({
  status: careRequestStatusSchema.optional(),
  userId: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100)
});

export const memberCareRequestListQuerySchema = z.object({
  status: careRequestStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const careRequestSummaryListResponseSchema = z.object({
  items: z.array(careRequestSummarySchema)
});

export const careRequestAdminListResponseSchema = z.object({
  items: z.array(careRequestAdminSchema)
});

export const careAssigneeListResponseSchema = z.object({
  items: z.array(careAssigneeSchema)
});

export const careFollowUpListResponseSchema = z.object({
  items: z.array(careFollowUpSchema)
});

export type CareRequestStatus = z.infer<typeof careRequestStatusSchema>;
export type CarePrivacyLevel = z.infer<typeof carePrivacyLevelSchema>;
export type CareFollowUpStatus = z.infer<typeof careFollowUpStatusSchema>;
export type CareRequestSummary = z.infer<typeof careRequestSummarySchema>;
export type CareRequestAdmin = z.infer<typeof careRequestAdminSchema>;
export type CareAssignee = z.infer<typeof careAssigneeSchema>;
export type CareFollowUp = z.infer<typeof careFollowUpSchema>;
export type CareRequestCreateRequest = z.infer<
  typeof careRequestCreateRequestSchema
>;
export type CareRequestUpdateRequest = z.infer<
  typeof careRequestUpdateRequestSchema
>;
export type CareFollowUpCreateRequest = z.infer<
  typeof careFollowUpCreateRequestSchema
>;
export type CareRequestListQuery = z.infer<typeof careRequestListQuerySchema>;
export type MemberCareRequestListQuery = z.infer<
  typeof memberCareRequestListQuerySchema
>;
