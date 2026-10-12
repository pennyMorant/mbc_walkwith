# SDK Documentation

This is the entry point for MBC WalkWith client SDK documentation. In this repository, "SDK" means the app-facing and admin-facing client layer that sits between UI code and backend APIs:

- Flutter mobile: `ApiClient`, feature repositories, DTOs, remote/local data sources.
- Admin Web: `apps/admin_web/src/core/api/*` API clients.
- Shared contracts: `packages/api_contracts`.

Do not put every SDK detail in this file. Keep this file as the table of contents and shared rules. Feature-specific SDK documentation belongs under `docs/sdk/`.

## Reading Order

1. Read this file first.
2. Read the feature file related to your change.
3. Cross-check the API contract in `docs/api.md` and `packages/api_contracts`.
4. Cross-check implementation in mobile/admin repositories and backend routes.

When a task adds, deletes, or moves a backend route, also check the route
coverage registry:

```sh
bun run check:contracts
```

When a task touches mobile presentation code or admin feature surfaces, also run
the SDK boundary check when practical:

```sh
bun run check:sdk-boundaries
```

## Feature Documents

- [Auth SDK](sdk/auth.md)
- [Life SDK](sdk/life.md)
- [Sermons SDK](sdk/sermons.md)
- [Bible SDK](sdk/bible.md)
- [Giving SDK](sdk/giving.md)
- [Prayer SDK](sdk/prayer.md)
- [Notifications SDK](sdk/notifications.md)
- [Ministry SDK](sdk/ministry.md)
- [People SDK](sdk/people.md)
- [Analytics SDK](sdk/analytics.md)
- [Admin SDK](sdk/admin.md)
- [AI SDK](sdk/ai.md)
- [Growth SDK](sdk/growth.md)
- [Errors and Transport](sdk/errors.md)

## Shared Client Rules

1. UI code should not call raw HTTP directly.
   - Flutter UI calls repositories/providers.
   - Admin Web pages call typed API helpers under `core/api`.

2. Backend response shapes must come from shared contracts where practical.
   - Add or update schemas in `packages/api_contracts`.
   - In backend route tests, parse `response.json().data` through the shared
     response schema via `backend/tests/contract_assertions.ts` before making
     field-level assertions.
   - Keep DTO parsing explicit in Flutter.
   - Keep admin API parsing inside `ApiClient` schema helpers and typed
     helpers under `apps/admin_web/src/core/api`.

3. Authenticated mobile requests must pass `MemberSession`.
   - Use bearer token helpers on `ApiClient`.
   - Do not store tokens outside `MemberSessionRepository`.

4. Admin requests use the admin API client.
   - Admin token refresh is handled in `apps/admin_web/src/core/api/client.ts`.
   - Feature pages should not implement refresh logic.
   - Feature pages should not parse response envelopes or call raw `fetch`.

5. Feature SDK docs must stay small.
   - Put only one functional area in each file.
   - If a file grows too large, split into sub-feature docs and link them here.

6. Stage two SDK areas map to the core feature set.
   - Sermon discovery extends the Sermons SDK.
   - Church life publishing and event registration stay in the Life SDK.
   - Event attendance, groups, courses, and serving use the Ministry SDK.
   - Giving funds extend the Giving SDK.
   - Member profile and pastoral care use the People SDK.
   - Notification delivery uses the Notifications SDK.
   - Ministry analytics uses the Analytics SDK.
   - Newcomer follow-up, discipleship journey, reading plan orchestration, and
     sermon discussion guides use the Growth SDK.

## Change Checklist

When changing SDK behavior:

1. Update `packages/api_contracts` if payloads or responses change.
2. Update mobile DTOs/repositories/remote data sources.
3. Update admin Web API helpers if the admin console uses the endpoint.
4. Update the matching `docs/sdk/*.md` file.
5. Update `docs/api.md` when public endpoint behavior changes.
6. Update `packages/api_contracts/src/route-registry.ts` when routes or client
   entry files change.
7. Run `bun run check:contracts` for route coverage.
8. Run `bun run check:sdk-boundaries` when changing UI/surface code that may
   accidentally bypass repositories or API helpers.
9. Add or update tests at the closest layer.
