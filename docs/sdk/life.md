# Life SDK

This document covers church life content, weekly bulletin cards, event registration, life publishing read-side behavior, prayer entry points, and giving entry points that appear inside the Life tab.

## Mobile Files

- Domain: `apps/mobile/lib/features/life/domain/life_post.dart`
- List request: `apps/mobile/lib/features/life/domain/life_post_list_request.dart`
- DTO: `apps/mobile/lib/features/life/data/dto/life_post_dto.dart`
- Repository: `apps/mobile/lib/features/life/data/life_repository.dart`
- Remote API: `apps/mobile/lib/features/life/data/remote/api_life_remote_data_source.dart`
- Offline mock API, only when `USE_MOCK_REMOTE_DATA=true`:
  `apps/mobile/lib/features/life/data/remote/mock_life_remote_data_source.dart`
- UI: `apps/mobile/lib/features/life/presentation/life_tab.dart`
- Detail UI: `apps/mobile/lib/features/life/presentation/life_post_detail_page.dart`
- QR check-in UI: `apps/mobile/lib/features/life/presentation/event_check_in_scan_page.dart`

## Backend and Contracts

- Contracts: `packages/api_contracts/src/life.ts`
- Member routes: `backend/src/modules/life/life.routes.ts`
- Admin routes: `backend/src/modules/admin/life-posts/admin-life-posts.routes.ts`
- Service: `backend/src/modules/life/life-post.service.ts`
- Repositories: `backend/src/modules/life/*life-post.repository.ts`

## Event Registration SDK

Mobile repository methods:

- `getLifePosts`
- `getLifePostById`
- `markLifePostRead`
- `registerForEvent`
- `updateEventRegistration`
- `cancelEventRegistration`
- `checkInEventRegistration`
- `checkInEventRegistrationWithCode`

Rules:

- Public users can see public life content.
- Member session should be passed when loading member-visible content.
- Registration state comes from `registrationSummary`.
- UI should treat `myRegistrationStatus` as the source of truth.
- App domain uses typed registration status and check-in method values; unknown
  wire values, malformed dates, negative counts, and inconsistent summary state
  are contract failures instead of being converted to an unregistered state.
- Member read state comes from backend `isRead` and `readAt`; the App must not
  derive unread badges from local cache.
- Opening a member-visible detail may call `markLifePostRead`, which writes
  `readAt` on the backend and returns the fresh life post.
- Onsite check-in is an App scan intent; backend validates the QR payload or
  short code, writes `myCheckedInAt`, and sets `myCheckInMethod` to `onsite_qr`.
- Direct self check-in routes are not the primary App UI flow for onsite events.
- Checked-in registrations cannot be edited by members.
- Capacity and deadline enforcement belongs on the backend.
- Detail fetches must treat backend 404, `event_not_found`, or `life_post_not_found` as authoritative: delete local cached detail and return empty rather than exposing stale hidden or archived content.
- Network-only detail failures may fall back to cached content after local visibility checks.
- Persistent SQLite life cache stores content only and never stores
  member-specific registration state. Canonical member responses are retained
  in a process-memory cache partitioned by member ID, so a refresh failure after
  register/update/cancel/check-in can reuse the latest response without exposing
  it to another signed-in member.
- DTO/envelope contract failures never use offline fallback. A malformed 200
  response must remain visible as a data-contract failure.

## Life Publishing SDK

Admin Web notification translation method:

- `translateLifePostNotification`

Rules:

- The request is available only while the Life post is still a pre-publication
  draft or review item.
- The Life feature owns the post status check and notification copy; the shared
  AI capability owns provider selection, Token limits, and audit usage records.
- Generated notification copy is an editor draft. The admin must still review
  it before including it in a publish request.

Mobile repository methods should expose published content only:

- `getLifePosts`
- `getLifePostById`
- `markLifePostRead`

Rules:

- App surfaces must treat backend 404 and `life_post_not_found` as authoritative.
- `getLifePosts` accepts `LifePostListRequest` for `limit`, `query`, `type`,
  `from`, and `to`. App UI should pass structured requests instead of building
  route query strings in widgets.
- Life weekly tab requests the selected week. Other Life tabs request the
  selected month. The Sunday/weekly hero loads from the latest visible life
  posts and is not filtered by the currently selected tab period.
- Public life content may be cached; member-only or group-only content must respect visibility rules before use.
- `displayWeight` is backend-owned display ordering metadata. App repositories
  may cache and preserve it for ordered fallback lists, but App UI must not
  render it as a pinned/priority chip.
- Local content cache is not the source of unread state. Cached fallback content
  should not create unread badges.
- Backend compares `readAt` with `updatedAt`; if an admin edits a life post after
  the member read it, member routes return `isRead: false` again.
- Action buttons may deep-link to events, groups, courses, serving, giving, or prayer, but the target feature owns the action result.

## Prayer SDK

Mobile repository:

- `apps/mobile/lib/features/life/data/prayer_repository.dart`

Backend and contract owners:

- Contracts: `packages/api_contracts/src/prayer.ts`
- Member/public routes: `backend/src/modules/prayer/prayer.routes.ts`
- Service: `backend/src/modules/prayer/prayer.service.ts`
- Repositories: `backend/src/modules/prayer/*prayer.repository.ts`

Mobile repository methods:

- `fetchPublicRequests`
- `fetchMemberRequests`
- `submitRequest`

Rules:

- Backend prayer repository is the source of truth for visibility, moderation
  status, author ownership, and group scope.
- Guest App users may submit prayer requests through `POST /prayer-requests`;
  member App users should pass the bearer token to the same endpoint.
- Public requests come from `GET /prayer-requests?limit=20`.
- Member-visible requests combine `GET /member/prayer-requests?limit=20` and
  `GET /member/prayer-requests/shared?limit=20`, then dedupe by request id.
- Prayer DTO parsing rejects malformed envelopes, unsupported state, invalid
  time values, and inconsistent group scope. When own/shared reads race with a
  moderation update, the repository keeps the newest `updatedAt` record and
  sorts the merged feed newest first.
- The App may show private/pending status for the member's own requests, but it
  must not decide whether a request becomes public, members-only, or group-only.
- Private prayer content should not be copied into unrelated local caches.

## Admin Life SDK

Admin Web API helper:

- `apps/admin_web/src/core/api/life_posts.ts`

Admin capabilities:

- Create and edit life posts.
- Set display priority through `displayWeight` presets: normal `0`,
  important `50`, and very important `100`.
- Configure registration settings.
- List registrations with `life_posts:update` because attendee names, emails,
  notes, and check-in state are privacy-sensitive.
- Registration list responses expose canonical `items`, `total`, `limit`, and
  `offset`; clients page through the API instead of slicing one local response.
- Admin filters are draft UI state until applied; changing text must not issue a
  request per keystroke. List and mutation failures remain visible in the
  registration workspace.
- Add manual registration.
- Generate, rotate, and print onsite event check-in QR codes.
- Update registration status, party size, and note.
- Mark checked-in or absent through backend routes, never by mutating tables.
- Export registrations as CSV with check-in timestamp, method, and actor. This
  uses `life_posts:update`, not generic `life_posts:read`, and remains an
  independent unpaginated endpoint. The Admin client downloads the returned
  content with the backend filename instead of treating raw CSV as page content.
- Publish, unpublish, archive, and audit life content.
- Treat Admin `LifePost.revision` as the required optimistic concurrency token.
  Every existing-post content/status/delete command sends it as
  `x-life-post-revision`; stale editors refresh after `life_post_state_changed`
  and never retry old content automatically.
- Publish may include `notifyApp` and optional notification title/body. The admin
  surface owns the user choice; notification delivery owns fanout, dedupe, retry,
  and provider evidence.
- Publish is one command. Unsaved editor content may be included in `content` so
  the backend validates and saves the content and `published` state atomically;
  Admin must not PATCH and then call publish as two commands.
- A publish-only reviewer does not send `content`; Admin presents the canonical
  draft as read-only and publishes only the revision returned by the backend.
- Public/member Life DTOs omit `revision`. Registration and check-in mutations
  are a separate aggregate and do not increment the life-post revision.

Publish request:

```json
{
  "visibility": "public",
  "content": {
    "title": "Friday fellowship",
    "body": "Dinner and prayer this Friday.",
    "ctaLabel": "Open details",
    "ctaUrl": "https://example.com/fellowship"
  },
  "notifyApp": true,
  "notification": {
    "title": "Friday fellowship",
    "body": "Dinner and prayer this Friday."
  }
}
```

Header for an existing post whose latest Admin response has `revision: 3`:

```text
x-life-post-revision: 3
```

## Documentation Linkage

If life SDK behavior changes, update:

- `docs/sdk/life.md`
- `docs/api.md`
- `packages/api_contracts/src/life.ts`
- `docs/product_vision_zh.md` if product behavior changes
