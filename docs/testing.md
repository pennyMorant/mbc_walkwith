# MBC WalkWith Testing Strategy

Status: draft

Testing should focus on behavior, permissions, data mapping, and sensitive workflows.

## 1. Flutter Tests

Unit tests:

- Formatters.
- DTO to domain mappers.
- Repository behavior with fake data sources.
- API error mapping.
- Drift DAO queries.

Widget tests:

- App shell and tab navigation.
- Study reader states.
- Verse explanation bottom sheet.
- Sermon player UI states.
- Sermon player session state for system pause, completion, replay, and progress reporting.
- Life feed states.
- Loading, empty, error, offline, unauthorized states.

Integration tests later:

- Read chapter flow.
- Sermon playback flow.
- Login flow.
- Study note sync flow.
- Giving flow only after payment sandbox exists.

## 2. Backend Tests

Unit tests:

- Services.
- Validators.
- Permission checks.
- AI prompt input builders.
- Payment webhook idempotency logic.

Workflow/integration tests:

- API routes with test database.
- Auth and role checks.
- Public content endpoints.
- Admin publishing flow.
- Giving statement generation.

Integration tests:

- Local sermon package import.
- Sermon outline/reference publish validation.
- PDF statement generation.

## 3. Sensitive Workflow Requirements

Required tests before production:

- Prayer visibility.
- Giving permission checks.
- Webhook signature handling.
- Webhook idempotency.
- Statement signed URL access.
- Admin audit logging.
- Auth token refresh and logout.

## 4. Architecture Closure Verification Matrix

Use this matrix when closing a cross-surface architecture phase.
For product-wide staging closure, use
[closure_validation_plan_zh.md](closure_validation_plan_zh.md) after the local
checks below pass.

| Surface | Required verification | Notes |
| --- | --- | --- |
| Shared contracts | `bun run typecheck` from repo root | Covers `packages/shared_types`, `packages/api_contracts`, `packages/ui_tokens`, backend typecheck, and Admin Web typecheck. |
| API route coverage | `bun run check:contracts` | Verifies backend route literals are registered with contract files, SDK docs, and App/Admin client entry files. |
| SDK boundaries | `bun run check:sdk-boundaries` | Verifies mobile/admin surfaces do not bypass repository or API helper boundaries. |
| Surface docs | `bun run check:surfaces` | Verifies documented mobile/admin route maps and backend route registry references stay aligned with code. |
| Capability docs | `bun run check:capabilities` | Verifies capability docs, matrix entries, required sections, and owner file paths stay aligned. |
| Backend API | `cd backend && bun run test` | Required when routes, services, repositories, jobs, payments, statements, uploads, auth, or permissions change. |
| Admin Web | `cd apps/admin_web && bun run typecheck` | Required for any admin page, component, API helper, auth, i18n, or router change. |
| Admin Web build | `cd apps/admin_web && bun run build` | Required before deployment or when Vite/env/bundle behavior changes. |
| Mobile App | `cd apps/mobile && flutter analyze` and `flutter test` | Required for Dart, repository, controller, TTS, PDF, route, or UI changes. |
| Diff hygiene | `git diff --check` and `git status --short` | Required before every final report or stage commit. |

Repository-level verification:

```sh
bun run check
```

This runs TypeScript typecheck, API contract coverage, SDK boundary checks,
surface doc checks, capability doc checks, and backend tests. It does not
replace Flutter verification for Dart/App changes.

For each feature chain, add the closest test to the owner layer:

- Route/service behavior belongs in backend tests.
- Repository/API error mapping belongs in mobile or Admin Web client tests.
- TTS, PDF sharing, local cache, and playback lifecycle belong in mobile tests.
- Native media controls still need manual device QA for Android notification and iOS lock screen / Control Center behavior.
- Provider idempotency and audit behavior belong in backend tests.

## 5. Test Naming

Use behavior-focused test names:

```text
returns cached sermons before refreshing remote data
does not show private prayer request to group member
records payment only after verified webhook
opens explanation sheet when verse is long pressed
```

## 6. Golden Tests

Golden tests can be added for stable design system components:

- App info pill.
- Verse tile.
- Sermon card.
- Empty state.
- Error state.

Do not overuse golden tests while UI is still changing rapidly.

## 7. Manual QA Checklist

Before major demo builds:

- Light and dark mode.
- Dynamic color fallback.
- Text scaling.
- Small phone viewport.
- Large phone viewport.
- Android back behavior.
- iOS safe areas.
- Offline launch with cached data.
- No sensitive data appears in logs.
