# Code Boundaries

Use this file when a task touches implementation code.

## Core Rule

Keep changes within the smallest responsible boundary. Do not turn a feature request into unrelated cleanup.

Do not use a shallow patch to hide an architecture boundary problem. If the owner is wrong, fix the owner.

## Boundaries

1. Backend code stays under `backend/`.
2. Admin Web code stays under `apps/admin_web/`.
3. Mobile App code stays under `apps/mobile/`.
4. Shared API schemas stay under `packages/api_contracts/`.
5. Operational scripts stay under `tools/` or `infra/`.
6. Documentation stays under `docs/`, except root entry files such as `README.md` and `AGENTS.md`.

## Do Not

- Do not rewrite unrelated modules.
- Do not move files only for preference.
- Do not change public contracts without updating callers.
- Do not bypass repository/provider/API helper layers from UI code.
- Do not hide production risks behind mock-only behavior.
- Do not rollback user changes unless explicitly requested.
- Do not create a second source of truth for the same state.
- Do not keep broken old architecture compatibility during active development unless explicitly required.

## Owner Questions

Before editing, ask:

1. Who owns this behavior?
2. Is this UI state, domain state, persistence state, transport state, or deployment state?
3. Is there already a source of truth?
4. Will this change require updating sibling flows at the same layer?
5. Does the fix need to happen in service/repository/contract instead of UI?

## High-Risk Areas

Be extra strict with:

- giving, Stripe, fees, refunds, disputes, annual statements
- member auth, admin auth, roles, privacy data
- sermon audio and uploaded sermon content
- event registration, capacity, check-in, cancellation
- database migrations
- VPS and production deployment scripts
