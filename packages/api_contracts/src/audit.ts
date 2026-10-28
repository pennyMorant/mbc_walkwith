import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable().default(null),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  beforeJson: z.unknown().nullable().default(null),
  afterJson: z.unknown().nullable().default(null),
  createdAt: z.string()
});

export const auditLogListQuerySchema = z.object({
  actorUserId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  cursor: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z~[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    .optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogSchema),
  nextCursor: z.string().nullable().default(null)
});

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
export type AuditLogListResponse = z.infer<
  typeof auditLogListResponseSchema
>;
