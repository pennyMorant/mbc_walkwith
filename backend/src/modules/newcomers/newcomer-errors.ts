import { appError } from "../../shared/http/app-error.js";

export function newcomerNotFound(newcomerId: string) {
  return appError({
    code: "newcomer_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Newcomer profile not found.",
    recoverable: true,
    retryable: false,
    evidence: { newcomerId },
    nextAction: "refresh"
  });
}

export function newcomerTransitionInvalid(newcomerId: string) {
  return appError({
    code: "newcomer_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Newcomer status transition is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { newcomerId },
    nextAction: "refresh"
  });
}

export function newcomerExternalIdentityConflict() {
  return appError({
    code: "newcomer_external_identity_conflict",
    category: "validation_failed",
    sourceLayer: "feature",
    statusCode: 400,
    message: "Newcomer external identity does not match this installation.",
    recoverable: true,
    retryable: false,
    nextAction: "retry"
  });
}

export function newcomerFollowUpInvalid(
  newcomerId: string,
  reason: string
) {
  return appError({
    code: "newcomer_followup_invalid",
    category: "validation_failed",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Newcomer follow-up lifecycle is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { newcomerId, reason },
    nextAction: "retry"
  });
}
