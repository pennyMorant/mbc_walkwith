# MBC WalkWith Database Plan

Status: draft

This document covers both local Flutter storage and backend Postgres persistence.

## 1. Database Decisions

Local app database:

```text
Drift + SQLite
```

Backend source of truth:

```text
Postgres
```

Supporting storage:

```text
flutter_secure_storage:
  auth tokens and session secrets

shared_preferences:
  non-sensitive UI preferences

Object storage:
  MP3, images, generated PDF statements

Postgres notification tasks:
  push delivery state, retry evidence, and lightweight scheduler checkpoints

pgvector:
  backend vector search for sermons, commentary, and study resources
```

## 2. Why Drift Instead of Isar

Drift is preferred because this app is relational and API-synced.

The app needs:

- Bible books to chapters to verses.
- Sermons linked to Scripture references.
- Sermon outlines linked to sermon timestamps.
- Reading progress linked to users and verses.
- Notes and highlights linked to verses.
- Local sync queue for offline edits.

These are natural SQL relationships. Drift also aligns better with the backend Postgres model.

Isar can still be reconsidered if the app later needs a large local object graph with minimal relational querying. It should not be the first choice for the core local database.

## 3. Local Cache Policy

Can cache locally:

```text
Bible books and verses
Public sermon metadata
Public sermon outlines
Public sermon references
Public life posts
Weekly bulletin
Published sermon search facets
Public group/course summaries
Reading progress
Bookmarks
Highlights
Study notes
Sync queue metadata
```

Do not cache locally by default:

```text
Giving transactions
Annual statement PDFs
Private prayer requests
Care requests and follow-up notes
Group member lists
Course rosters
Serving schedules with private notes
Raw AI questions
Payment provider payloads
Admin audit logs
```

Sensitive exceptions require explicit design review and encryption.

## 4. Local Tables

Initial Drift tables:

```text
local_bible_books
local_bible_translations
local_bible_verses
local_bible_verse_texts
local_sermons
local_sermon_outlines
local_sermon_topics
local_sermon_references
local_life_posts
local_public_group_summaries
local_public_course_summaries
reading_progress
study_notes
study_bookmarks
sync_queue
```

These are also documented in `development_guidelines.md`.

## 5. Local Sync Strategy

For public content:

```text
read local cache
  -> render immediately
  -> fetch remote in background
  -> upsert local database
  -> UI updates from watched query
```

For personal edits:

```text
write local
  -> mark dirty
  -> add sync_queue item
  -> upload when online and authenticated
  -> clear dirty after server confirms
```

For sensitive data:

```text
fetch remote only
  -> do not persist by default
```

## 6. Backend Tables

Initial backend domains:

```text
users
member_profiles
bible_books
bible_verses
lexicon_entries
verse_lexicon_links
sermons
sermon_transcripts
sermon_references
sermon_topics
sermon_playback_progress
sermon_audio_cleanup_tasks
sermon_discussion_guides
sermon_discussion_responses
life_posts
life_post_reads
prayer_requests
bible_verse_notes
giving_transactions
annual_statements
payment_provider_events
giving_funds
giving_fund_allocations
event_registrations
ministry_groups
group_applications
group_memberships
courses
course_lessons
course_enrollments
serving_teams
serving_roles
serving_assignments
care_requests
care_follow_ups
notification_preferences
notification_jobs
member_device_tokens
notification_messages
member_notification_items
notification_delivery_tasks
analytics_snapshots
data_exports
audit_logs
```

Reading-plan persistence adds:

```text
reading_plans
reading_plan_days
reading_plan_assignments
reading_plan_day_progress
```

`reading_plan_assignments` is one execution attempt, not one permanent row per
user and plan. It stores `attempt_number`, immutable plan title/duration
snapshots, and backend-owned `ended_at`. A partial unique index permits only one
open (`not_started`, `active`, or `paused`) assignment per user and plan while
retaining completed and abandoned history.

`public_posts.revision` is the canonical optimistic concurrency token for the
life-content aggregate. It starts at `0` and increments only for content or
publication-state writes. Event registrations, attendance, check-in codes, and
member read states remain separate aggregates and do not advance it.

Current `member_profiles` profile extension fields:

```text
address
faith_start_year
baptized_year
joined_church_at
emergency_contact_name
emergency_contact_phone
```

These fields are canonical on the backend. The mobile app may cache the latest
profile envelope with the member session, but it must refresh from
`GET /v1/member/auth/me` and write through `PATCH /v1/member/profile`.
Member password hashes are backend-only columns on `users` and are accessed
only by member auth services.

Rules:

- Use UUIDs for business entities.
- Use stable text IDs for Bible books and verses, for example `rom` and `rom.8.28`.
- Store public verse reflections in `bible_verse_notes` by `verse_id`; do not copy Bible text into the note row.
- Use integer cents for money.
- Store timestamps in UTC.
- Store provider IDs separately from internal IDs.
- Keep finance access separate from content admin access.

`sermons.revision` is the canonical optimistic-concurrency token for the full
sermon aggregate. It is a non-negative integer initialized to `0` and incremented
inside the same transaction for every metadata, status, transcript/outline/
reference, or audio mutation. Admin write commands compare their submitted
revision while the parent sermon row is locked. Public App projections omit the
field; timestamps and serialized child content are not concurrency tokens.

`sermon_audio_cleanup_tasks` is the recovery source of truth for audio objects
that became unbound through upload revision conflicts, replacement, explicit
audio removal, or sermon deletion. It stores an internal unique storage path,
reason, `pending / failed / succeeded` status, attempts, safe error summary, and
timestamps. `sermon_id` remains a UUID but intentionally has no foreign key so
cleanup evidence survives deletion of the sermon aggregate. The storage path
is backend-only and is omitted from API and audit projections.

`sermon_discussion_guides` allows multiple drafts and review versions for one
sermon. Partial unique index
`uq_sermon_discussion_guides_public_published(sermon_id)` applies only when
`status = 'published'` and `audience_type = 'public'`, so the public App route
has one canonical result while scoped group/course/discipleship guides remain
independent.

Its `questions`, `action_steps`, `prayer_prompts`, and `generated_metadata`
JSONB values are parsed through the complete shared guide schema when read.
Malformed persisted structures are data-integrity failures; repositories must
not filter invalid entries or substitute empty arrays/objects.

Bible seed rule:

- Source artifacts live under `packages/bible_content/sources/<version>/normalized/`.
- Mobile packaged assets live under `apps/mobile/assets/bible/<version>/`.
- The Flutter app imports seed assets into Drift with `BibleSeedImporter` and tracks the imported seed version in `SharedPreferences`.
- Import Bible seed data in two stages: book and translation metadata first, then verse text lazily per `translationId` when the reader or search needs it. Do not import every packaged Bible version during first app open.
- Current packaged public-domain translations are WEB (`web`), Chinese Union Version Simplified (`cuvs`), and Chinese Union Version Traditional (`cuvt`).
- Store canonical book metadata in `local_bible_books`, translation metadata in `local_bible_translations`, and per-translation verse text in `local_bible_verse_texts`.
- Keep stable IDs translation-independent: `bookId = rom`, `chapterId = rom.8`, `verseId = rom.8.28`.
- `local_bible_verses` is retained for compatibility and future lexicon-related verse metadata; new reader text should query `local_bible_verse_texts`.

## 7. Migrations

Flutter:

- Drift migrations must be explicit.
- Test destructive schema changes.
- Do not wipe user notes or reading progress during migration.

Backend:

- `backend/src/shared/db/schema.ts` is the backend schema source of truth.
- Every schema change must have a Drizzle Kit migration file under
  `backend/migrations/`.
- Migrations must be committed with the feature code.
- Normal schema migrations should be generated with `bun run db:generate` from
  `backend/`.
- Complex backfills or data repair may use hand-written SQL, but the migration
  must still be registered in `backend/migrations/meta/_journal.json`.
- `bun run db:check` must pass before migration work is finished.
- `bun run db:migrate` is the only supported backend migration execution path.
- Production migrations should be reversible where practical.

## 8. Indexes

Important local indexes:

```text
local_bible_verses(book_id, chapter)
local_bible_verse_texts(version_id, book_id, chapter)
local_sermon_references(verse_id)
local_sermon_outlines(sermon_id, sort_order)
local_sermon_topics(topic)
local_life_posts(display_weight, starts_at)
local_life_posts(type, starts_at)
study_notes(verse_id)
study_bookmarks(verse_id)
sync_queue(entity_type, created_at)
```

Important backend indexes:

```text
sermons(sermon_date)
sermons(speaker)
sermons(series)
sermon_references(verse_id)
sermon_topics(topic)
life_posts(display_weight)
life_posts(visibility, starts_at)
life_post_reads(user_id)
life_post_reads(read_at)
prayer_requests(user_id, visibility)
giving_transactions(user_id, given_at)
giving_funds(status)
event_registrations(life_post_id, user_id)
group_memberships(group_id, user_id)
course_enrollments(course_id, user_id)
serving_assignments(user_id, starts_at)
care_requests(user_id)
care_requests(status)
care_requests(assignee_admin_user_id)
care_follow_ups(care_request_id)
notification_jobs(status, scheduled_at)
member_device_tokens(user_id)
member_device_tokens(push_token)
member_device_tokens(installation_id) where user_id is null
notification_messages(dedupe_key)
notification_messages(audience)
member_notification_items(user_id, read_at, archived_at)
notification_delivery_tasks(message_id)
notification_delivery_tasks(status, next_attempt_at)
notification_delivery_tasks(audience)
analytics_snapshots(metric_scope, generated_at)
audit_logs(actor_user_id, created_at)
```

## 9. Stage Two Schema Rules

- Analytics snapshots are derived and must be rebuildable. Sermon discovery
  currently queries canonical sermon tables directly; no sermon search index or
  index lifecycle is part of the schema.
- QR check-in payloads are not durable attendance state; durable state lives in `event_registrations`.
- Group membership, course enrollment, serving assignments, care requests, notification jobs, giving fund allocations, and data exports require audit events.
- Sensitive tables such as `care_requests`, `care_follow_ups`, financial tables, member roles, and data exports must not be mirrored into ordinary mobile cache.
- Normal member administration is status-based (`inactive` / `blocked`), not a
  physical delete. Member identity and profile writes are transactional so
  related financial, audit, notification, study, and ministry history remains
  addressable.
- Fund allocation is stored with the giving transaction created at checkout time, then updated by Stripe webhook status changes.
- `giving_transactions` enforces non-null `(provider, provider_transaction_id)`, `(provider, provider_checkout_session_id)`, and `(provider, provider_charge_id)` uniqueness so one Stripe identity cannot mutate or reconcile multiple gifts.
- `provider_charge_id` is backend-only payout reconciliation identity. It links Stripe payout balance-transaction charge sources to canonical gifts without exposing a second client-side transaction truth.
- Notification jobs and delivery tasks must store dedupe keys, cancellation keys, retry state, provider evidence, payload privacy class, audience, preference key, and explicit recipient IDs when applicable. Delivery tasks also keep backend-only pending device IDs plus a lease ID/expiry so concurrent senders cannot duplicate delivery and partial retries do not resend successful devices.
- Guest push device rows may have no `user_id`; they are eligible only for public notification delivery and must never create member inbox rows.
