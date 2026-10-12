# Bible SDK

This document covers local Bible reading, search, TTS, reader assist, and backend Bible knowledge lookups.

## Mobile Files

- Study repository: `apps/mobile/lib/features/study/data/study_repository.dart`
- Bible people repository: `apps/mobile/lib/features/study/data/bible_people_repository.dart`
- Bible places repository: `apps/mobile/lib/features/study/data/bible_places_repository.dart`
- Bible notes repository: `apps/mobile/lib/features/study/data/bible_notes_repository.dart`
- Bible verse note DTOs: `apps/mobile/lib/features/study/data/dto/bible_verse_note_dto.dart`
- Reading plan repository: `apps/mobile/lib/features/study/data/reading_plan_repository.dart`
- Reading plan DTOs: `apps/mobile/lib/features/study/data/dto/reading_plan_dto.dart`
- Reading plan assignments DTOs: `apps/mobile/lib/features/study/data/dto/reading_plan_assignment_dto.dart`
- Reading plan envelope parser: `apps/mobile/lib/features/study/data/dto/reading_plan_envelope.dart`
- Reading plan JSON contract reader: `apps/mobile/lib/features/study/data/dto/reading_plan_json_reader.dart`
- External user identity: `apps/mobile/lib/core/identity/external_user_identity_repository.dart`
- Seed importer: `apps/mobile/lib/features/study/data/local/bible_seed_importer.dart`
- Reader UI: `apps/mobile/lib/features/study/presentation/bible_reader_page.dart`
- Search UI: `apps/mobile/lib/features/study/presentation/bible_search_page.dart`
- Reading plan Study UI: `apps/mobile/lib/features/study/presentation/widgets/reading_plan_section.dart`
- Reading plan Mine summary: `apps/mobile/lib/features/mine/presentation/widgets/mine_reading_plan_card.dart`
- Reading plan current/history page: `apps/mobile/lib/features/mine/presentation/my_reading_plans_page.dart`
- Reader settings: `apps/mobile/lib/features/study/presentation/reader_assist_settings_provider.dart`

## Assets

- Bible text assets: `apps/mobile/assets/bible/`
- Bible knowledge assets: `apps/mobile/assets/bible_knowledge/`

## Backend and Contracts

- Bible knowledge routes: `backend/src/modules/bible-knowledge/`
- Bible verse notes routes: `backend/src/modules/bible-verse-notes/`
- Reading plan routes: `backend/src/modules/reading-plans/`
- Admin Reading Plans page: `apps/admin_web/src/features/reading-plans/pages/ReadingPlansPage.vue`
- Admin Reading Plans API helper: `apps/admin_web/src/core/api/reading_plans.ts`
- Admin Web page: `apps/admin_web/src/features/bible-knowledge/pages/BibleKnowledgePage.vue`
- Admin Bible notes page: `apps/admin_web/src/features/bible-notes/pages/BibleNotesPage.vue`
- Admin API helper: `apps/admin_web/src/core/api/bible_knowledge.ts`
- Admin Bible notes API helper: `apps/admin_web/src/core/api/bible_verse_notes.ts`

## SDK Rules

- Bible text reading should work offline from packaged assets.
- TTS reads local Bible text; it is not audio Bible playback.
- Reader assist should fall back to bundled knowledge when backend is unavailable.
- Search and chapter navigation should not require network access for packaged translations.
- Backend knowledge APIs can enrich people/place data but should not block reading.
- Public verse notes are backend-owned and linked by stable `verseId`; do not copy Bible text into note payloads.
- App note requests should send member `Authorization` when available and always include the core `X-External-User-Id` for low-sensitivity guest ownership.
- Public verse notes can be authored by signed-in members or by a device-owned
  external user id.
- Public verse note response envelopes and DTO fields are parsed strictly.
  Missing or mistyped fields, unknown author types, invalid dates, malformed
  lists, and references that do not match `verseId` must fail instead of being
  replaced with empty notes or fallback values.
- Authors may edit only notes that are still `published`; editing must not
  restore a note hidden by admin moderation.
- Hidden notes can only be restored through admin moderation routes.
- Reading plans are backend-owned, but plan days store scripture references only: `bookId`, `chapter`, `startVerse`, `endVerse`, and `referenceLabel`.
- New reading plans start as draft. Backend publication requires every day from
  `1..durationDays`; day edits are accepted only while draft or paused, and
  published/archived content cannot be edited in place.
- After the first assignment, Backend locks plan days, duration, visibility,
  and locale. Progress writes require a published plan and an assignment that
  is not paused or abandoned.
- Reading plan progress may use member auth or `X-External-User-Id`; giving, profile, annual statement, and pastoral care must not use external id authorization.
- Reading plan list visibility is based on authenticated member identity, not on
  the mere presence of `X-External-User-Id`; external installations can list
  public plans only.
- App rendering and TTS for a reading plan must resolve those references against local Bible assets.
- Study opens reading plan references through the existing local Bible reader route; it does not request Bible text from the reading plan API.
- Mine reads active and historical reading-plan assignments by `scope`; completion state, attempt number, snapshots, `completedAt`, and `endedAt` remain backend-owned.
- Completed and abandoned assignments are immutable. Restarting a plan calls the self-assignment endpoint and receives a new attempt; clients never reset historical progress locally.
- Mine consumes `nextCursor` to load older attempts and uses detail
  `canRestart` instead of assuming every historical template can be restarted.
- Reading plan response envelopes and DTO fields are parsed strictly. Missing or
  mistyped required fields, unknown enums, invalid dates, and malformed nested
  references/progress throw `FormatException`; repositories must not replace
  them with empty collections, fallback status values, or partial rows.
- Study, detail, and Mine surfaces must render a retryable error when assignment
  parsing fails. Until canonical assignment state loads, start/read/complete
  actions remain unavailable.
- Reading plan assignment `sourceType/sourceId` is currently attribution on a
  concrete user assignment; it does not expand group, course, or discipleship
  membership.
- Member assignments are accepted only for an existing member. Self-assignment
  is idempotent by plan and user, including concurrent duplicate requests.
- Private local notes, highlights, and bookmarks remain in `StudyNotes`/`StudyBookmarks` unless a future sync feature explicitly changes the source of truth.

## Documentation Linkage

If Bible SDK behavior changes, update:

- `docs/sdk/bible.md`
- `docs/api.md` for backend Bible knowledge and verse note endpoints
- `docs/development_guidelines.md` when asset or directory rules change
