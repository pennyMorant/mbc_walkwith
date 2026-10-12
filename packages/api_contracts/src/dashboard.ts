import { z } from "zod";

export const dashboardMetricSchema = z.object({
  id: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
  value: z.number().int().nonnegative(),
  tone: z.enum(["primary", "secondary", "warning", "info", "success", "error"]),
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

export const adminDashboardResponseSchema = z.object({
  snapshot: dashboardSnapshotSchema,
  metrics: z.array(dashboardMetricSchema),
  jobs: z.object({
    queued: z.number().int().nonnegative(),
    running: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative()
  }).nullable()
});

export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type AdminDashboardResponse = z.infer<
  typeof adminDashboardResponseSchema
>;
