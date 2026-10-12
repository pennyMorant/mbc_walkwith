import { appError } from "../../shared/http/app-error.js";

export function discipleshipJourneyNotFound(journeyId: string) {
  return appError({
    code: "discipleship_journey_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Discipleship journey not found.",
    recoverable: true,
    retryable: false,
    evidence: { journeyId },
    nextAction: "refresh"
  });
}

export function discipleshipAssignmentNotFound(assignmentId: string) {
  return appError({
    code: "discipleship_assignment_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Discipleship assignment not found.",
    recoverable: true,
    retryable: false,
    evidence: { assignmentId },
    nextAction: "refresh"
  });
}

export function discipleshipAssignmentClosed(
  journeyId: string,
  status: string
) {
  return appError({
    code: "discipleship_assignment_closed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "This discipleship journey is not open for assignment.",
    recoverable: true,
    retryable: false,
    evidence: { journeyId, status },
    nextAction: "review_request"
  });
}

export function discipleshipStageNotFound(stageId: string) {
  return appError({
    code: "discipleship_stage_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Discipleship stage not found.",
    recoverable: true,
    retryable: false,
    evidence: { stageId },
    nextAction: "refresh"
  });
}

export function discipleshipTaskNotFound(taskId: string) {
  return appError({
    code: "discipleship_task_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Discipleship task not found.",
    recoverable: true,
    retryable: false,
    evidence: { taskId },
    nextAction: "refresh"
  });
}

export function discipleshipReferenceInvalid(
  referenceType: string,
  referenceId: string
) {
  return appError({
    code: "discipleship_reference_invalid",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Discipleship task reference is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { referenceType, referenceId },
    nextAction: "review_request"
  });
}

export function discipleshipSourceInvalid(
  sourceType: string,
  sourceId: string | null | undefined,
  userId: string
) {
  return appError({
    code: "discipleship_source_invalid",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Discipleship assignment source is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { sourceType, sourceId: sourceId ?? null, userId },
    nextAction: "review_request"
  });
}
