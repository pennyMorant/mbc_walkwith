import type { AuditLog, AuditLogListQuery } from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { AuditLogInput, AuditRepository } from "./audit.repository.js";

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

  async list(query: AuditLogListQuery): Promise<AuditLog[]> {
    return this.logs
      .map((log, index) => ({ log, index }))
      .filter(({ log }) => {
        if (query.actorUserId && log.actorUserId !== query.actorUserId) {
          return false;
        }
        if (query.action && !log.action.includes(query.action)) {
          return false;
        }
        if (query.resourceType && log.resourceType !== query.resourceType) {
          return false;
        }
        if (query.resourceId && log.resourceId !== query.resourceId) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          b.log.createdAt.localeCompare(a.log.createdAt) || b.index - a.index
      )
      .map(({ log }) => log)
      .slice(0, query.limit);
  }

  async listAiRecords(): Promise<AuditLog[]> {
    return this.logs
      .filter((log) => log.action.startsWith("ai."))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
