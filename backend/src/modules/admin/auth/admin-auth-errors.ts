import type { AdminPermission } from "@mbc/api-contracts";

import { appError } from "../../../shared/http/app-error.js";

export function adminAuthRequired() {
  return appError({
    code: "admin_auth_required",
    category: "authentication_required",
    sourceLayer: "surface",
    statusCode: 401,
    message: "Admin authentication is required.",
    recoverable: true,
    retryable: false,
    nextAction: "sign_in"
  });
}

export function adminPermissionDenied(permission: AdminPermission) {
  return appError({
    code: "admin_permission_denied",
    category: "permission_denied",
    sourceLayer: "surface",
    statusCode: 403,
    message: "Admin permission is required.",
    recoverable: true,
    retryable: false,
    evidence: { permission },
    nextAction: "request_permission"
  });
}

export function adminRefreshTokenRequired() {
  return appError({
    code: "admin_refresh_token_required",
    category: "authentication_required",
    sourceLayer: "surface",
    statusCode: 401,
    message: "Admin refresh token is required.",
    recoverable: true,
    retryable: false,
    nextAction: "sign_in"
  });
}

export function adminCredentialsInvalid() {
  return adminUnauthorized(
    "admin_credentials_invalid",
    "Invalid admin credentials."
  );
}

export function adminCurrentPasswordInvalid() {
  return adminUnauthorized(
    "admin_current_password_invalid",
    "Current password is incorrect."
  );
}

export function adminRefreshTokenInvalid(reason: string, message: string) {
  return adminUnauthorized("admin_refresh_token_invalid", message, { reason });
}

export function adminSessionInvalid(message: string, reason: string) {
  return adminUnauthorized("admin_session_invalid", message, { reason });
}

export function adminUserInactive() {
  return adminUnauthorized("admin_user_inactive", "Admin user is inactive.");
}

export function adminUserEmailConflict(email: string) {
  return appError({
    code: "admin_user_email_conflict",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Admin user email already exists.",
    recoverable: true,
    retryable: false,
    evidence: { email },
    nextAction: "review_request"
  });
}

function adminUnauthorized(
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
