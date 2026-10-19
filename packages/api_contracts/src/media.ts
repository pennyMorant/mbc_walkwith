import { z } from "zod";

export const mediaAssetKindSchema = z.enum([
  "image",
  "audio",
  "document",
  "release"
]);

export const mediaVisibilitySchema = z.enum(["public", "private"]);

export const mediaConsentStatusSchema = z.enum([
  "pending",
  "approved",
  "restricted"
]);

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  kind: mediaAssetKindSchema,
  visibility: mediaVisibilitySchema,
  consentStatus: mediaConsentStatusSchema,
  url: z.string().url().nullable(),
  originalFileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  focalX: z.number().int().min(0).max(100),
  focalY: z.number().int().min(0).max(100),
  altText: z.string(),
  caption: z.string(),
  copyrightSource: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const mediaAssetListQuerySchema = z.object({
  kind: mediaAssetKindSchema.optional(),
  visibility: mediaVisibilitySchema.optional(),
  consentStatus: mediaConsentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const mediaAssetListResponseSchema = z.object({
  items: z.array(mediaAssetSchema)
});

export const mediaUsageSourceSchema = z.enum([
  "life_post",
  "public_landing"
]);

export const mediaUsageSlotSchema = z.enum([
  "life_post_image",
  "landing_hero_image",
  "landing_service_image",
  "landing_person_image",
  "landing_gallery_image"
]);

export const mediaAssetUsageSchema = z.object({
  source: mediaUsageSourceSchema,
  sourceId: z.string().min(1),
  sourceLabel: z.string().min(1),
  slot: mediaUsageSlotSchema
});

export const mediaAssetUsageListResponseSchema = z.object({
  items: z.array(mediaAssetUsageSchema)
});

export const mediaCleanupStatusSchema = z.enum([
  "pending",
  "failed",
  "succeeded"
]);

export const mediaCleanupReasonSchema = z.enum([
  "unbound_upload",
  "relocated_source"
]);

export const mediaCleanupTaskSchema = z.object({
  id: z.string().uuid(),
  mediaAssetId: z.string().uuid(),
  reason: mediaCleanupReasonSchema,
  status: mediaCleanupStatusSchema,
  attempts: z.number().int().nonnegative(),
  retryable: z.boolean(),
  lastError: z.string().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const mediaCleanupListQuerySchema = z.object({
  status: mediaCleanupStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const mediaCleanupListResponseSchema = z.object({
  items: z.array(mediaCleanupTaskSchema)
});

export const mediaAssetUploadMetadataSchema = z.object({
  kind: mediaAssetKindSchema.default("image"),
  visibility: mediaVisibilitySchema.default("public"),
  consentStatus: mediaConsentStatusSchema.default("approved"),
  altText: z.string().trim().max(500).default(""),
  caption: z.string().trim().max(2000).default(""),
  copyrightSource: z.string().trim().max(500).nullable().default(null)
});

export const mediaAssetUpdateRequestSchema = z
  .object({
    consentStatus: mediaConsentStatusSchema.optional(),
    focalX: z.number().int().min(0).max(100).optional(),
    focalY: z.number().int().min(0).max(100).optional(),
    altText: z.string().trim().max(500).optional(),
    caption: z.string().trim().max(2000).optional(),
    copyrightSource: z.string().trim().max(500).nullable().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaAssetKind = z.infer<typeof mediaAssetKindSchema>;
export type MediaVisibility = z.infer<typeof mediaVisibilitySchema>;
export type MediaConsentStatus = z.infer<typeof mediaConsentStatusSchema>;
export type MediaAssetListQuery = z.infer<typeof mediaAssetListQuerySchema>;
export type MediaAssetListResponse = z.infer<
  typeof mediaAssetListResponseSchema
>;
export type MediaUsageSource = z.infer<typeof mediaUsageSourceSchema>;
export type MediaUsageSlot = z.infer<typeof mediaUsageSlotSchema>;
export type MediaAssetUsage = z.infer<typeof mediaAssetUsageSchema>;
export type MediaAssetUsageListResponse = z.infer<
  typeof mediaAssetUsageListResponseSchema
>;
export type MediaCleanupStatus = z.infer<typeof mediaCleanupStatusSchema>;
export type MediaCleanupReason = z.infer<typeof mediaCleanupReasonSchema>;
export type MediaCleanupTask = z.infer<typeof mediaCleanupTaskSchema>;
export type MediaCleanupListQuery = z.infer<
  typeof mediaCleanupListQuerySchema
>;
export type MediaAssetUploadMetadata = z.infer<
  typeof mediaAssetUploadMetadataSchema
>;
export type MediaAssetUpdateRequest = z.infer<
  typeof mediaAssetUpdateRequestSchema
>;
