import {
  newcomerFollowUpCreateRequestSchema,
  newcomerFollowUpListResponseSchema,
  newcomerFollowUpSchema,
  newcomerProfileListResponseSchema,
  newcomerProfileSchema,
  newcomerUpdateRequestSchema,
  type NewcomerFollowUp,
  type NewcomerFollowUpCreateRequest,
  type NewcomerListQuery,
  type NewcomerProfile,
  type NewcomerStatus,
  type NewcomerUpdateRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type NewcomerFilters = QueryWithSelectAll<
  NewcomerListQuery,
  "status"
>;

export async function listNewcomers(
  filters: NewcomerFilters = {}
): Promise<NewcomerProfile[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "assigneeAdminUserId", filters.assigneeAdminUserId);
  return (
    await apiClient.getData(
      `/admin/newcomers?${params.toString()}`,
      newcomerProfileListResponseSchema
    )
  ).items;
}

export async function getNewcomer(
  newcomerId: string
): Promise<NewcomerProfile> {
  return apiClient.getData(
    `/admin/newcomers/${pathSegment(newcomerId)}`,
    newcomerProfileSchema
  );
}

export async function updateNewcomer(
  newcomerId: string,
  input: NewcomerUpdateRequest
): Promise<NewcomerProfile> {
  const payload = newcomerUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/newcomers/${pathSegment(newcomerId)}`,
    payload,
    newcomerProfileSchema
  );
}

export async function listNewcomerFollowUps(
  newcomerId: string
): Promise<NewcomerFollowUp[]> {
  return (
    await apiClient.getData(
      `/admin/newcomers/${pathSegment(newcomerId)}/follow-ups`,
      newcomerFollowUpListResponseSchema
    )
  ).items;
}

export async function createNewcomerFollowUp(
  newcomerId: string,
  input: NewcomerFollowUpCreateRequest
): Promise<NewcomerFollowUp> {
  const payload = newcomerFollowUpCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/newcomers/${pathSegment(newcomerId)}/follow-ups`,
    payload,
    newcomerFollowUpSchema
  );
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value:
    | string
    | NewcomerStatus
    | null
    | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
