import { lifePostStatuses, visibilityLevels } from "@mbc/shared-types";
import { z } from "zod";
import { contentLocaleSchema } from "./content_localization.js";

export const lifePostVisibilitySchema = z.enum(visibilityLevels);
export const lifePostStatusSchema = z.enum(lifePostStatuses);
export const lifePostRevisionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(2_147_483_647);
export const lifePostRevisionHeaderSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .transform(Number)
  .pipe(lifePostRevisionSchema);
export const eventRegistrationStatusSchema = z.enum([
  "confirmed",
  "cancelled",
  "checked_in",
  "absent"
]);

export const eventRegistrationCheckInMethodSchema = z.enum([
  "member_self",
  "onsite_qr",
  "admin_manual"
]);

export const eventRegistrationSummarySchema = z.object({
  enabled: z.boolean().default(false),
  capacity: z.number().int().nullable().default(null),
  registeredCount: z.number().int().default(0),
  remainingCount: z.number().int().nullable().default(null),
  deadline: z.string().datetime().nullable().default(null),
  allowCancellation: z.boolean().default(true),
  maxPartySize: z.number().int().default(1),
  myRegistrationStatus: eventRegistrationStatusSchema.nullable().default(null),
  myPartySize: z.number().int().nullable().default(null),
  myNote: z.string().nullable().default(null),
  myCheckedInAt: z.string().datetime().nullable().default(null),
  myCheckInMethod: eventRegistrationCheckInMethodSchema.nullable().default(null)
});

export const lifePostSchema = z.object({
  id: z.string(),
  revision: lifePostRevisionSchema,
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  meta: z.string().default(""),
  iconName: z.string().default("church"),
  startsAt: z.string().datetime().nullable().default(null),
  endsAt: z.string().datetime().nullable().default(null),
  visibility: lifePostVisibilitySchema.default("public"),
  imageUrl: z.string().nullable().default(null),
  displayWeight: z.number().int().default(0),
  ctaLabel: z.string().nullable().default(null),
  ctaUrl: z.string().nullable().default(null),
  registrationEnabled: z.boolean().default(false),
  registrationCapacity: z.number().int().nullable().default(null),
  registrationDeadline: z.string().datetime().nullable().default(null),
  registrationAllowCancellation: z.boolean().default(true),
  registrationMaxPartySize: z.number().int().default(1),
  registrationSummary: eventRegistrationSummarySchema.default({}),
  status: lifePostStatusSchema.default("draft"),
  updatedAt: z.string(),
  isRead: z.boolean().optional(),
  readAt: z.string().datetime().nullable().optional()
});

export const publicLifePostSchema = lifePostSchema.omit({ revision: true });

export const lifePostSortSchema = z.enum([
  "priority_desc",
  "starts_at_asc"
]);

export const lifePostListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  visibility: lifePostVisibilitySchema.optional(),
  status: lifePostStatusSchema.optional(),
  query: z.string().optional(),
  type: z.string().optional(),
  sort: lifePostSortSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const lifePostUpsertRequestSchema = z.object({
  sourceLocale: contentLocaleSchema.default("zh-Hans"),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().default(""),
  meta: z.string().default(""),
  iconName: z.string().default("church"),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  visibility: lifePostVisibilitySchema.default("private"),
  imageUrl: z.string().trim().nullable().optional(),
  displayWeight: z.number().int().min(0).max(100).default(0),
  ctaLabel: z.string().trim().nullable().optional(),
  ctaUrl: z.string().trim().url().nullable().optional(),
  registrationEnabled: z.boolean().default(false),
  registrationCapacity: z.number().int().positive().nullable().optional(),
  registrationDeadline: z.string().datetime().nullable().optional(),
  registrationAllowCancellation: z.boolean().default(true),
  registrationMaxPartySize: z.number().int().min(1).max(20).default(1),
  status: lifePostStatusSchema.default("draft")
});

export const lifePostUpdateRequestSchema = lifePostUpsertRequestSchema.partial();
export const lifePostPublishContentSchema = lifePostUpdateRequestSchema.omit({
  status: true,
  visibility: true
});

export const lifePostPublishNotificationCopySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  body: z.string().trim().min(1).max(180).optional()
});
export const lifePostPublishNotificationSchema =
  lifePostPublishNotificationCopySchema.extend({
    sourceLocale: contentLocaleSchema.default("zh-Hans"),
    translations: z
      .record(contentLocaleSchema, lifePostPublishNotificationCopySchema)
      .optional()
  });

export const lifePostNotificationTranslationRequestSchema = z
  .object({
    targetLocale: contentLocaleSchema,
    title: z.string().trim().min(1).max(120).optional(),
    body: z.string().trim().min(1).max(180).optional()
  })
  .refine((value) => value.title !== undefined || value.body !== undefined, {
    message: "A notification title or body is required."
  });

export const lifePostPublishRequestSchema = z.object({
  visibility: z.enum(["public", "members"]).default("public"),
  content: lifePostPublishContentSchema.optional(),
  notifyApp: z.boolean().default(false),
  notification: lifePostPublishNotificationSchema.optional()
});

export const eventRegistrationSchema = z.object({
  id: z.string(),
  lifePostId: z.string(),
  userId: z.string().nullable().default(null),
  attendeeName: z.string(),
  attendeeEmail: z.string().nullable().default(null),
  partySize: z.number().int(),
  status: eventRegistrationStatusSchema,
  note: z.string().default(""),
  checkedInAt: z.string().datetime().nullable().default(null),
  checkInMethod: eventRegistrationCheckInMethodSchema.nullable().default(null),
  checkedInByAdminUserId: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const eventRegistrationRequestSchema = z.object({
  partySize: z.number().int().min(1).max(20).default(1),
  attendeeName: z.string().trim().max(120).optional(),
  attendeeEmail: z.string().trim().email().optional(),
  note: z.string().trim().max(500).optional()
});

export const eventRegistrationUpdateRequestSchema = z.object({
  status: eventRegistrationStatusSchema.optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  note: z.string().trim().max(500).optional()
});

export const eventRegistrationAdminCreateRequestSchema = z.object({
  attendeeName: z.string().trim().min(1).max(120),
  attendeeEmail: z.string().trim().email().nullable().optional(),
  partySize: z.number().int().min(1).max(20).default(1),
  note: z.string().trim().max(500).optional()
});

export const eventRegistrationMemberUpdateRequestSchema = z.object({
  partySize: z.number().int().min(1).max(20),
  note: z.string().trim().max(500).optional()
});

export const eventRegistrationListQuerySchema = z.object({
  status: eventRegistrationStatusSchema.optional(),
  query: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  offset: z.coerce.number().int().nonnegative().default(0)
});

export const eventCheckInCodeSchema = z.object({
  id: z.string(),
  lifePostId: z.string(),
  qrPayload: z.string(),
  shortCode: z.string(),
  expiresAt: z.string().datetime().nullable().default(null),
  disabledAt: z.string().datetime().nullable().default(null),
  createdByAdminUserId: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const eventCheckInCodeCreateRequestSchema = z.object({
  expiresAt: z.string().datetime().nullable().optional(),
  rotate: z.boolean().default(false)
});

export const eventCheckInCodeCheckInRequestSchema = z.object({
  code: z.string().trim().min(4).max(512)
});

export const eventCheckInCodeCheckInResponseSchema = z.object({
  post: publicLifePostSchema,
  registration: eventRegistrationSchema
});

export const lifePostListResponseSchema = z.object({
  items: z.array(lifePostSchema)
});

export const lifeImageUploadResponseSchema = z.object({
  imageUrl: z.string()
});

export const eventRegistrationListResponseSchema = z.object({
  items: z.array(eventRegistrationSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive().max(500),
  offset: z.number().int().nonnegative()
});

export const eventRegistrationExportResponseSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  csv: z.string()
});

export type LifePostVisibility = z.infer<typeof lifePostVisibilitySchema>;
export type LifePostStatus = z.infer<typeof lifePostStatusSchema>;
export type EventRegistrationStatus = z.infer<
  typeof eventRegistrationStatusSchema
>;
export type EventRegistrationCheckInMethod = z.infer<
  typeof eventRegistrationCheckInMethodSchema
>;
export type EventRegistrationSummary = z.infer<
  typeof eventRegistrationSummarySchema
>;
export type LifePost = z.infer<typeof lifePostSchema>;
export type PublicLifePost = z.infer<typeof publicLifePostSchema>;
export type LifePostListQuery = z.infer<typeof lifePostListQuerySchema>;
export type LifePostSort = z.infer<typeof lifePostSortSchema>;
export type LifePostUpsertRequest = z.infer<
  typeof lifePostUpsertRequestSchema
>;
export type LifePostUpdateRequest = z.infer<typeof lifePostUpdateRequestSchema>;
export type LifePostPublishNotification = z.infer<
  typeof lifePostPublishNotificationSchema
>;
export type LifePostPublishRequest = z.infer<
  typeof lifePostPublishRequestSchema
>;
export type LifePostListResponse = z.infer<typeof lifePostListResponseSchema>;
export type LifeImageUploadResponse = z.infer<
  typeof lifeImageUploadResponseSchema
>;
export type EventRegistration = z.infer<typeof eventRegistrationSchema>;
export type EventRegistrationRequest = z.infer<
  typeof eventRegistrationRequestSchema
>;
export type EventRegistrationAdminCreateRequest = z.infer<
  typeof eventRegistrationAdminCreateRequestSchema
>;
export type EventRegistrationUpdateRequest = z.infer<
  typeof eventRegistrationUpdateRequestSchema
>;
export type EventRegistrationMemberUpdateRequest = z.infer<
  typeof eventRegistrationMemberUpdateRequestSchema
>;
export type EventRegistrationListQuery = z.infer<
  typeof eventRegistrationListQuerySchema
>;
export type EventRegistrationListResponse = z.infer<
  typeof eventRegistrationListResponseSchema
>;
export type EventRegistrationExportResponse = z.infer<
  typeof eventRegistrationExportResponseSchema
>;
export type EventCheckInCode = z.infer<typeof eventCheckInCodeSchema>;
export type EventCheckInCodeCreateRequest = z.infer<
  typeof eventCheckInCodeCreateRequestSchema
>;
export type EventCheckInCodeCheckInRequest = z.infer<
  typeof eventCheckInCodeCheckInRequestSchema
>;
export type EventCheckInCodeCheckInResponse = z.infer<
  typeof eventCheckInCodeCheckInResponseSchema
>;
