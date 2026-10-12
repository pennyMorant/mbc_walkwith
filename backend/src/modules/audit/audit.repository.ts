import type { AuditLog, AuditLogListQuery } from "@mbc/api-contracts";

export type AuditLogInput = {
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
};

export interface AuditRepository {
  record(input: AuditLogInput): Promise<void>;
  list(query: AuditLogListQuery): Promise<AuditLog[]>;
  listAiRecords(): Promise<AuditLog[]>;
}
