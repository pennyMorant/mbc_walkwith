import { supportedLocales } from "@mbc/shared-types";
import { z } from "zod";

export const memberStatusSchema = z.enum([
  "active",
  "inactive",
  "pending",
  "blocked"
]);
export const memberRoleSchema = z.enum(["member", "leader", "pastor"]);

export const memberNotificationSettingsSchema = z.object({
  weeklyBulletin: z.boolean().default(true),
  sermonPublished: z.boolean().default(true),
  lifePostPublished: z.boolean().default(true),
  prayerUpdates: z.boolean().default(false)
});

export const memberProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  faithStartYear: z.number().int().nullable().default(null),
  baptizedYear: z.number().int().nullable().default(null),
  joinedChurchAt: z.string().date().nullable().default(null),
  emergencyContactName: z.string().nullable().default(null),
  emergencyContactPhone: z.string().nullable().default(null),
  status: memberStatusSchema.default("active"),
  roles: z.array(memberRoleSchema).default(["member"]),
  appLocale: z.enum(supportedLocales).default("en"),
  fellowshipGroupId: z.string().nullable().default(null),
  notificationSettings: memberNotificationSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export const memberListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  status: memberStatusSchema.optional(),
  fellowshipGroupId: z.string().trim().min(1).max(120).optional(),
  query: z.string().trim().min(1).max(120).optional()
});

export const memberCreateRequestSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  faithStartYear: z.number().int().min(1900).max(2100).nullable().optional(),
  baptizedYear: z.number().int().min(1900).max(2100).nullable().optional(),
  joinedChurchAt: z.string().date().nullable().optional(),
  emergencyContactName: z.string().trim().max(120).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(60).nullable().optional(),
  status: memberStatusSchema.default("active"),
  roles: z.array(memberRoleSchema).min(1).default(["member"]),
  appLocale: z.enum(supportedLocales).default("en"),
  fellowshipGroupId: z.string().trim().min(1).nullable().optional(),
  notificationSettings: memberNotificationSettingsSchema.default({})
});

export const memberUpdateRequestSchema = memberCreateRequestSchema.partial();

export const memberSelfUpdateRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  faithStartYear: z.number().int().min(1900).max(2100).nullable().optional(),
  baptizedYear: z.number().int().min(1900).max(2100).nullable().optional(),
  joinedChurchAt: z.string().date().nullable().optional(),
  emergencyContactName: z.string().trim().max(120).nullable().optional(),
  emergencyContactPhone: z.string().trim().max(60).nullable().optional(),
  appLocale: z.enum(supportedLocales).optional()
});

export const memberNotificationSettingsUpdateRequestSchema =
  memberNotificationSettingsSchema;

export const memberListItemSchema = memberProfileSchema.pick({
  id: true,
  email: true,
  displayName: true,
  status: true,
  roles: true,
  appLocale: true,
  fellowshipGroupId: true,
  createdAt: true,
  updatedAt: true
});

export const memberListResponseSchema = z.object({
  items: z.array(memberListItemSchema)
});

export type MemberStatus = z.infer<typeof memberStatusSchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type MemberNotificationSettings = z.infer<
  typeof memberNotificationSettingsSchema
>;
export type MemberProfile = z.infer<typeof memberProfileSchema>;
export type MemberListItem = z.infer<typeof memberListItemSchema>;
export type MemberListQuery = z.infer<typeof memberListQuerySchema>;
export type MemberCreateRequest = z.infer<typeof memberCreateRequestSchema>;
export type MemberUpdateRequest = z.infer<typeof memberUpdateRequestSchema>;
export type MemberSelfUpdateRequest = z.infer<
  typeof memberSelfUpdateRequestSchema
>;
export type MemberNotificationSettingsUpdateRequest = z.infer<
  typeof memberNotificationSettingsUpdateRequestSchema
>;
export type MemberListResponse = z.infer<typeof memberListResponseSchema>;
