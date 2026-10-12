import { appError } from "../../shared/http/app-error.js";

export function readingPlanNotFound(planId: string) {
  return appError({
    code: "reading_plan_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Reading plan not found.",
    recoverable: true,
    retryable: false,
    evidence: { planId },
    nextAction: "refresh"
  });
}

export function readingPlanDayNotFound(dayId: string) {
  return appError({
    code: "reading_plan_day_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Reading plan day not found.",
    recoverable: true,
    retryable: false,
    evidence: { dayId },
    nextAction: "refresh"
  });
}

export function readingPlanAssignmentNotFound(assignmentId: string) {
  return appError({
    code: "reading_plan_assignment_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Reading plan assignment not found.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "refresh"
  });
}

export function readingPlanAssignmentClosed(
  planId: string,
  status: string
) {
  return appError({
    code: "reading_plan_assignment_closed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "This reading plan is not open for assignment.",
    recoverable: true,
    retryable: false,
    evidence: { planId, status },
    nextAction: "review_request"
  });
}

export function readingPlanAssignmentTransitionInvalid(
  assignmentId: string,
  fromStatus: string,
  toStatus: string
) {
  return appError({
    code: "reading_plan_assignment_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Reading plan assignment status transition is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId, fromStatus, toStatus },
    nextAction: "refresh"
  });
}

export function readingPlanPermissionDenied(planId: string) {
  return appError({
    code: "reading_plan_permission_denied",
    category: "permission",
    sourceLayer: "feature",
    statusCode: 403,
    message: "This reading plan requires member access.",
    recoverable: true,
    retryable: false,
    evidence: { planId },
    nextAction: "sign_in"
  });
}

export function readingPlanUserRequired() {
  return appError({
    code: "reading_plan_user_required",
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

export function readingPlanTransitionInvalid(
  planId: string,
  fromStatus: string,
  toStatus: string,
  reason: string
) {
  return appError({
    code: "reading_plan_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Reading plan status transition is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { planId, fromStatus, toStatus, reason },
    nextAction: "refresh"
  });
}

export function readingPlanPublishIncomplete(
  planId: string,
  durationDays: number,
  missingDayNumbers: number[],
  unexpectedDayNumbers: number[]
) {
  return appError({
    code: "reading_plan_publish_incomplete",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Reading plan must have a complete daily schedule before publication.",
    recoverable: true,
    retryable: false,
    evidence: {
      planId,
      durationDays,
      missingDayNumbers,
      unexpectedDayNumbers
    },
    nextAction: "review_request"
  });
}

export function readingPlanDayOutOfRange(
  planId: string,
  dayNumber: number,
  durationDays: number
) {
  return appError({
    code: "reading_plan_day_out_of_range",
    category: "validation_error",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Reading plan day number is outside the plan duration.",
    recoverable: true,
    retryable: false,
    evidence: { planId, dayNumber, durationDays },
    nextAction: "review_request"
  });
}

export function readingPlanStructureLocked(planId: string) {
  return appError({
    code: "reading_plan_structure_locked",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Reading plan structure is locked after the first assignment.",
    recoverable: true,
    retryable: false,
    evidence: { planId },
    nextAction: "review_request"
  });
}

export function readingPlanProgressClosed(
  planId: string,
  assignmentId: string,
  planStatus: string,
  assignmentStatus: string
) {
  return appError({
    code: "reading_plan_progress_closed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Reading plan progress is not open for updates.",
    recoverable: true,
    retryable: false,
    evidence: { planId, assignmentId, planStatus, assignmentStatus },
    nextAction: "refresh"
  });
}

export function readingPlanAssignmentUserNotFound(userId: string) {
  return appError({
    code: "reading_plan_assignment_user_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Reading plan assignment member not found.",
    recoverable: true,
    retryable: false,
    evidence: { userType: "member", userId },
    nextAction: "refresh"
  });
}
