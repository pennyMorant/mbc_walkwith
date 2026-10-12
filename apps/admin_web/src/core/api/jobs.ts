import {
  jobStatsResponseSchema,
  jobListResponseSchema,
  jobSchema,
  sermonProductionPipelineStatusResponseSchema,
  updateJobStatusRequestSchema,
  type Job,
  type JobListQuery,
  type JobStatus,
  type JobStatsResponse,
  type JobType,
  type SermonProductionPipelineStatusResponse,
  type UpdateJobStatusRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type {
  QueryWithNullableString,
  QueryWithSelectAll
} from "./filter_types";
import { pathSegment } from "./path_segments";

export type JobListFilters = QueryWithNullableString<
  QueryWithSelectAll<QueryWithSelectAll<JobListQuery, "status">, "type">,
  "cursor"
>;

export async function listJobs(
  filters: JobListFilters = {}
): Promise<{ items: Job[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "status", filters.status);
  appendParam(params, "type", filters.type);
  appendParam(params, "resourceType", filters.resourceType);
  appendParam(params, "resourceId", filters.resourceId);
  appendParam(params, "cursor", filters.cursor ?? undefined);
  return apiClient.getData(`/admin/jobs?${params}`, jobListResponseSchema);
}

export async function getJobStats(): Promise<JobStatsResponse> {
  return apiClient.getData("/admin/jobs/stats", jobStatsResponseSchema);
}

export async function getSermonProductionPipelineStatus(): Promise<SermonProductionPipelineStatusResponse> {
  return apiClient.getData(
    "/admin/jobs/sermon-pipeline-status",
    sermonProductionPipelineStatusResponseSchema
  );
}

export async function getJob(jobId: string): Promise<Job> {
  return apiClient.getData(`/admin/jobs/${pathSegment(jobId)}`, jobSchema);
}

export async function updateJobStatus(
  jobId: string,
  input: UpdateJobStatusRequest
): Promise<Job> {
  const payload = updateJobStatusRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/jobs/${pathSegment(jobId)}/status`,
    payload,
    jobSchema
  );
}

export async function cancelJob(jobId: string): Promise<Job> {
  return apiClient.postData(
    `/admin/jobs/${pathSegment(jobId)}/cancel`,
    {},
    jobSchema
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
