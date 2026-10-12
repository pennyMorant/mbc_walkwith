# Verification

Use this file before finishing a task.

## Always

1. Run `git diff --check`.
2. Run `git status --short`.
3. Report changed areas and verification results.

## Pre-Finish Self-Check

Confirm:

- no new large file should be split
- no duplicate source of truth was introduced
- UI and business logic stayed separated
- repository/API/helper boundaries were not bypassed
- high-risk behavior was verified at the owning layer
- no temporary fallback, debug bypass, or stale compatibility remains
- docs and SDK docs were updated when required

## By Surface

Backend:

- `bun run test`
- targeted backend tests when full tests are unnecessary
- migration smoke checks when schema changed

Repository architecture checks:

- `bun run check:contracts` after backend route or SDK contract changes
- `bun run check:sdk-boundaries` after mobile/admin surface or SDK boundary changes
- `bun run check:surfaces` after mobile/admin route or surface doc changes
- `bun run check:capabilities` after provider, storage, notification, PDF, TTS, AI, export, or media-processing boundary changes
- `bun run check` for repository-level TypeScript, contract, SDK-boundary, surface-doc, capability-doc, and backend-test coverage

Admin Web:

- `bun run typecheck`
- build when deployment behavior changed

Mobile App:

- `flutter analyze`
- `flutter test`
- `flutter gen-l10n` when ARB files changed

Scripts:

- `bash -n <script>`
- run `help` output when CLI behavior changed

Docs:

- `git diff --check`
- verify links and referenced paths manually for new docs

## Final Report

Include:

- what changed
- what was verified
- what was not verified
- remaining risks or follow-up work

Commit only when the user explicitly asks or when an `AGENTS.md` action trigger command authorizes the full delivery loop.
