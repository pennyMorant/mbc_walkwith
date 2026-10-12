import { z } from "zod";

export const appSettingSchema = z.object({
  key: z.string(),
  category: z.string(),
  label: z.string(),
  description: z.string().default(""),
  value: z.unknown(),
  updatedAt: z.string()
});

export const appSettingListQuerySchema = z.object({
  category: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(100)
});

export const appSettingUpdateRequestSchema = z.object({
  value: z.unknown()
});

export const appSettingListResponseSchema = z.object({
  items: z.array(appSettingSchema)
});

export type AppSetting = z.infer<typeof appSettingSchema>;
export type AppSettingListQuery = z.infer<typeof appSettingListQuerySchema>;
export type AppSettingUpdateRequest = z.infer<
  typeof appSettingUpdateRequestSchema
>;
export type AppSettingListResponse = z.infer<
  typeof appSettingListResponseSchema
>;
