# Auth SDK

This document covers member and admin authentication client boundaries.

## Mobile Member Auth

Primary files:

- `apps/mobile/lib/features/member_auth/data/member_session_repository.dart`
- `apps/mobile/lib/features/member_auth/presentation/`

Current sign-in flow:

1. User enters an email locally and then enters a password on a separate route; the email step never probes the backend.
2. `MemberSessionRepository.login()` calls `POST /v1/member/auth/login`.
3. Backend verifies the member password hash and active member status.
4. Backend returns access token and member profile for active members.
5. `MemberSessionRepository` persists the token and offline profile view in secure storage. A legacy SharedPreferences profile is migrated once and removed.
6. Feature repositories receive `MemberSession?` when they need member context.

Current registration flow:

1. App reads public settings and shows registration only when `member.registrationMode` is `open`. `GET /v1/settings/public` is a backend whitelist for App-safe church, feature, legal, and member registration keys; it must not expose `publicLanding.*` or other Admin-only settings.
2. `MemberSessionRepository.register()` calls `POST /v1/member/auth/register` with email and password. Display name can be completed later in profile.
3. If `member.requireEmailVerification` is true, backend returns a code challenge and the sheet continues to code verification.
4. If email verification is disabled, backend creates the member and password credential immediately, then either returns a signed-in session or a pending-approval profile.
5. Registration settings are owned by backend/admin settings, not by hard-coded App flags.
6. If email verification and admin approval are both enabled, `verifyCode()` returns pending approval after a valid code instead of treating the member as signed in.
7. Direct registration commits member, profile, and password atomically. Verification locks and consumes the challenge in the same transaction that creates the account, so concurrent verification cannot create duplicates.
8. Verification code HMAC comparison and failed-attempt increments also run inside that locked repository transaction. Clients receive the same generic invalid-code error after the limit and cannot infer transaction details.

Firebase federated sign-in:

1. The App authenticates with Google or Apple through Firebase Auth and obtains a short-lived ID token.
2. `MemberSessionRepository.signInWithFirebase()` sends only that token to `POST /v1/member/auth/firebase`.
3. The backend Firebase Admin adapter verifies signature, revocation, `google.com`/`apple.com` provider, and verified email.
4. The auth repository atomically resolves `provider + providerSubject`, links a verified email to an existing member, or creates a member when registration is open.
5. The backend returns its own `MemberAuthSession`; the Firebase credential is never persisted by the App repository.
6. New federated members honor `member.requireAdminApproval`. Existing linked members may sign in while public registration is closed.
7. A second subject for the same member/provider is an identity conflict and must not be auto-merged.
8. `FirebaseAppInitializer` is shared by member auth and push notifications so concurrent features cannot initialize the default Firebase app twice.

Email code rules:

- The App must not use email codes as the normal member login path.
- `verifyCode()` is for registration email verification and must not bypass password login.
- Password hashes stay on the backend. The App never stores or receives password hashes.
- Existing, passwordless, and unknown emails use generic auth failures without email evidence; clients must not branch on account existence.
- Concurrent Admin member create/update email conflicts are normalized by the backend to `member_email_conflict`; Admin clients must not depend on database error text.

Password recovery:

1. `requestPasswordReset()` calls `POST /v1/member/auth/password-reset/request` and receives an opaque challenge.
2. The backend returns the same public response shape for every valid email input; it only delivers email for active accounts with a password credential.
3. `confirmPasswordReset()` calls `POST /v1/member/auth/password-reset/confirm` with the challenge, code and new password.
4. The backend atomically consumes the challenge, updates the password hash and revokes all prior member sessions.

Self profile updates:

- `MemberSessionRepository.updateProfile()` is the only App SDK owner for `PATCH /v1/member/profile`.
- The App may update display name, phone, address, faith/baptism years, joined-church date, emergency contact, and locale.
- The App must not update roles, status, finance permissions, group ownership, or admin-only notes.

Rules:

- Do not call member endpoints directly from UI.
- Do not store member tokens outside `MemberSessionRepository`.
- Do not store member profile JSON in SharedPreferences. A cached profile is only a temporary secure fallback for network/provider failures.
- `restoreSession()` clears token and profile for authentication, permission, invalid-session, or inactive-member errors. It may use the secure cached view only for transient API failures.
- Missing or malformed required response fields are contract failures, not empty successful sessions.
- Guest mode must remain possible for public content.
- Member-only SDK calls should accept `MemberSession` explicitly.
- App registration UI must reflect backend settings and should not bypass closed or admin-only registration.
- Google/Apple buttons must use the shared federated-auth controller; UI must not call Firebase or `/member/auth/firebase` directly.
- App input fields for auth/profile must use filled hint-only fields; do not use floating labels.

## Admin Auth

Primary files:

- `apps/admin_web/src/core/api/client.ts`
- `apps/admin_web/src/core/auth/auth_storage.ts`
- Admin auth API helpers under `apps/admin_web/src/core/api/`

Rules:

- Admin pages use `core/api` helpers.
- Token refresh belongs in `ApiClient`.
- Permissions should be read from admin auth state, not hard-coded in pages.
