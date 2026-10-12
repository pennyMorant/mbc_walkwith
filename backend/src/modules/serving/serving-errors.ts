import { appError } from "../../shared/http/app-error.js";

export function servingTeamNotFound(teamId: string) {
  return appError({
    code: "serving_team_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Serving team not found.",
    recoverable: true,
    retryable: false,
    evidence: { teamId },
    nextAction: "refresh"
  });
}

export function servingRoleNotFound(roleId: string) {
  return appError({
    code: "serving_role_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Serving role not found.",
    recoverable: true,
    retryable: false,
    evidence: { roleId },
    nextAction: "refresh"
  });
}

export function servingRoleInUse(roleId: string, assignmentIds: string[]) {
  return appError({
    code: "serving_role_in_use",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "A serving role with assignments cannot move to another team.",
    recoverable: true,
    retryable: false,
    evidence: { roleId, assignmentIds },
    nextAction: "review_dependents"
  });
}

export function servingAssignmentNotFound(assignmentId: string) {
  return appError({
    code: "serving_assignment_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Serving assignment not found.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "refresh"
  });
}

export function servingMemberNotFound(userId: string) {
  return appError({
    code: "serving_member_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Serving member not found.",
    recoverable: true,
    retryable: false,
    evidence: { userId },
    nextAction: "select_member"
  });
}

export function servingPermissionDenied(assignmentId: string) {
  return appError({
    code: "serving_permission_denied",
    category: "permission_denied",
    sourceLayer: "domain",
    statusCode: 403,
    message: "You cannot update this serving assignment.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "request_permission"
  });
}

export function servingAssignmentConflict(
  assignmentId: string,
  conflictingAssignmentIds: string[] = []
) {
  return appError({
    code: "serving_assignment_conflict",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This serving assignment cannot be updated in its current state.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId, conflictingAssignmentIds },
    nextAction: "refresh"
  });
}

export function servingTimeRangeInvalid(
  resourceType: "assignment" | "availability"
) {
  return appError({
    code: "serving_time_range_invalid",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Serving end time must be later than start time.",
    recoverable: true,
    retryable: false,
    evidence: { resourceType },
    nextAction: "edit_input"
  });
}

export function servingAvailabilityConflict(conflictingRecordIds: string[]) {
  return appError({
    code: "serving_availability_conflict",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Serving availability overlaps an existing record.",
    recoverable: true,
    retryable: false,
    evidence: { conflictingRecordIds },
    nextAction: "edit_input"
  });
}

export function servingCheckInInvalid(assignmentId: string) {
  return appError({
    code: "serving_check_in_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This serving assignment cannot be checked in.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "refresh"
  });
}

export function servingCheckInReasonRequired(assignmentId: string) {
  return appError({
    code: "serving_check_in_reason_required",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "A reason is required to correct this serving check-in.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "edit_input"
  });
}
