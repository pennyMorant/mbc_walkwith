import {
  memberCreateRequestSchema,
  memberListResponseSchema,
  memberProfileSchema,
  memberUpdateRequestSchema,
  type MemberCreateRequest,
  type MemberListItem,
  type MemberListQuery,
  type MemberProfile,
  type MemberUpdateRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type MemberListFilters = QueryWithSelectAll<
  MemberListQuery,
  "status"
>;

export async function listMembers(
  filters: MemberListFilters = {}
): Promise<MemberListItem[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "fellowshipGroupId", filters.fellowshipGroupId);
  return (
    await apiClient.getData(
      `/admin/members?${params.toString()}`,
      memberListResponseSchema
    )
  ).items;
}

export async function getMember(memberId: string): Promise<MemberProfile> {
  return apiClient.getData(
    `/admin/members/${pathSegment(memberId)}`,
    memberProfileSchema
  );
}

export async function createMember(
  input: MemberCreateRequest
): Promise<MemberProfile> {
  const payload = memberCreateRequestSchema.parse(input);
  return apiClient.postData("/admin/members", payload, memberProfileSchema);
}

export async function updateMember(
  memberId: string,
  input: MemberUpdateRequest
): Promise<MemberProfile> {
  const payload = memberUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/members/${pathSegment(memberId)}`,
    payload,
    memberProfileSchema
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
