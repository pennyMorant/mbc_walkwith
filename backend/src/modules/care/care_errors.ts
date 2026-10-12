import { appError } from "../../shared/http/app-error.js";
import type { CareRequestAdmin } from "@mbc/api-contracts";

export function careRequestNotFound(careRequestId: string) {
  return appError({
    code: "care_request_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Care request not found.",
    recoverable: true,
    retryable: false,
    evidence: { careRequestId },
    nextAction: "refresh"
  });
}

export function carePrivacyDenied(careRequestId: string) {
  return appError({
    code: "care_privacy_denied",
    category: "permission_denied",
    sourceLayer: "domain",
    statusCode: 403,
    message: "You cannot view this care request.",
    recoverable: true,
    retryable: false,
    evidence: { careRequestId },
    nextAction: "request_permission"
  });
}

export function careAssigneeInvalid(assigneeAdminUserId: string) {
  return appError({
    code: "care_assignee_invalid",
    category: "validation_failed",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Care assignee must be an active administrator with care access.",
    recoverable: true,
    retryable: false,
    evidence: { assigneeAdminUserId },
    nextAction: "select_valid_assignee"
  });
}

export function careRequestStateConflict(request: CareRequestAdmin) {
  return appError({
    code: "care_request_state_conflict",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Care request changed while it was being updated.",
    recoverable: true,
    retryable: false,
    evidence: {
      careRequestId: request.id,
      status: request.status,
      privacyLevel: request.privacyLevel,
      version: request.version,
      updatedAt: request.updatedAt
    },
    nextAction: "refresh"
  });
}
