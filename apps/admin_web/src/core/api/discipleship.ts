import {
  discipleshipAssignmentCreateRequestSchema,
  discipleshipAssignmentListResponseSchema,
  discipleshipAssignmentSchema,
  discipleshipAssignmentStatusSchema,
  discipleshipJourneyCreateRequestSchema,
  discipleshipJourneyListResponseSchema,
  discipleshipJourneySchema,
  discipleshipJourneyStatusSchema,
  discipleshipJourneyUpdateRequestSchema,
  discipleshipStageCreateRequestSchema,
  discipleshipStageListResponseSchema,
  discipleshipStageSchema,
  discipleshipTaskCreateRequestSchema,
  discipleshipTaskListResponseSchema,
  discipleshipTaskProgressSchema,
  discipleshipTaskProgressUpdateRequestSchema,
  discipleshipTaskReferenceTypeSchema,
  discipleshipTaskSchema,
  discipleshipTaskStatusSchema,
  type DiscipleshipAssignment,
  type DiscipleshipAssignmentCreateRequest,
  type DiscipleshipAssignmentListQuery,
  type DiscipleshipAssignmentStatus,
  type DiscipleshipJourney,
  type DiscipleshipJourneyCreateRequest,
  type DiscipleshipJourneyListQuery,
  type DiscipleshipJourneyStatus,
  type DiscipleshipJourneyUpdateRequest,
  type DiscipleshipStage,
  type DiscipleshipStageCreateRequest,
  type DiscipleshipTask,
  type DiscipleshipTaskCreateRequest,
  type DiscipleshipTaskProgress,
  type DiscipleshipTaskProgressUpdateRequest,
  type DiscipleshipTaskReferenceType,
  type DiscipleshipTaskStatus
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type DiscipleshipJourneyFilters = QueryWithSelectAll<
  DiscipleshipJourneyListQuery,
  "status"
>;

export type DiscipleshipAssignmentFilters = QueryWithSelectAll<
  DiscipleshipAssignmentListQuery,
  "status"
>;

export async function listDiscipleshipJourneys(
  filters: DiscipleshipJourneyFilters = {}
): Promise<DiscipleshipJourney[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/discipleship/journeys?${params.toString()}`,
      discipleshipJourneyListResponseSchema
    )
  ).items;
}

export async function createDiscipleshipJourney(
  input: DiscipleshipJourneyCreateRequest
): Promise<DiscipleshipJourney> {
  const payload = discipleshipJourneyCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/discipleship/journeys",
    payload,
    discipleshipJourneySchema
  );
}

export async function updateDiscipleshipJourney(
  journeyId: string,
  input: DiscipleshipJourneyUpdateRequest
): Promise<DiscipleshipJourney> {
  const payload = discipleshipJourneyUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/discipleship/journeys/${pathSegment(journeyId)}`,
    payload,
    discipleshipJourneySchema
  );
}

export async function createDiscipleshipStage(
  journeyId: string,
  input: DiscipleshipStageCreateRequest
): Promise<DiscipleshipStage> {
  const payload = discipleshipStageCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/discipleship/journeys/${pathSegment(journeyId)}/stages`,
    payload,
    discipleshipStageSchema
  );
}

export async function listDiscipleshipStages(
  journeyId: string
): Promise<DiscipleshipStage[]> {
  return (
    await apiClient.getData(
      `/admin/discipleship/journeys/${pathSegment(journeyId)}/stages`,
      discipleshipStageListResponseSchema
    )
  ).items;
}

export async function createDiscipleshipTask(
  journeyId: string,
  input: DiscipleshipTaskCreateRequest
): Promise<DiscipleshipTask> {
  const payload = discipleshipTaskCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/discipleship/journeys/${pathSegment(journeyId)}/tasks`,
    payload,
    discipleshipTaskSchema
  );
}

export async function listDiscipleshipTasks(
  journeyId: string
): Promise<DiscipleshipTask[]> {
  return (
    await apiClient.getData(
      `/admin/discipleship/journeys/${pathSegment(journeyId)}/tasks`,
      discipleshipTaskListResponseSchema
    )
  ).items;
}

export async function listDiscipleshipAssignments(
  filters: DiscipleshipAssignmentFilters = {}
): Promise<DiscipleshipAssignment[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "status", filters.status);
  appendParam(params, "userId", filters.userId);
  appendParam(params, "journeyId", filters.journeyId);
  return (
    await apiClient.getData(
      `/admin/discipleship/assignments?${params.toString()}`,
      discipleshipAssignmentListResponseSchema
    )
  ).items;
}

export async function createDiscipleshipAssignment(
  input: DiscipleshipAssignmentCreateRequest
): Promise<DiscipleshipAssignment> {
  const payload = discipleshipAssignmentCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/discipleship/assignments",
    payload,
    discipleshipAssignmentSchema
  );
}

export async function updateDiscipleshipTaskProgress(
  assignmentId: string,
  taskId: string,
  input: DiscipleshipTaskProgressUpdateRequest
): Promise<DiscipleshipTaskProgress> {
  const payload = discipleshipTaskProgressUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/discipleship/assignments/${pathSegment(assignmentId)}/tasks/${pathSegment(taskId)}`,
    payload,
    discipleshipTaskProgressSchema
  );
}

export const discipleshipJourneyStatusOptions: DiscipleshipJourneyStatus[] =
  discipleshipJourneyStatusSchema.options;

export const discipleshipAssignmentStatusOptions: DiscipleshipAssignmentStatus[] =
  discipleshipAssignmentStatusSchema.options;

export const discipleshipTaskStatusOptions: DiscipleshipTaskStatus[] =
  discipleshipTaskStatusSchema.options;

export const discipleshipTaskReferenceTypeOptions: DiscipleshipTaskReferenceType[] =
  discipleshipTaskReferenceTypeSchema.options;

export const discipleshipAssignmentSourceTypeOptions: Array<
  DiscipleshipAssignment["sourceType"]
> = ["member", "newcomer"];

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
