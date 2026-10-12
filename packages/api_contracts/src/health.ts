import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  data: z.object({
    mode: z.enum(["mock", "postgres"]),
    databaseConfigured: z.boolean()
  }),
  timestamp: z.string()
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
