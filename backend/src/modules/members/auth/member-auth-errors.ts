import { appError } from "../../../shared/http/app-error.js";

export function memberAuthRequired() {
  return appError({
    code: "member_auth_required",
    category: "authentication_required",
    sourceLayer: "surface",
    statusCode: 401,
    message: "Member authentication is required.",
    recoverable: true,
    retryable: false,
    nextAction: "sign_in"
  });
}

export function memberLoginCodeInvalid() {
  return memberUnauthorized(
    "member_login_code_invalid",
    "Invalid or expired login code."
  );
}

export function memberCredentialsInvalid() {
  return memberUnauthorized(
    "member_credentials_invalid",
    "Invalid member email or password."
  );
}

export function memberSessionInvalid(message: string, reason: string) {
  return memberUnauthorized("member_session_invalid", message, { reason });
}

export function memberAccountInactive() {
  return memberUnauthorized(
    "member_account_inactive",
    "Member account is not active."
  );
}

export function memberRegistrationClosed(mode: string) {
  return appError({
    code: "member_registration_closed",
    category: "permission_denied",
    sourceLayer: "feature",
    statusCode: 403,
    message: "Member registration is not open.",
    recoverable: true,
    retryable: false,
    evidence: { mode },
    nextAction: "contact_admin"
  });
}

export function memberEmailVerificationUnavailable() {
  return appError({
    code: "member_email_verification_unavailable",
    category: "configuration_missing",
    sourceLayer: "capability",
    statusCode: 503,
    message: "Email verification is not configured.",
    recoverable: true,
    retryable: false,
    nextAction: "contact_admin"
  });
}

export function memberFirebaseAuthUnavailable() {
  return appError({
    code: "member_firebase_auth_unavailable",
    category: "configuration_missing",
    sourceLayer: "capability",
    statusCode: 503,
    message: "Google and Apple sign-in are not configured.",
    recoverable: true,
    retryable: false,
    nextAction: "use_password_or_contact_admin"
  });
}

export function memberFirebaseTokenInvalid(reason: string) {
  return appError({
    code: "member_firebase_token_invalid",
    category: "authentication_required",
    sourceLayer: "capability",
    statusCode: 401,
    message: "The Google or Apple sign-in could not be verified.",
    recoverable: true,
    retryable: false,
    evidence: { reason },
    nextAction: "sign_in"
  });
}

export function memberFirebaseProviderUnavailable(reason: string) {
  return appError({
    code: "member_firebase_provider_unavailable",
    category: "external_dependency_failed",
    sourceLayer: "external",
    statusCode: 503,
    message: "Google or Apple sign-in is temporarily unavailable.",
    recoverable: true,
    retryable: true,
    evidence: { reason },
    nextAction: "retry_or_use_password"
  });
}

export function memberAuthRateLimitExceeded(
  evidence: Record<string, unknown>
) {
  return appError({
    code: "member_auth_rate_limit_exceeded",
    category: "retry_exhausted",
    sourceLayer: "surface",
    statusCode: 429,
    message: "Too many authentication attempts.",
    recoverable: true,
    retryable: true,
    evidence,
    nextAction: "retry_after_delay"
  });
}

export function memberFirebaseIdentityConflict() {
  return appError({
    code: "member_firebase_identity_conflict",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "This sign-in identity cannot be linked automatically.",
    recoverable: true,
    retryable: false,
    evidence: {},
    nextAction: "contact_admin"
  });
}

export function memberEmailConflict(email: string) {
  return appError({
    code: "member_email_conflict",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Member email already exists.",
    recoverable: true,
    retryable: false,
    evidence: { email },
    nextAction: "review_request"
  });
}

export function memberRegistrationUnavailable() {
  return appError({
    code: "member_registration_unavailable",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Member registration could not be completed.",
    recoverable: true,
    retryable: false,
    evidence: {},
    nextAction: "sign_in_or_contact_admin"
  });
}

function memberUnauthorized(
  code: string,
  message: string,
  evidence: Record<string, unknown> = {}
) {
  return appError({
    code,
    category: "authentication_required",
    sourceLayer: "feature",
    statusCode: 401,
    message,
    recoverable: true,
    retryable: false,
    evidence,
    nextAction: "sign_in"
  });
}
