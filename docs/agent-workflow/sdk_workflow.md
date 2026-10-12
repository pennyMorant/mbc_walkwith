# SDK Workflow

Use this file for SDK, DTO, repository, remote data source, API helper, and shared contract changes.

## SDK Definition

In this repository, SDK means the client boundary between UI and backend APIs:

- Flutter `ApiClient`
- Flutter repositories and remote/local data sources
- Flutter DTOs
- Admin Web `core/api` helpers
- `packages/api_contracts`
- SDK docs under `docs/sdk/`

## Required Docs

Start at:

- `docs/sdk.md`

Then read the matching feature doc:

- auth: `docs/sdk/auth.md`
- life: `docs/sdk/life.md`
- sermons: `docs/sdk/sermons.md`
- bible: `docs/sdk/bible.md`
- giving: `docs/sdk/giving.md`
- prayer: `docs/sdk/prayer.md`
- notifications: `docs/sdk/notifications.md`
- admin: `docs/sdk/admin.md`
- errors and transport: `docs/sdk/errors.md`

## Rules

1. UI must not call raw HTTP directly.
2. Mobile authenticated calls should accept `MemberSession`.
3. DTO parsing should be explicit.
4. Admin Web pages should use `apps/admin_web/src/core/api/*`.
5. Shared payload changes should update `packages/api_contracts`.
6. Backend route changes must update `packages/api_contracts/src/route-registry.ts`.
7. SDK behavior changes must update the matching `docs/sdk/*.md`.
8. SDK layers should not invent business truth that belongs to backend services.
9. Error mapping should preserve meaningful backend errors and avoid false success states.

## Source of Truth

- backend service owns authorization and business rules
- contract owns shared payload shape
- DTO owns app parsing
- repository owns app-facing data flow
- UI owns display and user interaction

## Verification

Use the closest layer:

- repository tests for mobile data behavior
- widget tests for visible SDK-driven UI behavior
- backend route tests for API behavior
- admin typecheck for API helper changes
- `bun run check:contracts` for route/contract/client/doc coverage
- `bun run check:sdk-boundaries` for mobile/admin surface boundary drift
