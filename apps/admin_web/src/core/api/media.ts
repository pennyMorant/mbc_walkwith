import {
  mediaAssetListResponseSchema,
  mediaAssetSchema,
  mediaCleanupListResponseSchema,
  mediaCleanupTaskSchema,
  type MediaAssetListQuery,
  type MediaAssetUpdateRequest,
  type MediaCleanupStatus,
  type MediaCleanupTask,
  type MediaAsset
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import { pathSegment } from "./path_segments";

export async function listMediaImages(): Promise<MediaAsset[]> {
  mediaImageListRequest ??= apiClient
    .getData(
      "/admin/media?kind=image&visibility=public&consentStatus=approved&limit=100",
      mediaAssetListResponseSchema
    )
    .then((response) => response.items)
    .catch((error) => {
      mediaImageListRequest = null;
      throw error;
    });
  return mediaImageListRequest;
}

let mediaImageListRequest: Promise<MediaAsset[]> | null = null;

export async function listMediaAssets(
  filters: Partial<MediaAssetListQuery> = {}
): Promise<MediaAsset[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? 100)
  });
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.consentStatus) {
    params.set("consentStatus", filters.consentStatus);
  }
  const response = await apiClient.getData(
    `/admin/media?${params.toString()}`,
    mediaAssetListResponseSchema
  );
  return response.items;
}

export async function uploadMediaImage(
  file: File,
  altText = ""
): Promise<MediaAsset> {
  const params = new URLSearchParams({
    visibility: "public",
    consentStatus: "approved",
    altText
  });
  const asset = await apiClient.uploadBinaryData(
    `/admin/media/images?${params.toString()}`,
    file,
    mediaAssetSchema
  );
  mediaImageListRequest = listMediaImages().then((items) => [
    asset,
    ...items.filter((item) => item.id !== asset.id)
  ]);
  return asset;
}

export async function updateMediaAsset(
  mediaId: string,
  input: MediaAssetUpdateRequest
): Promise<MediaAsset> {
  const asset = await apiClient.patchData(
    `/admin/media/${pathSegment(mediaId)}`,
    input,
    mediaAssetSchema
  );
  mediaImageListRequest = null;
  return asset;
}

export async function listMediaCleanupTasks(filters: {
  status?: MediaCleanupStatus | "";
  limit?: number;
} = {}): Promise<MediaCleanupTask[]> {
  const params = new URLSearchParams({ limit: String(filters.limit ?? 50) });
  if (filters.status) params.set("status", filters.status);
  const response = await apiClient.getData(
    `/admin/media/cleanup-tasks?${params.toString()}`,
    mediaCleanupListResponseSchema
  );
  return response.items;
}

export function retryMediaCleanupTask(
  cleanupTaskId: string
): Promise<MediaCleanupTask> {
  return apiClient.postData(
    `/admin/media/cleanup-tasks/${pathSegment(cleanupTaskId)}/retry`,
    {},
    mediaCleanupTaskSchema
  );
}
