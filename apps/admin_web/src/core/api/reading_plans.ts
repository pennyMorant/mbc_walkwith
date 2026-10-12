import {
  readingPlanAssignmentCreateRequestSchema,
  readingPlanAssignmentListResponseSchema,
  readingPlanAssignmentSchema,
  readingPlanAssignmentStatusSchema,
  readingPlanAssignmentSourceTypeSchema,
  readingPlanDayListResponseSchema,
  readingPlanDaySchema,
  readingPlanDayUpsertRequestSchema,
  readingPlanListResponseSchema,
  readingPlanSchema,
  readingPlanStatusSchema,
  readingPlanUpdateRequestSchema,
  readingPlanVisibilitySchema,
  readingPlanCreateRequestSchema,
  type ReadingPlan,
  type ReadingPlanAssignment,
  type ReadingPlanAssignmentCreateRequest,
  type ReadingPlanAssignmentListQuery,
  type ReadingPlanAssignmentSourceType,
  type ReadingPlanAssignmentStatus,
  type ReadingPlanCreateRequest,
  type ReadingPlanDay,
  type ReadingPlanDayUpsertRequest,
  type ReadingPlanListQuery,
  type ReadingPlanStatus,
  type ReadingPlanUpdateRequest,
  type ReadingPlanUserType,
  type ReadingPlanVisibility
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type ReadingPlanListFilters = QueryWithSelectAll<
  QueryWithSelectAll<ReadingPlanListQuery, "status">,
  "visibility"
>;

export type ReadingPlanAssignmentFilters = QueryWithSelectAll<
  QueryWithSelectAll<ReadingPlanAssignmentListQuery, "status">,
  "userType"
>;

export async function listReadingPlans(
  filters: ReadingPlanListFilters = {}
): Promise<ReadingPlan[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "visibility", filters.visibility);
  appendParam(params, "locale", filters.locale);
  return (
    await apiClient.getData(
      `/admin/reading-plans?${params.toString()}`,
      readingPlanListResponseSchema
    )
  ).items;
}

export async function createReadingPlan(
  input: ReadingPlanCreateRequest
): Promise<ReadingPlan> {
  const payload = readingPlanCreateRequestSchema.parse(input);
  return apiClient.postData("/admin/reading-plans", payload, readingPlanSchema);
}

export async function updateReadingPlan(
  planId: string,
  input: ReadingPlanUpdateRequest
): Promise<ReadingPlan> {
  const payload = readingPlanUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/reading-plans/${pathSegment(planId)}`,
    payload,
    readingPlanSchema
  );
}

export async function listReadingPlanDays(
  planId: string
): Promise<ReadingPlanDay[]> {
  return (
    await apiClient.getData(
      `/admin/reading-plans/${pathSegment(planId)}/days`,
      readingPlanDayListResponseSchema
    )
  ).items;
}

export async function upsertReadingPlanDay(
  planId: string,
  input: ReadingPlanDayUpsertRequest
): Promise<ReadingPlanDay> {
  const payload = readingPlanDayUpsertRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/reading-plans/${pathSegment(planId)}/days`,
    payload,
    readingPlanDaySchema
  );
}

export async function listReadingPlanAssignments(
  filters: ReadingPlanAssignmentFilters = {}
): Promise<ReadingPlanAssignment[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "planId", filters.planId);
  appendParam(params, "status", filters.status);
  appendParam(params, "userType", filters.userType);
  appendParam(params, "userId", filters.userId);
  return (
    await apiClient.getData(
      `/admin/reading-plans/assignments?${params.toString()}`,
      readingPlanAssignmentListResponseSchema
    )
  ).items;
}

export async function createReadingPlanAssignment(
  input: ReadingPlanAssignmentCreateRequest
): Promise<ReadingPlanAssignment> {
  const payload = readingPlanAssignmentCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/reading-plans/assignments",
    payload,
    readingPlanAssignmentSchema
  );
}

export const readingPlanStatusOptions: ReadingPlanStatus[] =
  readingPlanStatusSchema.options;

export const readingPlanVisibilityOptions: ReadingPlanVisibility[] =
  readingPlanVisibilitySchema.options;

export const readingPlanAssignmentStatusOptions: ReadingPlanAssignmentStatus[] =
  readingPlanAssignmentStatusSchema.options;

export const readingPlanAssignmentSourceTypeOptions: ReadingPlanAssignmentSourceType[] =
  readingPlanAssignmentSourceTypeSchema.options;

export const readingPlanUserTypeOptions: ReadingPlanUserType[] = [
  "member",
  "external"
];

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
