import { appError } from "../../shared/http/app-error.js";

export function eventNotFound(lifePostId: string) {
  return appError({
    code: "event_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Event not found.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "refresh"
  });
}

export function eventNotOpen(message: string, lifePostId: string) {
  return appError({
    code: "event_not_open",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message,
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "refresh"
  });
}

export function eventPartySizeInvalid(
  lifePostId: string,
  maxPartySize: number
) {
  return appError({
    code: "event_party_size_invalid",
    category: "validation_error",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Party size exceeds the event limit.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, maxPartySize },
    nextAction: "review_request"
  });
}

export function eventCapacityFull(
  lifePostId: string,
  evidence: {
    capacity: number;
    registeredCount: number;
    requestedPartySize: number;
  }
) {
  return appError({
    code: "event_capacity_full",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Event registration is full.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, ...evidence },
    nextAction: "refresh"
  });
}

export function registrationNotFound(
  lifePostId: string,
  registrationId?: string
) {
  return appError({
    code: "registration_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Event registration not found.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, registrationId },
    nextAction: "refresh"
  });
}

export function checkInNotAllowed(
  lifePostId: string,
  registrationId: string
) {
  return appError({
    code: "check_in_not_allowed",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Checked-in registrations cannot be edited by members.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, registrationId },
    nextAction: "refresh"
  });
}

export function checkInOutsideWindow(
  lifePostId: string,
  registrationId: string,
  reason: "before_window" | "after_window"
) {
  return appError({
    code: "check_in_not_allowed",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Event check-in is not open at this time.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId, registrationId, reason },
    nextAction: "refresh"
  });
}

export function eventCheckInCodeInvalid() {
  return appError({
    code: "event_check_in_code_invalid",
    category: "validation_error",
    sourceLayer: "feature",
    statusCode: 400,
    message: "Event check-in QR code is invalid.",
    recoverable: true,
    retryable: false,
    nextAction: "scan_again"
  });
}

export function eventCheckInCodeExpired(lifePostId: string) {
  return appError({
    code: "event_check_in_code_expired",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Event check-in QR code has expired.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "ask_leader"
  });
}

export function eventCheckInCodeDisabled(lifePostId: string) {
  return appError({
    code: "event_check_in_code_disabled",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Event check-in QR code has been disabled.",
    recoverable: true,
    retryable: false,
    evidence: { lifePostId },
    nextAction: "ask_leader"
  });
}
