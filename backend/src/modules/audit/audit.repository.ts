import type { AuditLog, AuditLogListQuery } from "@mbc/api-contracts";

export type AuditLogInput = {
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export type AuditLogPage = {
  logs: AuditLog[];
  nextCursor: string | null;
};

export interface AuditRepository {
  record(input: AuditLogInput): Promise<void>;
  list(query: AuditLogListQuery): Promise<AuditLogPage>;
  listAiRecords(): Promise<AuditLog[]>;
}
