import { appError } from "../../shared/http/app-error.js";

export function lifePostNotFound(lifePostId: string) {
  return appError({
    code: "life_post_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Life post not found.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "refresh"
  });
}

export function lifePostScheduleInvalid(evidence: {
  startsAt: string | null;
  endsAt: string | null;
}) {
  return appError({
    code: "life_post_schedule_invalid",
    category: "validation_error",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Life post end time must be after start time.",
    recoverable: true,
    retryable: false,
    evidence,
    nextAction: "review_request"
  });
}

export function lifePostStateChanged(lifePostId: string) {
  return appError({
    code: "life_post_state_changed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Life post changed after this editor loaded it.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "refresh"
  });
}

export function lifePostPublishPermissionDenied(lifePostId: string) {
  return appError({
    code: "life_post_publish_permission_denied",
    category: "permission_denied",
    sourceLayer: "feature",
    statusCode: 403,
    message: "Publishing permission is required to change this life post.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "request_permission"
  });
}

export function lifePostPublishNotReady(
  lifePostId: string,
  missing: string[]
) {
  return appError({
    code: "life_post_publish_not_ready",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Life post is missing required publish content.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, missing },
    nextAction: "review_request"
  });
}

export function lifePostNotificationTranslationNotAllowed(
  lifePostId: string,
  status: string
) {
  return appError({
    code: "life_post_notification_translation_not_allowed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Notification translations can only be generated before publication.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, status },
    nextAction: "review_request"
  });
}

export function lifeImageNotFound(fileName: string) {
  return appError({
    code: "life_image_not_found",
    category: "not_found",
    sourceLayer: "capability",
    statusCode: 404,
    message: "Life image not found.",
    recoverable: true,
    retryable: false,
    evidence: { fileName },
    nextAction: "refresh"
  });
}

export function lifeImageUploadBodyInvalid() {
  return appError({
    code: "life_image_upload_body_invalid",
    category: "validation_error",
    sourceLayer: "surface",
    statusCode: 400,
    message: "Image upload body must be binary.",
    recoverable: true,
    retryable: false,
    nextAction: "review_request"
  });
}

export function lifeImageUnsupportedType(mimeType: string) {
  return lifeImageUploadInvalid(
    "life_image_type_unsupported",
    "Unsupported image file type.",
    { mimeType }
  );
}

export function lifeImageEmpty() {
  return lifeImageUploadInvalid("life_image_empty", "Image file is empty.");
}

export function lifeImageTooLarge(sizeBytes: number, maxSizeBytes: number) {
  return lifeImageUploadInvalid(
    "life_image_too_large",
    "Image file is too large.",
    { sizeBytes, maxSizeBytes }
  );
}

function lifeImageUploadInvalid(
  code: string,
  message: string,
  evidence: Record<string, unknown> = {}
) {
  return appError({
    code,
    category: "validation_error",
    sourceLayer: "capability",
    statusCode: 400,
    message,
    recoverable: true,
    retryable: false,
    evidence,
    nextAction: "review_request"
  });
}
