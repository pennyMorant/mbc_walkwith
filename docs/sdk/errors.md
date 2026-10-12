# Errors and Transport SDK

This document defines shared client transport behavior for mobile and admin Web.

## Mobile Transport

Primary files:

- `apps/mobile/lib/core/api/api_client.dart`
- `apps/mobile/lib/core/api/api_error.dart`
- `apps/mobile/lib/core/config/app_config.dart`

Rules:

- `ApiClient` owns Dio configuration.
- Every request sends `x-request-id`.
- JSON object responses are expected for normal API calls.
- Network and server errors are converted to `ApiError`.
- Authenticated member calls use bearer token helpers.
- UI should display user-safe error messages from `ApiError.message`.

## Admin Transport

Primary file:

- `apps/admin_web/src/core/api/client.ts`

Rules:

- Admin requests use `ApiClient`.
- Access tokens are loaded from admin auth storage.
- A `401` triggers refresh through `/admin/auth/refresh`.
- If refresh fails, stored admin auth state is cleared.
- Feature pages should not duplicate token refresh logic.

## Error Handling Rules

- Preserve backend error messages when they are safe and intentional.
- Preserve structured backend error fields: `code`, `category`, `sourceLayer`, `recoverable`, `retryable`, `evidence`, and `nextAction`.
- Do not swallow errors silently in repositories.
- UI may show a snackbar, inline state, or fallback view depending on context.
- Retried operations must be idempotent or explicitly safe.
- Payment, giving, statement, and registration errors must not be masked as generic success states.

## Structured Error Contract

Backend error envelopes follow `packages/api_contracts/src/envelope.ts`.

Mobile maps backend failures to `ApiError`:

- `message` is safe display text.
- `code` is the stable backend error code.
- `category` is the high-level recovery category.
- `sourceLayer` identifies surface, feature, domain, capability, repository, external, or unknown.
- `recoverable` and `retryable` guide UI actions.
- `evidence` carries diagnostic metadata such as request id.
- `nextAction` suggests refresh, retry, sign in, permission review, or request correction.
- Shared helpers such as `isNotFound`, `isAuthenticationRequired`,
  `isPermissionDenied`, `isValidationFailure`, `isStateConflict`,
  `isConfigurationMissing`, `isCapabilityFailure`, and `hasCode(...)`
  centralize repository and feature branching.

Admin Web maps backend failures to `ApiRequestError` with the same structured fields.
Shared helpers such as `isNotFound`, `isAuthenticationRequired`,
`isPermissionDenied`, `isValidationFailure`, `isStateConflict`,
`isConfigurationMissing`, `isCapabilityFailure`, `hasCode(...)`, and
`formatApiErrorMessage(...)` live in `apps/admin_web/src/core/api/api_errors.ts`.

Feature pages may adapt copy, but they must not discard the structured error.

## Stable Auth Error Codes

Admin auth:

- `admin_auth_required`: admin bearer token is missing or malformed.
- `admin_permission_denied`: signed-in admin does not have the required permission.
- `admin_refresh_token_required`: refresh endpoint was called without a refresh token.
- `admin_credentials_invalid`: admin email/password login failed.
- `admin_current_password_invalid`: change-password current password check failed.
- `admin_refresh_token_invalid`: refresh token is missing from the server store,
  revoked, reused, or expired. Inspect `evidence.reason`.
- `admin_session_invalid`: admin access token is invalid, expired, or revoked.
- `admin_user_inactive`: admin user is disabled or no longer active.
- `admin_user_email_conflict`: admin user email already exists.

Member auth:

- `member_auth_required`: member bearer token is missing or malformed.
- `member_login_code_invalid`: registration email verification code is invalid, consumed, expired, or mismatched.
- `member_session_invalid`: member access token is invalid, expired, or revoked.
- `member_account_inactive`: member account is disabled or no longer active.
- `member_email_conflict`: member email already exists.

Clients should use `category` and `nextAction` for generic recovery behavior,
and use these stable codes only when a feature needs more specific copy or
branching.
