import { z } from "zod";

export const pushDevicePlatformSchema = z.enum(["ios", "android"]);
export const pushDeviceProviderSchema = z.enum(["fcm"]);
export const pushPermissionStatusSchema = z.enum([
  "authorized",
  "denied",
  "provisional",
  "not_determined"
]);
export const notificationAudienceSchema = z.enum([
  "public",
  "members",
  "member_specific"
]);

export const memberPushDeviceSchema = z.object({
  id: z.string(),
  installationId: z.string(),
  platform: pushDevicePlatformSchema,
  provider: pushDeviceProviderSchema.default("fcm"),
  pushToken: z.string(),
  permissionStatus: pushPermissionStatusSchema,
  locale: z.string().default("en"),
  appVersion: z.string().nullable().default(null),
  lastSeenAt: z.string(),
  updatedAt: z.string(),
  revokedAt: z.string().nullable().default(null)
});

export const upsertMemberPushDeviceRequestSchema = z.object({
  installationId: z.string().trim().min(1).max(200),
  platform: pushDevicePlatformSchema,
  provider: pushDeviceProviderSchema.default("fcm"),
  pushToken: z.string().trim().min(16).max(4096),
  permissionStatus: pushPermissionStatusSchema,
  locale: z.string().trim().min(2).max(32).default("en"),
  appVersion: z.string().trim().min(1).max(64).nullable().optional()
});

export const revokeMemberPushDeviceRequestSchema = z.object({
  installationId: z.string().trim().min(1).max(200)
});

export const upsertGuestPushDeviceRequestSchema =
  upsertMemberPushDeviceRequestSchema;

export const revokeGuestPushDeviceRequestSchema =
  revokeMemberPushDeviceRequestSchema;

export const memberPushDeviceResponseSchema = z.object({
  accepted: z.boolean(),
  device: memberPushDeviceSchema
});

export const revokeMemberPushDeviceResponseSchema = z.object({
  accepted: z.boolean()
});

export const memberNotificationItemSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  route: z.string().nullable().default(null),
  data: z.record(z.string()).default({}),
  readAt: z.string().nullable().default(null),
  archivedAt: z.string().nullable().default(null),
  createdAt: z.string()
});

export const memberNotificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const memberNotificationListResponseSchema = z.object({
  items: z.array(memberNotificationItemSchema),
  unreadCount: z.number().int().nonnegative()
});

export const memberNotificationItemResponseSchema = z.object({
  item: memberNotificationItemSchema.nullable()
});

export const memberNotificationReadAllResponseSchema = z.object({
  updatedCount: z.number().int().nonnegative()
});

export const memberNotificationArchiveAllResponseSchema = z.object({
  updatedCount: z.number().int().nonnegative()
});

export const notificationDeliveryStatusSchema = z.enum([
  "queued",
  "sent",
  "failed",
  "retrying",
  "cancelled"
]);

export const notificationPushMessageSchema = z.object({
  type: z.string(),
  title: z.string(),
  body: z.string(),
  route: z.string().optional(),
  data: z.record(z.string()).optional()
});

export const notificationDeliveryTaskSchema = z.object({
  id: z.string(),
  messageId: z.string().nullable(),
  type: z.string(),
  channel: z.literal("push"),
  dedupeKey: z.string(),
  audience: notificationAudienceSchema.default("members"),
  preferenceKey: z.string().nullable().default(null),
  recipientUserIds: z.array(z.string()).default([]),
  status: notificationDeliveryStatusSchema,
  payload: notificationPushMessageSchema,
  recipientCount: z.number().int().nonnegative(),
  attempts: z.number().int().nonnegative(),
  providerEvidence: z.record(z.unknown()).default({}),
  lastErrorCode: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
  nextAttemptAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const adminNotificationDeliveryListResponseSchema = z.object({
  items: z.array(notificationDeliveryTaskSchema),
  nextCursor: z.string().nullable()
});

export const adminNotificationDeliveryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: notificationDeliveryStatusSchema.optional(),
  type: z.string().trim().min(1).optional(),
  cursor: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z~[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    .optional()
});

export const adminNotificationRetryDueRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20)
});

export const adminNotificationRetryDueResponseSchema = z.object({
  processed: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      attempted: z.number().int().nonnegative(),
      sent: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
      revokedTokens: z.number().int().nonnegative()
    })
  )
});

export const adminNotificationRetryOneResponseSchema = z.object({
  result: z.object({
    attempted: z.number().int().nonnegative(),
    sent: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    revokedTokens: z.number().int().nonnegative()
  })
});

export const adminNotificationCancelResponseSchema = z.object({
  task: notificationDeliveryTaskSchema
});

export type PushDevicePlatform = z.infer<typeof pushDevicePlatformSchema>;
export type PushDeviceProvider = z.infer<typeof pushDeviceProviderSchema>;
export type PushPermissionStatus = z.infer<typeof pushPermissionStatusSchema>;
export type NotificationAudience = z.infer<typeof notificationAudienceSchema>;
export type MemberPushDevice = z.infer<typeof memberPushDeviceSchema>;
export type UpsertMemberPushDeviceRequest = z.infer<
  typeof upsertMemberPushDeviceRequestSchema
>;
export type RevokeMemberPushDeviceRequest = z.infer<
  typeof revokeMemberPushDeviceRequestSchema
>;
export type UpsertGuestPushDeviceRequest = z.infer<
  typeof upsertGuestPushDeviceRequestSchema
>;
export type RevokeGuestPushDeviceRequest = z.infer<
  typeof revokeGuestPushDeviceRequestSchema
>;
export type MemberPushDeviceResponse = z.infer<
  typeof memberPushDeviceResponseSchema
>;
export type RevokeMemberPushDeviceResponse = z.infer<
  typeof revokeMemberPushDeviceResponseSchema
>;
export type MemberNotificationItem = z.infer<
  typeof memberNotificationItemSchema
>;
export type MemberNotificationListQuery = z.infer<
  typeof memberNotificationListQuerySchema
>;
export type MemberNotificationListResponse = z.infer<
  typeof memberNotificationListResponseSchema
>;
export type MemberNotificationItemResponse = z.infer<
  typeof memberNotificationItemResponseSchema
>;
export type MemberNotificationReadAllResponse = z.infer<
  typeof memberNotificationReadAllResponseSchema
>;
export type MemberNotificationArchiveAllResponse = z.infer<
  typeof memberNotificationArchiveAllResponseSchema
>;
export type NotificationDeliveryStatus = z.infer<
  typeof notificationDeliveryStatusSchema
>;
export type NotificationPushMessage = z.infer<
  typeof notificationPushMessageSchema
>;
export type NotificationDeliveryTask = z.infer<
  typeof notificationDeliveryTaskSchema
>;
export type AdminNotificationDeliveryListResponse = z.infer<
  typeof adminNotificationDeliveryListResponseSchema
>;
export type AdminNotificationDeliveryListQuery = z.infer<
  typeof adminNotificationDeliveryListQuerySchema
>;
export type AdminNotificationRetryDueRequest = z.infer<
  typeof adminNotificationRetryDueRequestSchema
>;
export type AdminNotificationRetryDueResponse = z.infer<
  typeof adminNotificationRetryDueResponseSchema
>;
export type AdminNotificationRetryOneResponse = z.infer<
  typeof adminNotificationRetryOneResponseSchema
>;
export type AdminNotificationCancelResponse = z.infer<
  typeof adminNotificationCancelResponseSchema
>;
