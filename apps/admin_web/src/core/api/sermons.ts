import {
  createLocalSermonDraftRequestSchema,
  deletedResponseSchema,
  localSermonPackageRequestSchema,
  sermonAudioCleanupListResponseSchema,
  sermonAudioCleanupTaskSchema,
  sermonDiscoveryFacetsSchema,
  sermonListResponseSchema,
  sermonRevisionSchema,
  sermonSchema,
  updateSermonRequestSchema,
  type CreateLocalSermonDraftRequest,
  type LocalSermonPackageRequest,
  type Sermon,
  type SermonAudioCleanupListQuery,
  type SermonAudioCleanupTask,
  type SermonDiscoveryFacets,
  type SermonListResponse,
  type SermonListQuery,
  type UpdateSermonRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type {
  QueryWithNullableString,
  QueryWithSelectAll
} from "./filter_types";
import { pathSegment } from "./path_segments";

export type AdminSermonListFilters = QueryWithNullableString<
  QueryWithSelectAll<SermonListQuery, "status">,
  "cursor"
>;

export type AdminSermonAudioCleanupFilters = QueryWithSelectAll<
  SermonAudioCleanupListQuery,
  "status"
>;

export async function listAdminSermons(
  filters: AdminSermonListFilters = {}
): Promise<SermonListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 20));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "speaker", filters.speaker);
  appendParam(params, "series", filters.series);
  appendParam(params, "topic", filters.topic);
  appendParam(params, "cursor", filters.cursor ?? undefined);

  return apiClient.getData(
    `/admin/sermons?${params.toString()}`,
    sermonListResponseSchema
  );
}

export async function getSermonDiscoveryFacets(): Promise<SermonDiscoveryFacets> {
  return apiClient.getData(
    "/sermons/facets",
    sermonDiscoveryFacetsSchema
  );
}

export async function getAdminSermon(sermonId: string): Promise<Sermon> {
  return apiClient.getData(
    `/admin/sermons/${pathSegment(sermonId)}`,
    sermonSchema
  );
}

export async function createLocalSermonDraft(
  input: CreateLocalSermonDraftRequest
): Promise<Sermon> {
  const payload = createLocalSermonDraftRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/sermons/local-drafts",
    payload,
    sermonSchema
  );
}

export async function uploadLocalSermonPackage(
  sermonId: string,
  revision: number,
  input: LocalSermonPackageRequest
): Promise<Sermon> {
  const payload = localSermonPackageRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/local-package`,
    payload,
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function updateAdminSermon(
  sermonId: string,
  revision: number,
  input: UpdateSermonRequest
): Promise<Sermon> {
  const payload = updateSermonRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/sermons/${pathSegment(sermonId)}`,
    payload,
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function uploadAdminSermonAudio(
  sermonId: string,
  revision: number,
  file: File
): Promise<Sermon> {
  return apiClient.uploadBinaryData(
    `/admin/sermons/${pathSegment(sermonId)}/audio`,
    file,
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function getAdminSermonAudioBlob(sermonId: string): Promise<Blob> {
  return apiClient.getBlob(`/admin/sermons/${pathSegment(sermonId)}/audio`);
}

export async function deleteAdminSermonAudio(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.deleteData(
    `/admin/sermons/${pathSegment(sermonId)}/audio`,
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function publishAdminSermon(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/publish`,
    {},
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function submitAdminSermonReview(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/submit-review`,
    {},
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function returnAdminSermonDraft(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/return-draft`,
    {},
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function markAdminSermonFailed(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/mark-failed`,
    {},
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function archiveAdminSermon(
  sermonId: string,
  revision: number
): Promise<Sermon> {
  return apiClient.postData(
    `/admin/sermons/${pathSegment(sermonId)}/archive`,
    {},
    sermonSchema,
    sermonMutationHeaders(revision)
  );
}

export async function deleteAdminSermon(
  sermonId: string,
  revision: number
): Promise<void> {
  await apiClient.deleteData(
    `/admin/sermons/${pathSegment(sermonId)}`,
    deletedResponseSchema,
    sermonMutationHeaders(revision)
  );
}

export async function listAdminSermonAudioCleanups(
  filters: AdminSermonAudioCleanupFilters = {}
): Promise<SermonAudioCleanupTask[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "status", filters.status);
  const response = await apiClient.getData(
    `/admin/sermons/audio-cleanups?${params.toString()}`,
    sermonAudioCleanupListResponseSchema
  );
  return response.items;
}

export async function retryAdminSermonAudioCleanup(
  cleanupTaskId: string
): Promise<SermonAudioCleanupTask> {
  return apiClient.postData(
    `/admin/sermons/audio-cleanups/${pathSegment(cleanupTaskId)}/retry`,
    {},
    sermonAudioCleanupTaskSchema
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

function sermonMutationHeaders(revision: number) {
  return {
    "x-sermon-revision": String(sermonRevisionSchema.parse(revision))
  };
}
