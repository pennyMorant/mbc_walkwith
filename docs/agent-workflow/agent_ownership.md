# Agent Ownership

Use this file to decide who owns a change and who should not absorb it.

## UI Agent

Owns:

- screens, cards, dialogs, sheets, layout, visual states
- loading, empty, error, and success presentation

Does not own:

- payment rules, event capacity, auth, database persistence, SDK transport

## Mobile App Agent

Owns:

- Flutter feature structure
- providers, repositories, DTOs, local/remote data sources
- app-side navigation and offline-friendly behavior

Does not own:

- backend authorization rules, admin operational behavior, database schema

## Admin Web Agent

Owns:

- admin pages, tables, dialogs, forms, dense operational UX
- admin API helper usage

Does not own:

- backend source of truth, payment verification, member privacy policy

## Backend Agent

Owns:

- routes, services, repositories, schedulers, migrations, backend tests
- business invariants and authorization enforcement

Does not own:

- visual layout, mobile-only state, admin-only component structure

## SDK Agent

Owns:

- `ApiClient`, DTOs, repositories, remote data sources, admin API helpers
- `packages/api_contracts`
- `docs/sdk.md` and `docs/sdk/*.md`

Does not own:

- UI layout, database schema without backend owner involvement

## Giving Agent

Owns:

- Stripe integration, donation records, fees, payouts, refunds, disputes
- annual statements and giving history

Does not own:

- general Life tab layout, unrelated member profile behavior

## Sermon Agent

Owns:

- sermon audio, transcript, outline, references, upload/download flows
- sermon playback state and admin sermon operations

Does not own:

- Bible reader internals or giving flows

## Life and Event Agent

Owns:

- life posts, weekly bulletin, event registration, capacity, cancellation, check-in

Does not own:

- payment settlement, sermon audio storage, Bible content assets

## Bible Agent

Owns:

- Bible reader, search, TTS, packaged Bible text, people/place reader assist

Does not own:

- sermon audio playback or backend payment features

## Deployment Agent

Owns:

- VPS scripts, nginx, systemd, env files, deployment docs, release health checks

Does not own:

- feature UI behavior or product pricing decisions
