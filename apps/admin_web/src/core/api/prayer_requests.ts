import {
  adminPrayerRequestApproveRequestSchema,
  adminPrayerRequestListResponseSchema,
  adminPrayerRequestSchema,
  adminPrayerRequestUpdateRequestSchema,
  deletedResponseSchema,
  type AdminPrayerRequest,
  type AdminPrayerRequestApproveRequest,
  type AdminPrayerRequestListQuery,
  type AdminPrayerRequestUpdateRequest,
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type PrayerRequestListFilters = QueryWithSelectAll<
  QueryWithSelectAll<AdminPrayerRequestListQuery, "status">,
  "visibility"
>;

export async function listPrayerRequests(
  filters: PrayerRequestListFilters = {}
): Promise<AdminPrayerRequest[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "visibility", filters.visibility);
  appendParam(params, "groupId", filters.groupId);
  return (
    await apiClient.getData(
      `/admin/prayer-requests?${params.toString()}`,
      adminPrayerRequestListResponseSchema
    )
  ).items;
}

export async function updatePrayerRequest(
  requestId: string,
  input: AdminPrayerRequestUpdateRequest
): Promise<AdminPrayerRequest> {
  const payload = adminPrayerRequestUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/prayer-requests/${pathSegment(requestId)}`,
    payload,
    adminPrayerRequestSchema
  );
}

export async function approvePrayerRequest(
  requestId: string,
  input: AdminPrayerRequestApproveRequest = { notifyApp: false }
): Promise<AdminPrayerRequest> {
  const payload = adminPrayerRequestApproveRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/prayer-requests/${pathSegment(requestId)}/approve`,
    payload,
    adminPrayerRequestSchema
  );
}

export async function hidePrayerRequest(
  requestId: string,
  moderationNote: string
): Promise<AdminPrayerRequest> {
  return apiClient.postData(
    `/admin/prayer-requests/${pathSegment(requestId)}/hide`,
    { moderationNote },
    adminPrayerRequestSchema
  );
}

export async function archivePrayerRequest(
  requestId: string
): Promise<AdminPrayerRequest> {
  return apiClient.postData(
    `/admin/prayer-requests/${pathSegment(requestId)}/archive`,
    {},
    adminPrayerRequestSchema
  );
}

export async function deletePrayerRequest(requestId: string): Promise<void> {
  await apiClient.deleteData(
    `/admin/prayer-requests/${pathSegment(requestId)}`,
    deletedResponseSchema
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
