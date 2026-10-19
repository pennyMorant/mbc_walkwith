import { appError } from "../../shared/http/app-error.js";

export function mediaAssetNotFound(id: string) {
  return appError({
    code: "media_asset_not_found",
    message: "Media asset was not found.",
    statusCode: 404,
    category: "not_found",
    sourceLayer: "capability",
    details: { id }
  });
}

export function mediaCleanupNotFound(id: string) {
  return appError({
    code: "media_cleanup_not_found",
    message: "Media cleanup task was not found.",
    statusCode: 404,
    category: "not_found",
    sourceLayer: "capability",
    details: { id },
    nextAction: "refresh"
  });
}

export function mediaUploadBodyInvalid() {
  return appError({
    code: "media_upload_body_invalid",
    message: "Upload body must contain an image.",
    statusCode: 400,
    category: "validation",
    sourceLayer: "surface"
  });
}

export function mediaImageUnsupportedType(mimeType: string) {
  return appError({
    code: "media_image_unsupported_type",
    message: "Unsupported image type.",
    statusCode: 415,
    category: "validation",
    sourceLayer: "capability",
    details: { mimeType }
  });
}

export function mediaImageInvalid() {
  return appError({
    code: "media_image_invalid",
    message: "The uploaded file does not match its image content type.",
    statusCode: 400,
    category: "validation",
    sourceLayer: "capability"
  });
}

export function mediaImageTooLarge(sizeBytes: number) {
  return appError({
    code: "media_image_too_large",
    message: "Image exceeds the 12 MB upload limit.",
    statusCode: 413,
    category: "validation",
    sourceLayer: "capability",
    details: { sizeBytes, maxSizeBytes: 12 * 1024 * 1024 }
  });
}

export function mediaObjectUploadFailed() {
  return appError({
    code: "object_upload_failed",
    message: "Media upload failed.",
    statusCode: 502,
    category: "external_failure",
    sourceLayer: "external",
    retryable: true
  });
}
