# MBC WalkWith Roadmap

Status: historical implementation-order draft

This roadmap preserves the early recommended implementation order. It is not the
current completion report. Current feature status lives in
[`feature_completion_audit.md`](feature_completion_audit.md) and
[`stage_two_status.md`](stage_two_status.md). Early references to mock data or
placeholders describe bootstrap phases, not the current production/testing
baseline.

The goal is to build the product in stable layers instead of adding isolated
screens that later need to be rewritten.

## Phase 0: Engineering Foundation

Goal: make the Flutter app ready for long-term development.

Tasks:

- Split the current large tab files into smaller section widgets.
- Add `go_router` and named routes.
- Add `flutter_riverpod`.
- Move mock data behind repositories and data sources.
- Add shared loading, error, empty, and offline UI states.
- Add Flutter l10n with `en`, `zh-Hans`, and `zh-Hant`.
- Keep Material 3 and dynamic color as the default UI system.

Done when:

- UI code no longer imports mock data directly.
- Navigation uses named routes.
- Major user-facing strings are ready for localization.
- Mine tab exposes theme mode and native language settings.
- `flutter analyze` and tests pass.

## Phase 1: Complete Mock Product Loop

Goal: prove the full first-version experience before backend work.

Core loop:

1. Open the app.
2. Read a Bible chapter.
3. Long-press a verse and view a sourced AI explanation mock.
4. Open a related sermon.
5. See sermon outline and cited Scripture.
6. Jump back from sermon Scripture to the reader.
7. View this week's church life feed.

Tasks:

- Bible chapter reader.
- Verse explanation bottom sheet.
- Lexicon bottom sheet.
- Sermon list and sermon detail route.
- Sermon player UI with speed control.
- Sermon outline and references.
- Life feed and bulletin cards.
- Giving entry placeholder.
- Mine tab with theme mode and language settings.

Done when:

- The core loop works fully with mock data.
- Major screen states are covered: loading, empty, error, success.
- Existing pages are split into small widgets.

## Phase 2: Local Database and Offline Cache

Goal: make public content and personal reading state offline-aware.

Tasks:

- Add Drift and SQLite.
- Add local tables for Bible books, verses, sermons, sermon outlines, sermon references, life posts, reading progress, study notes, and sync queue.
- Add repositories that read local first, then remote later.
- Add seed/mock import into local database.
- Package public-domain WEB, Simplified Chinese CUV, and Traditional Chinese CUV seed assets.
- Add reading progress persistence.
- Add study note and highlight persistence.

Do not store locally yet:

- Giving transactions.
- Annual statement PDFs.
- Private prayer requests.
- Raw AI question history.

Done when:

- Bible and public sermon data can load from local database.
- Reading progress survives app restart.
- Drift migrations are in place.

## Phase 3: API Client Layer

Goal: prepare the app to connect to backend without rewriting UI.

Tasks:

- Add `dio`.
- Add `ApiClient`.
- Add typed `ApiError`.
- Add request headers: authorization, accept language, platform, client version, request ID.
- Add remote data sources for Bible, sermons, life posts.
- Keep mock/local fallback.
- Add repository tests for success and failure responses.

Done when:

- Public content repositories can switch between mock/local/remote sources.
- API errors render consistent UI states.

## Phase 4: Backend Foundation

Goal: create the backend inside this repository.

Tasks:

- Add `backend/`.
- Add health endpoint.
- Add Postgres connection and migrations.
- Add `/v1` route structure.
- Add request validation.
- Add shared response and error format.
- Add public content endpoints for Bible, sermons, and life posts.
- Add admin seed scripts.

Done when:

- Flutter app can read public content from local backend.
- API follows `docs/api.md`.

## Phase 5: Study Deepening

Goal: turn the Study tab into the main spiritual study experience.

Tasks:

- Book/chapter selector.
- Notes and highlights.
- Related sermons by verse.
- Original-language word insights.
- Study AI endpoint.
- RAG retrieval from Scripture, lexicon, commentary, and church sermon archive.
- AI explanation source display.

Done when:

- Users can study a chapter, save notes, and see sourced AI explanations.
- AI output has source categories and safe disclaimers.

## Phase 6: Sermon Deepening

Goal: turn sermon MP3 files into structured, connected resources.

Tasks:

- Real audio playback with `just_audio`.
- Background playback and lock screen controls with `audio_service`.
- Playback progress sync.
- Sermon transcript display.
- Admin upload flow.
- Local sermon processing package import.
- AI summary, outline, and Scripture reference extraction on the local workstation.
- Admin review before publishing generated content.

Done when:

- A sermon can be uploaded, processed, reviewed, published, played, and connected to Scripture.

## Phase 7: Church Life and Prayer

Goal: make church life useful without becoming social media.

Tasks:

- Weekly bulletin CMS.
- Event detail and registration.
- Fellowship group visibility.
- Prayer request creation.
- Prayer visibility controls: private, group, members.
- Pastoral/admin review tools.
- Notification preferences.

Done when:

- Members can follow weekly life and submit privacy-aware prayer requests.

## Phase 8: Giving

Goal: add giving only after security, policy, and finance requirements are clear.

Tasks:

- Confirm payment provider and app store policy path.
- Add checkout endpoint.
- Add payment webhooks.
- Add giving history.
- Add annual statement generation.
- Add PDF statement storage with signed URLs.
- Add finance admin export.
- Add audit logs.

Done when:

- Transactions are recorded only from verified provider events.
- Finance roles can generate and export annual statements.
- Giving data is permissioned and audit-logged.
