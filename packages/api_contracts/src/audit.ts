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
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogSchema)
});

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
export type AuditLogListResponse = z.infer<
  typeof auditLogListResponseSchema
>;
