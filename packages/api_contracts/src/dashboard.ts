import { z } from "zod";
import { contentLocaleSchema } from "./content_localization.js";

export const dashboardToneSchema = z.enum([
  "primary",
  "secondary",
  "warning",
  "info",
  "success",
  "error"
]);

export const dashboardMetricSchema = z.object({
  id: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
  value: z.number().int().nonnegative(),
  tone: dashboardToneSchema,
  format: z.enum(["count", "currency"]).default("count"),
  currency: z.string().trim().length(3).nullable().default(null),
  path: z.string().trim().startsWith("/").nullable().default(null)
});

export const dashboardSnapshotSchema = z.object({
  status: z.enum(["fresh", "stale"]),
  generatedAt: z.string().datetime(),
  attemptedAt: z.string().datetime(),
  errorCode: z.string().trim().min(1).nullable().default(null)
});

export const dashboardActionItemSchema = z.object({
  id: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
  summaryKey: z.string().trim().min(1),
  count: z.number().int().nonnegative(),
  tone: dashboardToneSchema,
  path: z.string().trim().startsWith("/")
});

export const dashboardRecentContentSchema = z.object({
  id: z.string().trim().min(1),
  resourceType: z.enum(["sermon", "life_post"]),
  title: z.string().trim().min(1),
  status: z.string().trim().min(1),
  sourceLocale: contentLocaleSchema,
  updatedAt: z.string().datetime(),
  path: z.string().trim().startsWith("/")
});

export const dashboardHealthItemSchema = z.object({
  id: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
  status: z.enum(["healthy", "warning", "error"]),
  value: z.number().int().nonnegative(),
  path: z.string().trim().startsWith("/").nullable().default(null)
});

export const adminDashboardResponseSchema = z.object({
  snapshot: dashboardSnapshotSchema,
  metrics: z.array(dashboardMetricSchema),
  actionItems: z.array(dashboardActionItemSchema),
  recentContent: z.array(dashboardRecentContentSchema),
  health: z.array(dashboardHealthItemSchema),
  jobs: z.object({
    queued: z.number().int().nonnegative(),
    running: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative()
  }).nullable()
});

export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type DashboardActionItem = z.infer<typeof dashboardActionItemSchema>;
export type DashboardRecentContent = z.infer<typeof dashboardRecentContentSchema>;
export type DashboardHealthItem = z.infer<typeof dashboardHealthItemSchema>;
export type AdminDashboardResponse = z.infer<
  typeof adminDashboardResponseSchema
>;
