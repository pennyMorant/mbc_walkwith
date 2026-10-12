import {
  auditLogListResponseSchema,
  type AuditLog,
  type AuditLogListQuery
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export type AuditLogFilters = Partial<AuditLogListQuery>;

export async function listAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "actorUserId", filters.actorUserId);
  appendParam(params, "action", filters.action);
  appendParam(params, "resourceType", filters.resourceType);
  appendParam(params, "resourceId", filters.resourceId);
  return (
    await apiClient.getData(
      `/admin/audit-logs?${params.toString()}`,
      auditLogListResponseSchema
    )
  ).items;
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
