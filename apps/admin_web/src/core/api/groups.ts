import {
  groupApplicationListResponseSchema,
  groupApplicationSchema,
  groupApplicationReviewRequestSchema,
  groupMembershipListResponseSchema,
  groupMembershipSchema,
  groupMembershipStatusSchema,
  groupMembershipUpdateRequestSchema,
  ministryGroupListResponseSchema,
  ministryGroupSchema,
  ministryGroupUpdateRequestSchema,
  ministryGroupUpsertRequestSchema,
  type GroupApplication,
  type GroupApplicationListQuery,
  type GroupApplicationReviewRequest,
  type GroupMembership,
  type GroupMembershipListQuery,
  type GroupMembershipUpdateRequest,
  type MinistryGroup,
  type MinistryGroupListQuery,
  type MinistryGroupStatus,
  type MinistryGroupUpdateRequest,
  type MinistryGroupUpsertRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type GroupListFilters = QueryWithSelectAll<
  QueryWithSelectAll<MinistryGroupListQuery, "status">,
  "visibility"
>;

export type GroupApplicationFilters = QueryWithSelectAll<
  GroupApplicationListQuery,
  "status"
>;

export type GroupMembershipFilters = QueryWithSelectAll<
  GroupMembershipListQuery,
  "status"
>;

export const groupMembershipStatusOptions =
  groupMembershipStatusSchema.options;

export async function listGroups(
  filters: GroupListFilters = {}
): Promise<MinistryGroup[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "visibility", filters.visibility);
  return (
    await apiClient.getData(
      `/admin/groups?${params.toString()}`,
      ministryGroupListResponseSchema
    )
  ).items;
}

export async function createGroup(
  input: MinistryGroupUpsertRequest
): Promise<MinistryGroup> {
  const payload = ministryGroupUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/groups", payload, ministryGroupSchema);
}

export async function updateGroup(
  groupId: string,
  input: MinistryGroupUpdateRequest
): Promise<MinistryGroup> {
  const payload = ministryGroupUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/groups/${pathSegment(groupId)}`,
    payload,
    ministryGroupSchema
  );
}

export async function listGroupApplications(
  groupId: string,
  filters: GroupApplicationFilters = {}
): Promise<GroupApplication[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/groups/${pathSegment(groupId)}/applications?${params.toString()}`,
      groupApplicationListResponseSchema
    )
  ).items;
}

export async function reviewGroupApplication(
  groupId: string,
  applicationId: string,
  input: GroupApplicationReviewRequest
): Promise<GroupApplication> {
  const payload = groupApplicationReviewRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/groups/${pathSegment(groupId)}/applications/${pathSegment(applicationId)}`,
    payload,
    groupApplicationSchema
  );
}

export async function listGroupMemberships(
  groupId: string,
  filters: GroupMembershipFilters = {}
): Promise<GroupMembership[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/groups/${pathSegment(groupId)}/memberships?${params.toString()}`,
      groupMembershipListResponseSchema
    )
  ).items;
}

export async function updateGroupMembership(
  groupId: string,
  userId: string,
  input: GroupMembershipUpdateRequest
): Promise<GroupMembership> {
  const payload = groupMembershipUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/groups/${pathSegment(groupId)}/memberships/${pathSegment(userId)}`,
    payload,
    groupMembershipSchema
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
