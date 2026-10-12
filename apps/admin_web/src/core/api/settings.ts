import {
  appSettingListResponseSchema,
  appSettingSchema,
  appSettingUpdateRequestSchema,
  type AppSetting,
  type AppSettingListQuery,
  type AppSettingUpdateRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import { pathSegment } from "./path_segments";

export type SettingListFilters = Partial<AppSettingListQuery>;

export async function listSettings(
  filters: SettingListFilters = {}
): Promise<AppSetting[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "category", filters.category);
  appendParam(params, "query", filters.query);
  return (
    await apiClient.getData(
      `/admin/settings?${params.toString()}`,
      appSettingListResponseSchema
    )
  ).items;
}

export async function updateSetting(
  key: string,
  input: AppSettingUpdateRequest
): Promise<AppSetting> {
  const payload = appSettingUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/settings/${pathSegment(key)}`,
    payload,
    appSettingSchema
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
