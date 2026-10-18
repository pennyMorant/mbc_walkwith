import {
  mediaAssetListResponseSchema,
  mediaAssetSchema,
  type MediaAsset
} from "@mbc/api-contracts";

import { apiClient } from "./client";

export async function listMediaImages(): Promise<MediaAsset[]> {
  return (
    await apiClient.getData(
      "/admin/media?kind=image&visibility=public&limit=100",
      mediaAssetListResponseSchema
    )
  ).items;
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
  return apiClient.uploadBinaryData(
    `/admin/media/images?${params.toString()}`,
    file,
    mediaAssetSchema
  );
}
