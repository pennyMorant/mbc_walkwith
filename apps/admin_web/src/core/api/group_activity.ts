import {
  groupAttendanceListResponseSchema,
  groupAttendanceRecordSchema,
  groupAttendanceStatusSchema,
  groupAttendanceUpsertRequestSchema,
  groupMaterialAssignmentCreateRequestSchema,
  groupMaterialAssignmentListResponseSchema,
  groupMaterialAssignmentSchema,
  groupMaterialAssignmentUpdateRequestSchema,
  groupMaterialTypeSchema,
  groupTaskStatusSchema,
  type GroupAttendanceListQuery,
  type GroupAttendanceRecord,
  type GroupAttendanceUpsertRequest,
  type GroupMaterialAssignment,
  type GroupMaterialAssignmentCreateRequest,
  type GroupMaterialAssignmentListQuery,
  type GroupMaterialAssignmentUpdateRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type GroupMaterialFilters = QueryWithSelectAll<
  QueryWithSelectAll<GroupMaterialAssignmentListQuery, "status">,
  "materialType"
>;

export type GroupAttendanceFilters = QueryWithSelectAll<
  GroupAttendanceListQuery,
  "status"
>;

export const groupMaterialTypeOptions = groupMaterialTypeSchema.options;
export const groupTaskStatusOptions = groupTaskStatusSchema.options;
export const groupAttendanceStatusOptions = groupAttendanceStatusSchema.options;

export async function listGroupMaterials(
  groupId: string,
  filters: GroupMaterialFilters = {}
): Promise<GroupMaterialAssignment[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "status", filters.status);
  appendParam(params, "materialType", filters.materialType);
  return (
    await apiClient.getData(
      `/admin/groups/${pathSegment(groupId)}/materials?${params.toString()}`,
      groupMaterialAssignmentListResponseSchema
    )
  ).items;
}

export async function createGroupMaterial(
  groupId: string,
  input: GroupMaterialAssignmentCreateRequest
): Promise<GroupMaterialAssignment> {
  const payload = groupMaterialAssignmentCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/groups/${pathSegment(groupId)}/materials`,
    payload,
    groupMaterialAssignmentSchema
  );
}

export async function updateGroupMaterial(
  groupId: string,
  assignmentId: string,
  input: GroupMaterialAssignmentUpdateRequest
): Promise<GroupMaterialAssignment> {
  const payload = groupMaterialAssignmentUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/groups/${pathSegment(groupId)}/materials/${pathSegment(assignmentId)}`,
    payload,
    groupMaterialAssignmentSchema
  );
}

export async function listGroupAttendance(
  groupId: string,
  filters: GroupAttendanceFilters = {}
): Promise<GroupAttendanceRecord[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "from", filters.from);
  appendParam(params, "to", filters.to);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/groups/${pathSegment(groupId)}/attendance?${params.toString()}`,
      groupAttendanceListResponseSchema
    )
  ).items;
}

export async function upsertGroupAttendance(
  groupId: string,
  input: GroupAttendanceUpsertRequest
): Promise<GroupAttendanceRecord> {
  const payload = groupAttendanceUpsertRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/groups/${pathSegment(groupId)}/attendance`,
    payload,
    groupAttendanceRecordSchema
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
