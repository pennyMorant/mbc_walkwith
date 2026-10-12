import {
  bibleKnowledgeEntitySchema,
  bibleKnowledgeListResponseSchema,
  bibleKnowledgeUpdateRequestSchema,
  bibleKnowledgeUpsertRequestSchema,
  deletedResponseSchema,
  type BibleKnowledgeEntity,
  type BibleKnowledgeEntityType,
  type BibleKnowledgeListQuery,
  type BibleKnowledgeUpdateRequest,
  type BibleKnowledgeUpsertRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type BibleKnowledgeListFilters = QueryWithSelectAll<
  QueryWithSelectAll<BibleKnowledgeListQuery, "type">,
  "status"
>;

export async function listBibleKnowledge(
  filters: BibleKnowledgeListFilters = {}
): Promise<BibleKnowledgeEntity[]> {
  const params = new URLSearchParams();
  params.set("locale", filters.locale ?? "en");
  params.set("translationId", filters.translationId ?? "web");
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "type", filters.type);
  appendParam(params, "status", filters.status);

  return (
    await apiClient.getData(
      `/admin/bible-knowledge?${params.toString()}`,
      bibleKnowledgeListResponseSchema
    )
  ).items;
}

export async function createBibleKnowledgeEntity(
  input: BibleKnowledgeUpsertRequest
): Promise<BibleKnowledgeEntity> {
  const payload = bibleKnowledgeUpsertRequestSchema.parse(input);
  return apiClient.postData(
    "/admin/bible-knowledge",
    payload,
    bibleKnowledgeEntitySchema
  );
}

export async function updateBibleKnowledgeEntity(
  entityId: string,
  input: BibleKnowledgeUpdateRequest,
  key: { locale?: string; translationId?: string } = {}
): Promise<BibleKnowledgeEntity> {
  const payload = bibleKnowledgeUpdateRequestSchema.parse(input);
  const params = new URLSearchParams();
  params.set("locale", key.locale ?? "en");
  params.set("translationId", key.translationId ?? "web");
  return apiClient.patchData(
    `/admin/bible-knowledge/${pathSegment(entityId)}?${params.toString()}`,
    payload,
    bibleKnowledgeEntitySchema
  );
}

export async function deleteBibleKnowledgeEntity(
  entityId: string,
  key: { locale?: string; translationId?: string } = {}
): Promise<void> {
  const params = new URLSearchParams();
  params.set("locale", key.locale ?? "en");
  params.set("translationId", key.translationId ?? "web");
  await apiClient.deleteData(
    `/admin/bible-knowledge/${pathSegment(entityId)}?${params.toString()}`,
    deletedResponseSchema
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
