import {
  adminBibleVerseNoteHideRequestSchema,
  adminBibleVerseNoteListResponseSchema,
  adminBibleVerseNoteSchema,
  type AdminBibleVerseNote,
  type AdminBibleVerseNoteHideRequest,
  type AdminBibleVerseNoteListQuery
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type BibleVerseNoteFilters = QueryWithSelectAll<
  QueryWithSelectAll<AdminBibleVerseNoteListQuery, "status">,
  "authorType"
>;

export async function listBibleVerseNotes(
  filters: BibleVerseNoteFilters = {}
): Promise<AdminBibleVerseNote[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "verseId", filters.verseId);
  appendParam(params, "status", filters.status);
  appendParam(params, "authorType", filters.authorType);
  return (
    await apiClient.getData(
      `/admin/bible/verse-notes?${params.toString()}`,
      adminBibleVerseNoteListResponseSchema
    )
  ).items;
}

export async function hideBibleVerseNote(
  noteId: string,
  input: AdminBibleVerseNoteHideRequest
): Promise<AdminBibleVerseNote> {
  const payload = adminBibleVerseNoteHideRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/bible/verse-notes/${pathSegment(noteId)}/hide`,
    payload,
    adminBibleVerseNoteSchema
  );
}

export async function restoreBibleVerseNote(
  noteId: string
): Promise<AdminBibleVerseNote> {
  return apiClient.patchData(
    `/admin/bible/verse-notes/${pathSegment(noteId)}/restore`,
    {},
    adminBibleVerseNoteSchema
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
