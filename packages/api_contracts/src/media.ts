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
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const mediaAssetListResponseSchema = z.object({
  items: z.array(mediaAssetSchema)
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
export type MediaAssetUploadMetadata = z.infer<
  typeof mediaAssetUploadMetadataSchema
>;
export type MediaAssetUpdateRequest = z.infer<
  typeof mediaAssetUpdateRequestSchema
>;
