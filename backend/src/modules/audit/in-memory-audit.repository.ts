import type { AuditLog, AuditLogListQuery } from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import {
  decodeAuditCursor,
  encodeAuditCursor,
  isAuditLogAfterCursor
} from "./audit_cursor.js";
import type {
  AuditLogInput,
  AuditLogPage,
  AuditRepository
} from "./audit.repository.js";

export class InMemoryAuditRepository implements AuditRepository {
  readonly logs: AuditLog[] = [];

  async record(input: AuditLogInput): Promise<void> {
    this.logs.push({
      id: randomUUID(),
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      createdAt: new Date().toISOString()
    });
  }

  async list(query: AuditLogListQuery): Promise<AuditLogPage> {
    const cursor = query.cursor ? decodeAuditCursor(query.cursor) : null;
    const matchingLogs = this.logs
      .filter((log) => {
        if (query.actorUserId && log.actorUserId !== query.actorUserId) {
          return false;
        }
        if (
          query.action &&
          !log.action.toLowerCase().includes(query.action.toLowerCase())
        ) {
          return false;
        }
        if (query.resourceType && log.resourceType !== query.resourceType) {
          return false;
        }
        if (query.resourceId && log.resourceId !== query.resourceId) {
          return false;
        }
        return cursor === null || isAuditLogAfterCursor(log, cursor);
      })
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
      )
      .slice(0, query.limit + 1);
    const logs = matchingLogs.slice(0, query.limit);
    const lastLog = logs.at(-1);
    return {
      logs,
      nextCursor:
        matchingLogs.length > query.limit && lastLog
          ? encodeAuditCursor(lastLog)
          : null
    };
  }

  async listAiRecords(): Promise<AuditLog[]> {
    return this.logs
      .filter((log) => log.action.startsWith("ai."))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
