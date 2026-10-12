import { appError } from "../../shared/http/app-error.js";

export function sermonDiscussionGuideNotFound(guideId: string) {
  return appError({
    code: "sermon_discussion_guide_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon discussion guide not found.",
    recoverable: true,
    retryable: false,
    evidence: { guideId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionGuideStateChanged(guideId: string) {
  return appError({
    code: "sermon_discussion_guide_state_changed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Discussion guide changed before this update could be saved.",
    recoverable: true,
    retryable: false,
    evidence: { guideId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionResponseNotFound(responseId: string) {
  return appError({
    code: "sermon_discussion_response_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon discussion response not found.",
    recoverable: true,
    retryable: false,
    evidence: { responseId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionSermonNotFound(sermonId: string) {
  return appError({
    code: "sermon_discussion_sermon_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon for discussion guide not found.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionReviewRequired(guideId: string) {
  return appError({
    code: "sermon_discussion_review_required",
    category: "validation_error",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Discussion guide must be reviewed and contain material before publication.",
    recoverable: true,
    retryable: false,
    evidence: { guideId },
    nextAction: "review_request"
  });
}

export function sermonDiscussionSermonNotPublished(sermonId: string) {
  return appError({
    code: "sermon_discussion_sermon_not_published",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Discussion guide can be published only for a published sermon.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "review_request"
  });
}

export function sermonDiscussionPublicGuideConflict(sermonId: string) {
  return appError({
    code: "sermon_discussion_public_guide_conflict",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "A public discussion guide is already published for this sermon.",
    recoverable: true,
    retryable: false,
    evidence: { sermonId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionTransitionInvalid(
  guideId: string,
  fromStatus: string,
  toStatus: string,
  reason: string
) {
  return appError({
    code: "sermon_discussion_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Sermon discussion guide status transition is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { guideId, fromStatus, toStatus, reason },
    nextAction: "refresh"
  });
}

export function sermonDiscussionAudienceInvalid(
  guideId: string,
  audienceType: string
) {
  return appError({
    code: "sermon_discussion_audience_invalid",
    category: "validation_error",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Sermon discussion guide audience target is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { guideId, audienceType },
    nextAction: "review_request"
  });
}

export function sermonDiscussionAudienceTargetNotFound(
  audienceType: string,
  audienceId: string
) {
  return appError({
    code: "sermon_discussion_audience_target_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Sermon discussion guide audience target not found.",
    recoverable: true,
    retryable: false,
    evidence: { audienceType, audienceId },
    nextAction: "refresh"
  });
}

export function sermonDiscussionResponseInvalid(
  guideId: string,
  questionId: string
) {
  return appError({
    code: "sermon_discussion_response_invalid",
    category: "validation",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Sermon discussion response does not match the guide.",
    recoverable: true,
    retryable: false,
    evidence: { guideId, questionId },
    nextAction: "review_request"
  });
}

export function sermonDiscussionVisibilityDenied(
  guideId: string,
  status: string
) {
  return appError({
    code: "sermon_discussion_visibility_denied",
    category: "permission",
    sourceLayer: "feature",
    statusCode: 403,
    message: "Sermon discussion response visibility is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { guideId, status },
    nextAction: "choose_private_visibility"
  });
}

export function sermonDiscussionUserRequired() {
  return appError({
    code: "sermon_discussion_user_required",
    category: "validation",
    sourceLayer: "feature",
    statusCode: 400,
    message: "A member session or external user id is required.",
    recoverable: true,
    retryable: false,
    evidence: {},
    nextAction: "provide_external_user_id"
  });
}
