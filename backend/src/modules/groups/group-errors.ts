import { appError } from "../../shared/http/app-error.js";

export function groupNotFound(groupId: string) {
  return appError({
    code: "group_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Group not found.",
    recoverable: true,
    retryable: false,
    evidence: { groupId },
    nextAction: "refresh"
  });
}

export function groupNotOpen(groupId: string) {
  return appError({
    code: "group_not_open",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This group is not accepting applications.",
    recoverable: true,
    retryable: false,
    evidence: { groupId },
    nextAction: "refresh"
  });
}

export function groupApplicationDuplicate(groupId: string) {
  return appError({
    code: "group_application_duplicate",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "A submitted application already exists for this group.",
    recoverable: true,
    retryable: false,
    evidence: { groupId },
    nextAction: "refresh"
  });
}

export function groupApplicationNotFound(
  groupId: string,
  applicationId: string
) {
  return appError({
    code: "group_application_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Group application not found.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, applicationId },
    nextAction: "refresh"
  });
}

export function groupMaterialAssignmentNotFound(
  groupId: string,
  assignmentId: string
) {
  return appError({
    code: "group_material_assignment_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Group material assignment not found.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, assignmentId },
    nextAction: "refresh"
  });
}

export function groupMaterialReferenceNotFound(
  materialType: string,
  materialId: string
) {
  return appError({
    code: "group_material_reference_not_found",
    category: "validation",
    sourceLayer: "feature",
    statusCode: 409,
    message: "The selected group material no longer exists.",
    recoverable: true,
    retryable: false,
    evidence: { materialType, materialId },
    nextAction: "correct_input"
  });
}

export function groupMembershipNotFound(groupId: string, memberUserId: string) {
  return appError({
    code: "group_membership_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Group membership not found.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, memberUserId },
    nextAction: "refresh"
  });
}

export function groupCapacityFull(groupId: string, capacity: number) {
  return appError({
    code: "group_capacity_full",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This group is full.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, capacity },
    nextAction: "refresh"
  });
}

export function groupCapacityBelowMemberCount(
  groupId: string,
  capacity: number,
  memberCount: number
) {
  return appError({
    code: "group_capacity_below_member_count",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Group capacity cannot be lower than the active member count.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, capacity, memberCount },
    nextAction: "correct_input"
  });
}

export function groupStatusTransitionInvalid(
  groupId: string,
  from: string,
  to: string
) {
  return appError({
    code: "group_status_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This group status transition is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, from, to },
    nextAction: "refresh"
  });
}

export function groupApplicationTransitionInvalid(
  groupId: string,
  applicationId: string,
  from: string,
  to: string
) {
  return appError({
    code: "group_application_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This group application transition is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, applicationId, from, to },
    nextAction: "refresh"
  });
}

export function groupAttendanceInvalid(groupId: string, memberUserId: string) {
  return appError({
    code: "group_attendance_invalid",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Attendance can only be recorded for an active group member.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, memberUserId },
    nextAction: "correct_input"
  });
}

export function groupMemberProjectionNotFound(
  groupId: string,
  memberUserId: string
) {
  return appError({
    code: "group_member_projection_not_found",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "The approved member profile no longer exists.",
    recoverable: true,
    retryable: false,
    evidence: { groupId, memberUserId },
    nextAction: "refresh"
  });
}
