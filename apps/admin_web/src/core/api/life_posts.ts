import {
  deletedResponseSchema,
  eventCheckInCodeCreateRequestSchema,
  eventCheckInCodeSchema,
  eventRegistrationExportResponseSchema,
  eventRegistrationAdminCreateRequestSchema,
  eventRegistrationListResponseSchema,
  eventRegistrationSchema,
  eventRegistrationUpdateRequestSchema,
  lifeImageUploadResponseSchema,
  lifePostListResponseSchema,
  lifePostPublishRequestSchema,
  lifePostNotificationTranslationRequestSchema,
  lifePostPublishNotificationCopySchema,
  lifePostRevisionSchema,
  lifePostSchema,
  lifePostUpdateRequestSchema,
  lifePostUpsertRequestSchema,
  type EventRegistration,
  type EventCheckInCode,
  type EventCheckInCodeCreateRequest,
  type EventRegistrationAdminCreateRequest,
  type EventRegistrationExportResponse,
  type EventRegistrationListQuery,
  type EventRegistrationListResponse,
  type EventRegistrationStatus,
  type EventRegistrationUpdateRequest,
  type LifePost,
  type LifePostPublishRequest,
  type LifePostListQuery,
  type LifePostUpdateRequest,
  type LifePostUpsertRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type LifePostListFilters = QueryWithSelectAll<
  QueryWithSelectAll<LifePostListQuery, "visibility">,
  "status"
>;

export type EventRegistrationFilters = QueryWithSelectAll<
  EventRegistrationListQuery,
  "status"
>;

export async function listLifePosts(
  filters: LifePostListFilters = {}
): Promise<LifePost[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "visibility", filters.visibility);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/life-posts?${params.toString()}`,
      lifePostListResponseSchema
    )
  ).items;
}

export async function createLifePost(
  input: LifePostUpsertRequest
): Promise<LifePost> {
  const payload = lifePostUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/life-posts", payload, lifePostSchema);
}

export async function translateLifePostNotification(postId: string, input: {
  targetLocale: "en" | "es" | "zh-Hans" | "zh-Hant";
  title?: string;
  body?: string;
}) {
  const payload = lifePostNotificationTranslationRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/notification-translation`,
    payload,
    lifePostPublishNotificationCopySchema
  );
}

export async function updateLifePost(
  postId: string,
  revision: number,
  input: LifePostUpdateRequest
): Promise<LifePost> {
  const payload = lifePostUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/life-posts/${pathSegment(postId)}`,
    payload,
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function publishLifePost(
  postId: string,
  revision: number,
  input: LifePostPublishRequest = { visibility: "public", notifyApp: false }
): Promise<LifePost> {
  const payload = lifePostPublishRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/publish`,
    payload,
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function submitLifePostReview(
  postId: string,
  revision: number
): Promise<LifePost> {
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/submit-review`,
    {},
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function returnLifePostDraft(
  postId: string,
  revision: number
): Promise<LifePost> {
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/return-draft`,
    {},
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function archiveLifePost(
  postId: string,
  revision: number
): Promise<LifePost> {
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/archive`,
    {},
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function unpublishLifePost(
  postId: string,
  revision: number
): Promise<LifePost> {
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/unpublish`,
    {},
    lifePostSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function deleteLifePost(
  postId: string,
  revision: number
): Promise<void> {
  await apiClient.deleteData(
    `/admin/life-posts/${pathSegment(postId)}`,
    deletedResponseSchema,
    lifePostMutationHeaders(revision)
  );
}

export async function uploadLifePostImage(file: File): Promise<string> {
  return (
    await apiClient.uploadBinaryData(
      "/admin/life-posts/images",
      file,
      lifeImageUploadResponseSchema
    )
  ).imageUrl;
}

export async function createEventCheckInCode(
  postId: string,
  input: EventCheckInCodeCreateRequest = { rotate: false }
): Promise<EventCheckInCode> {
  const payload = eventCheckInCodeCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/check-in-code`,
    payload,
    eventCheckInCodeSchema
  );
}

export async function listEventRegistrations(
  postId: string,
  filters: EventRegistrationFilters = {}
): Promise<EventRegistrationListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  params.set("offset", String(filters.offset ?? 0));
  appendParam(params, "status", filters.status);
  appendParam(params, "query", filters.query);
  return apiClient.getData(
    `/admin/life-posts/${pathSegment(postId)}/registrations?${params.toString()}`,
    eventRegistrationListResponseSchema
  );
}

export async function exportEventRegistrations(
  postId: string
): Promise<EventRegistrationExportResponse> {
  return apiClient.getData(
    `/admin/life-posts/${pathSegment(postId)}/registrations/export`,
    eventRegistrationExportResponseSchema
  );
}

export async function createEventRegistration(
  postId: string,
  input: EventRegistrationAdminCreateRequest
): Promise<EventRegistration> {
  const payload = eventRegistrationAdminCreateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/life-posts/${pathSegment(postId)}/registrations`,
    payload,
    eventRegistrationSchema
  );
}

export async function updateEventRegistrationStatus(
  postId: string,
  registrationId: string,
  status: EventRegistrationStatus
): Promise<EventRegistration> {
  const payload = eventRegistrationUpdateRequestSchema.parse({ status });
  return apiClient.patchData(
    `/admin/life-posts/${pathSegment(postId)}/registrations/${pathSegment(registrationId)}`,
    payload,
    eventRegistrationSchema
  );
}

export async function updateEventRegistration(
  postId: string,
  registrationId: string,
  input: EventRegistrationUpdateRequest
): Promise<EventRegistration> {
  const payload = eventRegistrationUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/life-posts/${pathSegment(postId)}/registrations/${pathSegment(registrationId)}`,
    payload,
    eventRegistrationSchema
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

function lifePostMutationHeaders(revision: number) {
  return {
    "x-life-post-revision": String(lifePostRevisionSchema.parse(revision))
  };
}
