import {
  careFollowUpCreateRequestSchema,
  careFollowUpListResponseSchema,
  careFollowUpSchema,
  careAssigneeListResponseSchema,
  careRequestAdminListResponseSchema,
  careRequestAdminSchema,
  careRequestUpdateRequestSchema,
  type CareFollowUp,
  type CareAssignee,
  type CareFollowUpCreateRequest,
  type CareRequestListQuery,
  type CarePrivacyLevel,
  type CareRequestAdmin,
  type CareRequestStatus,
  type CareRequestUpdateRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type CareRequestFilters = QueryWithSelectAll<
  CareRequestListQuery,
  "status"
>;

export async function listCareAssignees(): Promise<CareAssignee[]> {
  return (
    await apiClient.getData(
      "/admin/care-assignees",
      careAssigneeListResponseSchema
    )
  ).items;
}

export async function listCareRequests(
  filters: CareRequestFilters = {}
): Promise<CareRequestAdmin[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "userId", filters.userId);
  return (
    await apiClient.getData(
      `/admin/care-requests?${params.toString()}`,
      careRequestAdminListResponseSchema
    )
  ).items;
}

export async function updateCareRequest(
  careRequestId: string,
  input: CareRequestUpdateRequest
): Promise<CareRequestAdmin> {
  const payload = careRequestUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/care-requests/${pathSegment(careRequestId)}`,
    payload,
    careRequestAdminSchema
  );
}

export async function listCareFollowUps(
  careRequestId: string
): Promise<CareFollowUp[]> {
  return (
    await apiClient.getData(
      `/admin/care-requests/${pathSegment(careRequestId)}/follow-ups`,
      careFollowUpListResponseSchema
    )
  ).items;
}

export async function createCareFollowUp(
  careRequestId: string,
  input: CareFollowUpCreateRequest
): Promise<CareFollowUp> {
  const payload = careFollowUpCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/care-requests/${pathSegment(careRequestId)}/follow-ups`,
    payload,
    careFollowUpSchema
  );
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | CareRequestStatus | CarePrivacyLevel | null | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
