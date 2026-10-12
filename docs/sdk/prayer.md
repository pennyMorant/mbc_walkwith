# Prayer SDK

This document covers prayer request submission and prayer request feeds.

## Mobile Files

- Domain: `apps/mobile/lib/features/life/domain/prayer_request.dart`
- DTO: `apps/mobile/lib/features/life/data/dto/prayer_request_dto.dart`
- Repository: `apps/mobile/lib/features/life/data/prayer_repository.dart`
- Request sheet: `apps/mobile/lib/features/life/presentation/widgets/prayer_request_sheet.dart`
- Request card: `apps/mobile/lib/features/life/presentation/widgets/prayer_request_card.dart`

## Backend and Contracts

- Contracts: `packages/api_contracts/src/prayer.ts`
- Backend module: `backend/src/modules/prayer/`
- Admin Web page: `apps/admin_web/src/features/prayer/pages/PrayerPage.vue`
- Admin API helper: `apps/admin_web/src/core/api/prayer_requests.ts`
- Atomic approve contract:
  `adminPrayerRequestApproveRequestSchema` in
  `packages/api_contracts/src/prayer.ts`

## SDK Rules

- Public prayer requests can be visible without login.
- Member requests require `MemberSession`.
- Visibility and moderation status are backend-owned.
- Member shared group feeds use the backend member profile group. The mobile App
  must not decide or expand group visibility by passing `groupId`.
- UI should not expose private or unapproved requests unless backend returned them for that member.
- Submission errors should be shown clearly.
- Prayer response envelopes and DTOs are strict. Missing identifiers, unknown
  status/visibility, invalid timestamps, or inconsistent group scope must fail
  visibly; the repository must not turn malformed sensitive data into an empty
  feed or epoch timestamps.
- Member own/shared responses are two views of one backend source of truth. If
  moderation changes between the two requests, dedupe by id keeps the record
  with the latest `updatedAt`, then sorts the merged feed by `createdAt` newest
  first.
- Admin approve submits the final visibility, optional group scope, moderation
  note, and notification intent together. Notification delivery reads the
  canonical record returned by that moderation update.
- Admin Web state orchestration lives in
  `apps/admin_web/src/features/prayer/composables/use_prayer_page.ts`.
  Components own only filters, drawer, confirmation, and presentation state;
  all transport stays in `core/api/prayer_requests.ts`.
- The Admin editor does not expose a generic status select. Save updates scope
  and moderation detail, while Approve, Hide, and Archive are explicit intents.
  Permanent deletion requires a confirmation dialog.
- Empty Admin PATCH bodies are rejected. Visibility and group-scope changes are
  moderation events and update canonical moderator metadata.

## Documentation Linkage

If prayer SDK behavior changes, update:

- `docs/sdk/prayer.md`
- `docs/api.md`
- `docs/privacy_security.md` when visibility or privacy rules change
