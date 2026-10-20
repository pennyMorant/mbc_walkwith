import { z } from "zod";

export const adminSearchQuerySchema = z.object({
  query: z.string().trim().min(2).max(120)
});

export const adminSearchResultSchema = z.object({
  id: z.string().trim().min(1),
  resourceType: z.enum(["sermon", "life_post", "member"]),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1).nullable().default(null),
  path: z.string().trim().startsWith("/")
});

export const adminSearchResponseSchema = z.object({
  items: z.array(adminSearchResultSchema).max(15)
});

export type AdminSearchQuery = z.infer<typeof adminSearchQuerySchema>;
export type AdminSearchResult = z.infer<typeof adminSearchResultSchema>;
export type AdminSearchResponse = z.infer<typeof adminSearchResponseSchema>;
