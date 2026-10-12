# Backend Release Checklist

Status: current staging checklist
Audience: backend, admin web, mobile integration, release owner

This checklist answers one question:

> Is the backend ready for staging or production use?

It covers the full backend scope, not just the mobile app. Current product-wide
closure gates are summarized in [closure_validation_plan_zh.md](closure_validation_plan_zh.md).

## 1. Readiness Levels

Use these status labels:

- `ready`: implemented and acceptable for staged or production use
- `partial`: implemented but still missing required production safeguards
- `planned`: documented or scaffolded but not production-ready
- `environment-gated`: implemented in code, but must be verified with real
  staging secrets, provider credentials, a real database, or a real device

## 2. Current Snapshot

### Core Platform

- Health endpoint: `ready`
- Postgres migrations and schema: `ready`
- Shared response/error envelope: `ready`
- Admin auth and RBAC: `ready`
- Audit logging foundation: `ready`
- Historical job diagnostics: `ready`
- Production env validation completeness: `partial`

### Sermons

- Public sermon list/detail/audio API: `ready`
- Admin sermon CRUD/review/publish flow: `ready`
- Church-recorded sermon audio upload: `ready`
- Local/S3 sermon audio storage: `ready`
- Local sermon package import for transcript/outline/scripture references: `ready`
- Push fanout on sermon publish: `ready`
- Default local sermon processing path: `ready`

### Members and Auth

- Member session JWT flow: `ready`
- Email verification code challenge contract: `ready`
- Session revocation/logout: `ready`
- Device push token registration: `ready`
- Real email delivery provider: `partial`
- Rate limiting and resend enforcement: `partial`

### Prayer

- Public/member/admin prayer request flows: `ready`
- Visibility and moderation model: `ready`
- Pastoral/admin workflow: `ready`
- Production privacy review and retention policy: `partial`

### Giving

- Member giving history and statement listing: `ready`
- Admin giving list/export/generate endpoints: `ready`
- Stripe Checkout session creation adapter: `environment-gated`
- Stripe webhook signature verification and normalized event ingestion: `environment-gated`
- Provider event idempotency, failed-event replay, fee, net, refund, dispute,
  payout, and reconciliation state: `ready`
- Statement CSV export flow: `ready`
- Statement PDF payload generation and mobile temporary-file sharing: `ready`
- Statement signed object-storage URL delivery: `planned`

### Notifications

- FCM token storage and preference sync: `ready`
- Push send abstraction and FCM HTTP v1 provider: `environment-gated`
- Sermon published push: `ready`
- Life post / weekly bulletin push with admin `notifyApp`: `ready`
- Prayer update push with admin `notifyApp`: `ready`
- Operational delivery monitoring: `partial`

### Study Backend

- Public Bible text API: `planned`
- Study note/highlight/bookmark sync API: `planned`
- Study AI backend endpoint: `ready`
- AI provider runtime configuration: `environment-gated`

## 3. Release Gates

These are the minimum gates before calling the backend production-ready.

### Gate A: Core Runtime

- `DATABASE_URL` configured
- `USE_MOCK_DATA=false`
- `bun run db:migrate` succeeds
- `bun run check` succeeds
- API runs as the only backend service process
- `/v1/health` reports the expected mode and `databaseReady=true`

### Gate B: Secrets and Identity

- `auth_secret` rotated from dev default
- `app_user_auth_secret` rotated from dev default
- dev admin bootstrap disabled or constrained for production
- admin accounts created intentionally

### Gate C: Sermon Processing

- `MEDIA_STORAGE_DRIVER` chosen and tested
- upload directory or S3 bucket permissions verified
- sermon audio import/upload works end-to-end
- reviewed local package import works end-to-end
- local workstation processing is documented for the content team

### Gate D: Giving Provider

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` configured with test or
  production values
- checkout session opens Stripe Checkout from the mobile App
- webhook signature is verified from Stripe CLI or a real Stripe endpoint
- duplicate webhook event is acknowledged as duplicate
- failed provider event can be inspected and replayed
- fee, net, refund, dispute, payout, and reconciliation fields are visible in
  Admin Giving
- member annual statement download includes PDF payload and excludes unrelated
  member gifts

### Gate E: Member Auth

- member email code contract uses `challengeId`
- verification codes are hashed at rest
- real email sender exists for production
- resend and brute-force rate limits enforced
- auth endpoints monitored for abuse
- `FIREBASE_SERVICE_ACCOUNT_JSON` configured, or the same Firebase project
  credential is supplied through `FCM_SERVICE_ACCOUNT_JSON`
- Google and Apple providers enabled in Firebase Auth; verified provider tokens
  create or link exactly one backend member and receive an MBCG session
- placeholder `apps/mobile/lib/firebase_options.dart` replaced by the generated
  FlutterFire options for both package IDs
- Android signing SHA values and `GOOGLE_SERVER_CLIENT_ID` configured; iOS
  Google reversed-client URL scheme and Sign in with Apple capability verified

### Gate F: Push Notifications

- `FCM_SERVICE_ACCOUNT_JSON` configured on backend
- mobile projects configured with FlutterFire
- APNs key uploaded in Firebase
- iOS push capabilities enabled
- at least one real device receives a sermon published push in staging
- one Life post publish with `notifyApp=true` creates inbox items and push tasks
- one prayer approval with `notifyApp=true` creates generic member-safe
  notification content

### Gate G: AI Provider

- `AI_PROVIDER`, `AI_API_KEY`, and model env values configured
- Admin AI status endpoint reports configured provider
- Admin content draft request returns a usable draft
- Member AI study endpoint returns sourced response text
- disabled/misconfigured provider errors remain structured and user-safe

### Gate H: Sensitive Workflows

- audit logs confirmed for:
  - sermon publish
  - prayer moderation
  - giving exports
  - statement generation
- private endpoints checked for auth enforcement
- no secrets or private content leak into logs

## 4. Module-by-Module Checklist

### 4.1 Sermons

Must be true:

- Admin creates local sermon drafts
- Admin upload/import audio works
- Transcript comes from reviewed local package import
- Outline comes from reviewed local package import
- Scripture references come from reviewed local package import
- Review status transitions work:
  - `draft`
  - `needs_review`
  - `published`
  - `archived`
  - `failed`
- Public API only exposes `published` sermons
- Range audio streaming works

Production cautions:

- storage lifecycle and cleanup policy should be defined
- notification send failures should be observable in logs or metrics

### 4.2 Member Auth

Must be true:

- `POST /v1/member/auth/login` returns a member session for valid email/password
- `POST /v1/member/auth/register` respects backend registration settings
- `POST /v1/member/auth/verify-code` accepts registration `challengeId + code`
- `GET /v1/member/auth/me` restores current member
- `POST /v1/member/auth/logout` revokes current session

Still missing for full production confidence:

- SMTP or provider-backed email delivery
- rate limiting by IP/email
- challenge attempt counters
- resend cooldown enforcement in backend, not just contract

### 4.3 Notifications

Must be true:

- member device token upsert/revoke endpoints work
- member notification preference patch works
- FCM provider can authenticate with service account
- invalid tokens are revoked
- sermon publish trigger fans out only to opted-in active members

Still missing for stronger production operations:

- delivery dashboards or metrics
- richer deep-link payload routing

### 4.4 Prayer

Must be true:

- default visibility is conservative
- moderation endpoints work
- admin review is RBAC protected
- public/member views respect status and visibility

Still missing:

- explicit retention/archive policy approved by leadership

### 4.5 Giving

Current state:

- Stripe Checkout adapter exists
- Stripe webhook normalization and signature verification exist
- provider event idempotency, replay, refund, dispute, fee, net, payout, and
  reconciliation behavior are covered by backend tests
- reporting and export surfaces exist
- statement generation exists at service level
- CSV export works
- PDF payload export works and the mobile App writes it to a temporary file for
  share/open

Environment-gated before staging/production:

- Stripe test or production secrets must be configured
- webhook signature must be verified from Stripe CLI or provider endpoint
- checkout return flow must be tested from the mobile App
- statement signed URL delivery is still planned if annual statements move from
  API payload export to object storage

Conclusion:

- giving code path is staging-ready
- giving provider closure requires real Stripe test credentials and webhook
  delivery

### 4.6 Study

Current state:

- no full backend study API module for Bible text or study sync
- current Bible reading experience is mobile/local-first by design
- AI study backend endpoint exists, but provider runtime is environment-gated

Conclusion:

- local Bible reading/TTS is App-ready
- Bible text sync and note/highlight/bookmark backend sync are not in the
  current production scope

## 5. Operational Checks

Before each release candidate:

- run `bun run check`
- run `bun run db:smoke` in Postgres mode
- run one sermon through import -> audio -> local package -> publish
- verify Admin Jobs media readiness panel
- verify one push notification on a real device
- verify admin login, member login, and logout
- verify one Stripe test checkout and signed webhook
- verify one annual statement PDF download/share from the mobile App
- verify one AI provider request if AI is enabled for the environment

## 6. Recommended Next Priorities

If the goal is a real staged backend, do these next:

1. Run Postgres `db:smoke` on the staging database.
2. Configure Stripe test credentials and verify checkout/webhook/idempotency.
3. Configure Firebase/FCM and run real-device push validation.
4. Configure AI provider keys only if AI is enabled for the staging demo.
5. Add real email delivery and backend resend/brute-force limits for member
   auth.

If the goal is full production scope, do these after:

1. Approve donation, privacy, retention, and annual statement policies with
   church leadership.
2. Decide whether annual statements should remain API payload exports or move
   to object storage signed URL delivery.
3. Build Bible text sync and note/highlight/bookmark backend APIs if cloud sync
   becomes a product requirement.
4. Add delivery dashboards/metrics for notification operations.

## 7. Practical Verdict

Current practical verdict:

- Sermon backend: `ready for staging`, `partial for production`
- Member auth backend: `partial`
- Push backend: `environment-gated for staging`, `partial for production`
- Prayer backend: `ready for staging`, `partial for production`
- Giving backend: `environment-gated for staging`, `partial for production`
- Study backend: `App local-first ready`; backend sync remains planned

Overall backend verdict:

- Code paths are broad enough for staging/demo closure.
- Production closure depends on real provider configuration, policy approval,
  Postgres smoke, real-device App checks, and a few optional future sync/provider
  hardening items.
