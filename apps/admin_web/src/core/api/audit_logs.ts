import {
  auditLogListResponseSchema,
  type AuditLogListQuery,
  type AuditLogListResponse
} from "@mbc/api-contracts";

import type { QueryWithNullableString } from "./filter_types";
import { apiClient } from "./client";

export type AuditLogFilters = QueryWithNullableString<
  Partial<AuditLogListQuery>,
  "cursor"
>;

export async function listAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "actorUserId", filters.actorUserId);
  appendParam(params, "action", filters.action);
  appendParam(params, "resourceType", filters.resourceType);
  appendParam(params, "resourceId", filters.resourceId);
  appendParam(params, "cursor", filters.cursor);
  return apiClient.getData(
    `/admin/audit-logs?${params.toString()}`,
    auditLogListResponseSchema
  );
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
