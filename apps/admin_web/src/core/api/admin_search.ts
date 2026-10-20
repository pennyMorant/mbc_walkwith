import {
  adminSearchResponseSchema,
  type AdminSearchResponse
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export async function searchAdmin(query: string): Promise<AdminSearchResponse> {
  const params = new URLSearchParams({ query });
  return apiClient.getData(
    `/admin/search?${params.toString()}`,
    adminSearchResponseSchema
  );
}
