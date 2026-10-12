import type { AuditLog, AuditLogListQuery } from "@mbc/api-contracts";
import { and, desc, eq, ilike } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { auditLogs } from "../../shared/db/schema.js";
import type { AuditLogInput, AuditRepository } from "./audit.repository.js";

export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly db: AppDb) {}

  async record(input: AuditLogInput): Promise<void> {
    await this.db.insert(auditLogs).values({
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson
    });
  }

  async list(query: AuditLogListQuery): Promise<AuditLog[]> {
    const filters = [
      query.actorUserId ? eq(auditLogs.actorUserId, query.actorUserId) : undefined,
      query.action ? ilike(auditLogs.action, `%${query.action}%`) : undefined,
      query.resourceType
        ? eq(auditLogs.resourceType, query.resourceType)
        : undefined,
      query.resourceId ? eq(auditLogs.resourceId, query.resourceId) : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(query.limit);
    return rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      beforeJson: row.beforeJson ?? null,
      afterJson: row.afterJson ?? null,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async listAiRecords(): Promise<AuditLog[]> {
    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(ilike(auditLogs.action, "ai.%"))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id));
    return rows.map((row) => ({ id: row.id, actorUserId: row.actorUserId, action: row.action, resourceType: row.resourceType, resourceId: row.resourceId, beforeJson: row.beforeJson ?? null, afterJson: row.afterJson ?? null, createdAt: row.createdAt.toISOString() }));
  }
}
