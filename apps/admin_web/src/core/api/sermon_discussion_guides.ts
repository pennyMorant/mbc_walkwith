import {
  sermonDiscussionAudienceTypeSchema,
  sermonDiscussionGuideCreateRequestSchema,
  sermonDiscussionGuideListResponseSchema,
  sermonDiscussionGuideSchema,
  sermonDiscussionGuideStatusSchema,
  sermonDiscussionGuideUpdateRequestSchema,
  sermonDiscussionQuestionTypeSchema,
  sermonDiscussionResponseListResponseSchema,
  sermonDiscussionResponseSchema,
  type SermonDiscussionAudienceType,
  type SermonDiscussionGuide,
  type SermonDiscussionGuideCreateRequest,
  type SermonDiscussionGuideListQuery,
  type SermonDiscussionGuideStatus,
  type SermonDiscussionGuideUpdateRequest,
  type SermonDiscussionQuestionType,
  type SermonDiscussionResponse,
  type SermonDiscussionResponseListQuery,
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type SermonDiscussionGuideFilters = QueryWithSelectAll<
  QueryWithSelectAll<SermonDiscussionGuideListQuery, "status">,
  "audienceType"
>;

export type SermonDiscussionResponseFilters = QueryWithSelectAll<
  Omit<SermonDiscussionResponseListQuery, "guideId" | "status">,
  "userType"
>;

export async function listSermonDiscussionGuides(
  filters: SermonDiscussionGuideFilters = {}
): Promise<SermonDiscussionGuide[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "sermonId", filters.sermonId);
  appendParam(params, "status", filters.status);
  appendParam(params, "audienceType", filters.audienceType);

  return (
    await apiClient.getData(
      `/admin/sermon-discussion-guides?${params.toString()}`,
      sermonDiscussionGuideListResponseSchema
    )
  ).items;
}

export async function createSermonDiscussionGuide(
  input: SermonDiscussionGuideCreateRequest
): Promise<SermonDiscussionGuide> {
  const payload = sermonDiscussionGuideCreateRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/sermon-discussion-guides",
    payload,
    sermonDiscussionGuideSchema
  );
}

export async function updateSermonDiscussionGuide(
  guideId: string,
  input: SermonDiscussionGuideUpdateRequest
): Promise<SermonDiscussionGuide> {
  const payload = sermonDiscussionGuideUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/sermon-discussion-guides/${pathSegment(guideId)}`,
    payload,
    sermonDiscussionGuideSchema
  );
}

export async function listSermonDiscussionResponses(
  guideId: string,
  filters: SermonDiscussionResponseFilters = {}
): Promise<SermonDiscussionResponse[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "userType", filters.userType);

  return (
    await apiClient.getData(
      `/admin/sermon-discussion-guides/${pathSegment(guideId)}/responses?${params.toString()}`,
      sermonDiscussionResponseListResponseSchema
    )
  ).items;
}

export async function hideSermonDiscussionResponse(
  responseId: string
): Promise<SermonDiscussionResponse> {
  return apiClient.patchData(
    `/admin/sermon-discussion-guides/responses/${pathSegment(responseId)}/hide`,
    {},
    sermonDiscussionResponseSchema
  );
}

export const sermonDiscussionGuideStatusOptions: SermonDiscussionGuideStatus[] =
  sermonDiscussionGuideStatusSchema.options;

export const sermonDiscussionAudienceTypeOptions: SermonDiscussionAudienceType[] =
  sermonDiscussionAudienceTypeSchema.options;

export const sermonDiscussionQuestionTypeOptions: SermonDiscussionQuestionType[] =
  sermonDiscussionQuestionTypeSchema.options;

export const sermonDiscussionResponseUserTypeOptions = [
  "member",
  "external"
] as const;

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
