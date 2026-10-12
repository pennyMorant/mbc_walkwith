import { z } from "zod";

export const prayerVisibilitySchema = z.enum([
  "private",
  "public",
  "group",
  "members"
]);
export const prayerStatusSchema = z.enum([
  "pending",
  "approved",
  "hidden",
  "archived"
]);

export const prayerRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  visibility: prayerVisibilitySchema.default("private"),
  groupId: z.string().nullable().default(null),
  status: prayerStatusSchema.default("pending"),
  submitterName: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const adminPrayerRequestSchema = prayerRequestSchema.extend({
  authorUserId: z.string().nullable().default(null),
  submitterEmail: z.string().nullable().default(null),
  moderationNote: z.string().default(""),
  moderatedAt: z.string().nullable().default(null),
  moderatedByAdminUserId: z.string().nullable().default(null)
});

export const prayerRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  visibility: prayerVisibilitySchema.optional(),
  groupId: z.string().optional()
});

export const memberPrayerRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: prayerStatusSchema.optional(),
  visibility: prayerVisibilitySchema.optional()
});

export const memberSharedPrayerRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  visibility: prayerVisibilitySchema.optional(),
  groupId: z.string().optional()
});

export const adminPrayerRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: prayerStatusSchema.optional(),
  visibility: prayerVisibilitySchema.optional(),
  groupId: z.string().optional(),
  query: z.string().optional()
});

const prayerRequestInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  visibility: prayerVisibilitySchema.default("private"),
  groupId: z.string().trim().min(1).nullable().optional(),
  submitterName: z.string().trim().max(120).default(""),
  submitterEmail: z.string().trim().email().nullable().optional()
});

export const prayerRequestCreateRequestSchema = prayerRequestInputSchema
  .superRefine((input, context) => {
    if (input.visibility === "group" && !input.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required for group prayer requests.",
        path: ["groupId"]
      });
    }
  });

export const prayerRequestUpdateRequestSchema = prayerRequestInputSchema
  .partial()
  .superRefine((input, context) => {
    if (input.visibility === "group" && !input.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required for group prayer requests.",
        path: ["groupId"]
      });
    }
  });

export const adminPrayerRequestUpdateRequestSchema = z
  .object({
    visibility: prayerVisibilitySchema.optional(),
    groupId: z.string().trim().min(1).nullable().optional(),
    status: prayerStatusSchema.optional(),
    moderationNote: z.string().trim().max(1000).optional()
  })
  .superRefine((input, context) => {
    if (input.visibility === "group" && !input.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required for group prayer requests.",
        path: ["groupId"]
      });
    }
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one prayer moderation field is required."
  });

export const adminPrayerRequestApproveRequestSchema = z
  .object({
    visibility: prayerVisibilitySchema.optional(),
    groupId: z.string().trim().min(1).nullable().optional(),
    moderationNote: z.string().trim().max(1000).optional(),
    notifyApp: z.boolean().default(false)
  })
  .superRefine((input, context) => {
    if (input.visibility === "group" && !input.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required for group prayer requests.",
        path: ["groupId"]
      });
    }
  });

export const prayerRequestListResponseSchema = z.object({
  items: z.array(prayerRequestSchema)
});

export const adminPrayerRequestListResponseSchema = z.object({
  items: z.array(adminPrayerRequestSchema)
});

export type PrayerVisibility = z.infer<typeof prayerVisibilitySchema>;
export type PrayerStatus = z.infer<typeof prayerStatusSchema>;
export type PrayerRequest = z.infer<typeof prayerRequestSchema>;
export type AdminPrayerRequest = z.infer<typeof adminPrayerRequestSchema>;
export type PrayerRequestListQuery = z.infer<
  typeof prayerRequestListQuerySchema
>;
export type MemberPrayerRequestListQuery = z.infer<
  typeof memberPrayerRequestListQuerySchema
>;
export type MemberSharedPrayerRequestListQuery = z.infer<
  typeof memberSharedPrayerRequestListQuerySchema
>;
export type AdminPrayerRequestListQuery = z.infer<
  typeof adminPrayerRequestListQuerySchema
>;
export type PrayerRequestCreateRequest = z.infer<
  typeof prayerRequestCreateRequestSchema
>;
export type PrayerRequestUpdateRequest = z.infer<
  typeof prayerRequestUpdateRequestSchema
>;
export type AdminPrayerRequestUpdateRequest = z.infer<
  typeof adminPrayerRequestUpdateRequestSchema
>;
export type AdminPrayerRequestApproveRequest = z.infer<
  typeof adminPrayerRequestApproveRequestSchema
>;
export type PrayerRequestListResponse = z.infer<
  typeof prayerRequestListResponseSchema
>;
export type AdminPrayerRequestListResponse = z.infer<
  typeof adminPrayerRequestListResponseSchema
>;
