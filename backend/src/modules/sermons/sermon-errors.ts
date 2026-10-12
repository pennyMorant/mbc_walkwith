import { appError } from "../../shared/http/app-error.js";

export function sermonNotFound(sermonId: string) {
  return appError({
    code: "sermon_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon not found.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "refresh"
  });
}

export function mediaMissing(sermonId: string, message = "Sermon audio not found.") {
  return appError({
    code: "media_missing",
    category: "not_found",
    sourceLayer: "capability",
    statusCode: 404,
    message,
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "refresh"
  });
}

export function uploadFailed(sermonId: string, message: string) {
  return appError({
    code: "upload_failed",
    category: "validation_error",
    sourceLayer: "capability",
    statusCode: 400,
    message,
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "review_request"
  });
}

export function reviewRequired(sermonId: string, missing: string[]) {
  return appError({
    code: "review_required",
    category: "validation_error",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Sermon needs review-ready content before publishing.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId, missing },
    nextAction: "review_request"
  });
}

export function publishPermissionDenied(sermonId: string) {
  return appError({
    code: "publish_permission_denied",
    category: "permission_denied",
    sourceLayer: "feature",
    statusCode: 403,
    message: "Admin permission is required.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "request_permission"
  });
}

export function sermonStateChanged(sermonId: string) {
  return appError({
    code: "sermon_state_changed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "The sermon changed while the request was being applied.",
    recoverable: true,
    retryable: true,
    evidence: { sermonId },
    nextAction: "refresh"
  });
}

export function publishedSermonAssetLocked(
  sermonId: string,
  asset: "audio"
) {
  return appError({
    code: "sermon_published_asset_locked",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Return the published sermon to draft before removing its audio.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId, asset },
    nextAction: "return_draft"
  });
}

export function sermonProgressIdentityRequired() {
  return appError({
    code: "sermon_progress_identity_required",
    category: "validation_error",
    sourceLayer: "feature",
    statusCode: 400,
    message: "A member session or external user id is required.",
    recoverable: true,
    retryable: false,
    evidence: {},
    nextAction: "provide_external_user_id"
  });
}

export function sermonAudioCleanupNotFound(cleanupTaskId: string) {
  return appError({
    code: "sermon_audio_cleanup_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon audio cleanup task was not found.",
    recoverable: true,
    retryable: false,
    evidence: { cleanupTaskId },
    nextAction: "refresh"
  });
}
