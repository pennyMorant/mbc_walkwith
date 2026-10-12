import {
  servingAdminAssignmentCreateRequestSchema,
  servingAdminAssignmentUpdateRequestSchema,
  servingAdminAvailabilityCreateRequestSchema,
  servingAssignmentListResponseSchema,
  servingAssignmentSchema,
  servingAvailabilityListResponseSchema,
  servingAvailabilityRecordSchema,
  servingCheckInListResponseSchema,
  servingCheckInRecordSchema,
  servingCheckInUpsertRequestSchema,
  servingMemberListResponseSchema,
  servingRoleListResponseSchema,
  servingRoleSchema,
  servingRoleUpdateRequestSchema,
  servingRoleUpsertRequestSchema,
  servingTeamListResponseSchema,
  servingTeamSchema,
  servingTeamUpdateRequestSchema,
  servingTeamUpsertRequestSchema,
  type MemberListQuery,
  type ServingAdminAssignmentCreateRequest,
  type ServingAdminAssignmentUpdateRequest,
  type ServingAdminAvailabilityCreateRequest,
  type ServingAssignment,
  type ServingAssignmentListQuery,
  type ServingAvailabilityListQuery,
  type ServingAvailabilityRecord,
  type ServingCheckInListQuery,
  type ServingCheckInRecord,
  type ServingCheckInUpsertRequest,
  type ServingMemberOption,
  type ServingRole,
  type ServingRoleUpdateRequest,
  type ServingRoleUpsertRequest,
  type ServingListQuery,
  type ServingStatus,
  type ServingTeam,
  type ServingTeamUpdateRequest,
  type ServingTeamUpsertRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type ServingFilters = QueryWithSelectAll<ServingListQuery, "status">;

export type ServingRoleFilters = ServingFilters & {
  teamId?: string;
};

export type ServingAssignmentFilters = QueryWithSelectAll<
  ServingAssignmentListQuery,
  "status"
>;

export type ServingMemberFilters = QueryWithSelectAll<
  MemberListQuery,
  "status"
>;

export type ServingAvailabilityFilters = QueryWithSelectAll<
  ServingAvailabilityListQuery,
  "status"
>;

export type ServingCheckInFilters = QueryWithSelectAll<
  ServingCheckInListQuery,
  "status"
>;

export async function listServingMembers(
  filters: ServingMemberFilters = {}
): Promise<ServingMemberOption[]> {
  const params = buildParams(filters, 100);
  return (
    await apiClient.getData(
      `/admin/serving/members?${params.toString()}`,
      servingMemberListResponseSchema
    )
  ).items;
}

export async function listServingTeams(
  filters: ServingFilters = {}
): Promise<ServingTeam[]> {
  const params = buildParams(filters, 100);
  return (
    await apiClient.getData(
      `/admin/serving/teams?${params.toString()}`,
      servingTeamListResponseSchema
    )
  ).items;
}

export async function createServingTeam(
  input: ServingTeamUpsertRequest
): Promise<ServingTeam> {
  const payload = servingTeamUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/serving/teams", payload, servingTeamSchema);
}

export async function updateServingTeam(
  teamId: string,
  input: ServingTeamUpdateRequest
): Promise<ServingTeam> {
  const payload = servingTeamUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/serving/teams/${pathSegment(teamId)}`,
    payload,
    servingTeamSchema
  );
}

export async function listServingRoles(
  filters: ServingRoleFilters = {}
): Promise<ServingRole[]> {
  const params = buildParams(filters, 100);
  appendParam(params, "teamId", filters.teamId);
  return (
    await apiClient.getData(
      `/admin/serving/roles?${params.toString()}`,
      servingRoleListResponseSchema
    )
  ).items;
}

export async function createServingRole(
  input: ServingRoleUpsertRequest
): Promise<ServingRole> {
  const payload = servingRoleUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/serving/roles", payload, servingRoleSchema);
}

export async function updateServingRole(
  roleId: string,
  input: ServingRoleUpdateRequest
): Promise<ServingRole> {
  const payload = servingRoleUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/serving/roles/${pathSegment(roleId)}`,
    payload,
    servingRoleSchema
  );
}

export async function listServingAssignments(
  filters: ServingAssignmentFilters = {}
): Promise<ServingAssignment[]> {
  const params = buildParams(filters, 100);
  appendParam(params, "userId", filters.userId);
  return (
    await apiClient.getData(
      `/admin/serving/assignments?${params.toString()}`,
      servingAssignmentListResponseSchema
    )
  ).items;
}

export async function createServingAssignment(
  input: ServingAdminAssignmentCreateRequest
): Promise<ServingAssignment> {
  const payload = servingAdminAssignmentCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/serving/assignments",
    payload,
    servingAssignmentSchema
  );
}

export async function updateServingAssignment(
  assignmentId: string,
  input: ServingAdminAssignmentUpdateRequest
): Promise<ServingAssignment> {
  const payload = servingAdminAssignmentUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/serving/assignments/${pathSegment(assignmentId)}`,
    payload,
    servingAssignmentSchema
  );
}

export async function listServingAvailability(
  filters: ServingAvailabilityFilters = {}
): Promise<ServingAvailabilityRecord[]> {
  const params = buildParams(filters, 100);
  appendParam(params, "userId", filters.userId);
  appendParam(params, "from", filters.from);
  appendParam(params, "to", filters.to);
  return (
    await apiClient.getData(
      `/admin/serving/availability?${params.toString()}`,
      servingAvailabilityListResponseSchema
    )
  ).items;
}

export async function createServingAvailability(
  input: ServingAdminAvailabilityCreateRequest
): Promise<ServingAvailabilityRecord> {
  const payload = servingAdminAvailabilityCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/serving/availability",
    payload,
    servingAvailabilityRecordSchema
  );
}

export async function listServingCheckIns(
  filters: ServingCheckInFilters = {}
): Promise<ServingCheckInRecord[]> {
  const params = buildParams(filters, 100);
  appendParam(params, "assignmentId", filters.assignmentId);
  appendParam(params, "userId", filters.userId);
  return (
    await apiClient.getData(
      `/admin/serving/check-ins?${params.toString()}`,
      servingCheckInListResponseSchema
    )
  ).items;
}

export async function updateServingCheckIn(
  assignmentId: string,
  input: ServingCheckInUpsertRequest
): Promise<ServingCheckInRecord> {
  const payload = servingCheckInUpsertRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/serving/assignments/${pathSegment(assignmentId)}/check-in`,
    payload,
    servingCheckInRecordSchema
  );
}

function buildParams(
  filters: {
    query?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
  },
  defaultLimit: number
) {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? defaultLimit));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  return params;
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
