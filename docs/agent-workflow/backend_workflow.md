# Backend Workflow

Use this file for backend API, database, job diagnostics, contract, and migration changes.

## Structure

Backend modules live under:

- `backend/src/modules/<module>/`

Common layers:

- routes
- service
- repository interface
- Postgres repository
- in-memory repository
- tests

## Rules

1. Business rules belong in service/repository layers, not UI.
2. Routes validate inputs and delegate.
3. Repositories handle persistence and should not own UI behavior.
4. In-memory repositories should match Postgres behavior closely enough for tests.
5. Every schema change needs a migration.
6. Every contract change should update `packages/api_contracts`.
7. Backend services own capacity, permission, payment, statement, and status-transition rules.
8. Do not make the mobile App or admin Web the source of truth for backend-owned rules.
9. Route tests should parse response `data` with shared `packages/api_contracts`
   schemas when a response schema exists.

## Owner Mapping

- route: HTTP shape, auth requirement, input parsing
- service: business decisions and status transitions
- repository: persistence and query behavior
- contract: shared request/response shape
- migration: database schema evolution
- scheduler/service: backend-owned async lifecycle when explicitly introduced

## Migrations

Migration files live under:

- `backend/migrations/`

Rules:

- Update `backend/src/shared/db/schema.ts` first for schema changes.
- Generate normal migrations with `bun run db:generate` from `backend/`.
- Use the next Drizzle Kit migration generated under `backend/migrations/`.
- Keep each migration to one schema-change theme.
- Do not add or maintain a custom migration runner.
- If a hand-written SQL migration is unavoidable, keep
  `backend/migrations/meta/_journal.json` and the latest snapshot aligned.
- Update tests when behavior depends on the schema.
- Run `bun run db:check` before finishing.

## Verification

Run backend tests after behavior changes:

- `bun run test`

For route payload changes, validate response data through
`backend/tests/contract_assertions.ts` before checking individual fields.

For production-facing changes, also consider:

- `bun run check`
- database smoke commands from `docs/operations.md`
