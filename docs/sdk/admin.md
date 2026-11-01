# Admin SDK

This document covers admin Web API helper structure and admin-facing SDK rules.

## Primary Files

- Core API client: `apps/admin_web/src/core/api/client.ts`
- API helpers: `apps/admin_web/src/core/api/`
- Auth storage: `apps/admin_web/src/core/auth/auth_storage.ts`
- Admin pages: `apps/admin_web/src/features/`

## SDK Rules

- Feature pages call typed helpers under `core/api`.
- Feature pages should not call `fetch` directly.
- Access token refresh belongs in `ApiClient`.
- API helpers must use `ApiClient` schema helpers (`getData`, `postData`,
  `patchData`, `deleteData`, `uploadBinaryData`) with schemas from
  `@mbc/api-contracts`.
- Use `getDataEnvelope` only when the helper needs validated `data` plus
  response `meta`, such as cursor compatibility.
- Binary uploads use `uploadBinaryData` unless the caller intentionally needs a
  raw envelope.
- Downloads use `getBlob`.
- Delete acknowledgement responses must be validated with
  `deletedResponseSchema`.
- Admin auth refresh is parsed in `ApiClient` with
  `adminRefreshTokenResponseSchema` before updating local storage.
- Concurrent authenticated requests that receive `401` share one in-flight
  refresh operation. This is required because the Backend rotates the refresh
  token; parallel refresh calls must not replay and revoke the same token family.
  After that operation settles, a later `401` may start a new refresh attempt.
- A successful refresh updates one validated local session snapshot, notifies the
  canonical Pinia auth store, and clears role-scoped query cache through the store
  subscription. Auth storage changes from another browser tab follow the same
  Core-owned synchronization path. Pages and Feature API helpers must not own
  refresh or cross-tab listeners.
- Query cache scope includes the access token, authenticated user id, and normalized
  permission set. A role or permission change clears cached projections even when
  the backend keeps the current access token valid.
- Feature pages must never parse response envelopes or own contract fallback
  logic.
- List/filter input types should derive from `packages/api_contracts` query
  types. Admin Web may add a narrow UI-only empty-string value for "all" select
  controls, but it must not redefine backend query fields from scratch.

## Feature Areas

- Sermons: `apps/admin_web/src/core/api/sermons.ts`
- Life posts and event registration: `apps/admin_web/src/core/api/life_posts.ts`
- Giving: `apps/admin_web/src/core/api/giving.ts`
- Prayer: `apps/admin_web/src/core/api/prayer_requests.ts`
- Groups: `apps/admin_web/src/core/api/groups.ts`
- Courses: `apps/admin_web/src/core/api/courses.ts`
- Serving: `apps/admin_web/src/core/api/serving.ts`
- People and care: `apps/admin_web/src/core/api/members.ts`,
  `apps/admin_web/src/core/api/care.ts`
- Analytics: `apps/admin_web/src/core/api/dashboard.ts`
- Notifications: `apps/admin_web/src/core/api/notifications.ts`
- Members: `apps/admin_web/src/core/api/members.ts`
- Users and roles: `apps/admin_web/src/core/api/admin_users.ts`
- Jobs: `apps/admin_web/src/core/api/jobs.ts`
- Audit logs: `apps/admin_web/src/core/api/audit_logs.ts`
  - The helper returns the typed audit page (`items` plus `nextCursor`) and
    accepts the backend-issued composite cursor. Callers keep editable filters
    separate from the applied query and must not synthesize older records.
- Settings: `apps/admin_web/src/core/api/settings.ts`
  - `public_landing` category owns public website identity, navigation,
    new-friend links, recurring schedules, public people profiles, contact
    links, social media, map links, App download actions, and events section
    copy. Event records remain owned by the Life feature.
  - Recurring schedules, public people profiles, and events section copy use
    typed structured editors. Other settings retain the advanced JSON editor;
    both paths save through the same Settings API and backend contract.
- AI management: `apps/admin_web/src/core/api/ai.ts`
  - Provider updates omit a blank API key so the backend preserves the existing
    encrypted credential; management responses expose only configuration state
    and the final four characters.
  - Provider, policy, and Token-limit forms submit immutable command snapshots;
    overview refreshes must not replace unsaved editor state.
- Content localization: `apps/admin_web/src/core/api/content_localizations.ts`
  - Hand-written translations and auto-translation use the same typed client boundary.
  - Clients must send the source `revision` and must refresh after a conflict.

## Documentation Linkage

If admin SDK behavior changes, update:

- `docs/sdk/admin.md`
- The feature-specific SDK doc
- `docs/api.md`
- `docs/operations.md` if operator workflow changes
