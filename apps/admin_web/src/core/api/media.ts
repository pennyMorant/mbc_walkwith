import {
  mediaAssetListResponseSchema,
  mediaAssetSchema,
  type MediaAsset
} from "@mbc/api-contracts";

import { apiClient } from "./client";

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
