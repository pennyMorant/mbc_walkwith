# MBC WalkWith Development Guidelines

Status: draft
Audience: Flutter app, backend service, admin web, public web, and future contributors

This document defines the engineering rules for building MBC WalkWith over time. The goal is to keep the codebase scalable as more screens, APIs, languages, offline data, and backend modules are added.

Related documents:

- [roadmap.md](roadmap.md): phased implementation plan.
- [ui_design_system.md](ui_design_system.md): UI system and component rules.
- [database.md](database.md): local and backend database plan.
- [ai_policy.md](ai_policy.md): AI safety and sourcing policy.
- [privacy_security.md](privacy_security.md): privacy, security, and audit rules.
- [testing.md](testing.md): test strategy.
- [open_source_release.md](open_source_release.md): public repository,
  licensing, private data, and self-hosting boundaries.

## 1. Core Direction

Build the app as an API-first, offline-aware Flutter application.

Key decisions:

- UI framework: Flutter with Material Design 3.
- App router: `go_router`.
- State management: `flutter_riverpod`.
- Local database: Drift over SQLite.
- Secure storage: `flutter_secure_storage` for tokens and other secrets.
- Lightweight preferences: `shared_preferences`.
- HTTP client: `dio`.
- JSON models: typed Dart DTOs with explicit mappers; add code generation only
  when the owner feature benefits from it.
- Backend language/framework: TypeScript with Fastify.
- Backend database: Postgres.
- Backend API style: REST JSON under `/v1`.
- Backend architecture: modular monolith first, split later only if needed.
- Backend data access: Drizzle ORM with Drizzle Kit migrations.
- Admin web: Vue 3, Vite, TypeScript, Vue Router, Pinia, TanStack Query, Vuetify 3.
- Public web: Vue 3, Vite, TypeScript, Vuetify 3, Motion for Vue.
- Shared contracts: `packages/api_contracts` and `packages/shared_types`.

## 2. Repository Layout

The repository is a multi-application monorepo: mobile app, backend API, admin web, public web, shared packages, docs, and infra.

Current state: the Flutter app lives under `apps/mobile/`, backend API under `backend/`,
admin web under `apps/admin_web/`, public web under `apps/public_web/`, and shared
contracts under `packages/`.

Long-term target layout:

```text
mbc_walkwith/
  apps/
    mobile/
      lib/
      test/
      android/
      ios/
      pubspec.yaml
    admin_web/
      src/
      tests/
      package.json
    public_web/
      src/
      tests/
      package.json
    sermon_studio/
      src/
      tests/
      package.json
    user_web/
      src/
      tests/
      package.json

  backend/
    src/
    migrations/
    scripts/
    tests/

  packages/
    api_contracts/
    bible_content/
    shared_types/
    ui_tokens/

  docs/
    architecture.md
    architecture/
      app.md
      backend_web.md
    core/
      README.md
      contracts.md
      feature_integration.md
    features/
      README.md
      ai_bible_study.md
      church_life_publishing.md
      event_registration.md
      sermon_publishing.md
      giving_flow.md
      annual_statement.md
      bible_tts.md
      notification_delivery.md
      prayer_moderation.md
    domains/
      README.md
      member_identity.md
      content_visibility.md
      giving_finance.md
    surfaces/
      README.md
      mobile_app.md
      admin_web.md
      backend_api.md
    capabilities/
      README.md
      payment_gateway.md
      object_storage.md
      tts_playback.md
    api.md
    development_guidelines.md

  infra/
    docker/
      api.Dockerfile
      web.Dockerfile
      compose.yml
      compose.env.example
      backend.env.example

  tools/
    scripts/
```

Top-level repository directory rules:

```text
apps/
  Product applications. Future home for mobile, admin web, public web, and user web.

apps/mobile/
  Flutter mobile app.

apps/admin_web/
  Vue/Vite church admin console for content, sermons, prayer moderation, finance workflows, and audit review.

apps/public_web/
  Vue/Vite public church landing site for visitors, service information,
  contact/map links, App entry points, and admin-managed public resources.

apps/sermon_studio/
  Local workstation tool for extracting sermon audio from church video, running
  local transcription/summarization helpers, and preparing reviewed sermon
  packages before admin upload.

apps/user_web/
  Future member-facing web app for sermons, bulletins, giving statements, and account access.

backend/
  Backend API, database migrations, and server tests.

packages/
  Shared code used across apps and backend, such as API contracts, Bible content
  preparation, shared types, generated clients, or UI tokens.

docs/
  Architecture, API, policy, and development documents.

infra/
  Local/dev infrastructure, deployment config, environment templates, Docker Compose, and cloud manifests.

tools/
  Repository scripts, codegen helpers, importers, maintenance utilities.

android/
  Do not create at repository root. Android code belongs under `apps/mobile/android/`.

ios/
  Do not create at repository root. iOS code belongs under `apps/mobile/ios/`.

lib/
  Do not create at repository root. Flutter source belongs under `apps/mobile/lib/`.

test/
  Do not create at repository root. Flutter tests belong under `apps/mobile/test/`.
```

Do not add new top-level directories casually. A new top-level directory needs a clear long-term ownership reason and should be documented here first.

### 2.1 Mobile App Location Rule

The Flutter app is already located at:

```text
apps/mobile/
```

Run Flutter commands from that directory. Do not add Flutter app code at the repository root.

### 2.2 Backend and Admin Web Rule

Backend code lives only under `backend/`.

```text
backend/
  src/
    modules/
      admin/
      ai/
      audit/
      bible-knowledge/
      bible-verse-notes/
      care/
      courses/
      discipleship/
      giving/
      groups/
      health/
      jobs/
      life/
      media/
      members/
      newcomers/
      notifications/
      prayer/
      public/
      reading-plans/
      sermon-discussion-guides/
      sermons/
      serving/
      settings/
    shared/
      config/
      db/
      http/
  migrations/
  tests/
```

Admin web code lives only under `apps/admin_web/`.

```text
apps/admin_web/
  src/
    core/
      api/
      config/
      auth/
    features/
    layouts/
    plugins/
    router.ts
```

Admin web must call backend `/v1/admin/...` APIs. It must not connect directly
to Postgres, object storage, payment providers, or AI providers.

Backend Postgres verification commands:

```sh
bun run db:migrate
bun run db:smoke
```

`db:smoke` requires `DATABASE_URL` and `USE_MOCK_DATA=false`. It verifies the
real Postgres path for admin auth, sermon import, audio upload, reviewed local
package import, sermon publish, and public sermon listing.

Admin web authentication rules:

- Login through `POST /v1/admin/auth/login`.
- Store only the short-lived admin access token and non-sensitive user profile
  in browser storage for the first development version.
- Inject `Authorization: Bearer <token>` in the shared API client, not in
  individual feature pages.
- Protect admin routes through Vue Router route metadata and a global guard.
- Clear local session state on logout or expired-session failures.
- Never expose backend service secrets, payment secrets, or AI provider keys
  through the admin web bundle.

## 3. Flutter Directory Contract

Use feature-first structure with shared infrastructure under `core/`. The first-level and second-level directories under `apps/mobile/lib/` are fixed.

```text
apps/mobile/lib/
  app/
    walk_with_app.dart
    app_router.dart

  core/
    api/
      api_client.dart
      api_error.dart
    config/
      app_config.dart
    database/
      app_database.dart
      tables/
      daos/
      converters/
    identity/
    platform/
    settings/
    storage/
      secure_storage.dart
      preferences_store.dart

  features/
    study/
      data/
        study_local_data_source.dart
        study_remote_data_source.dart
        study_repository.dart
        dto/
      domain/
        bible_book.dart
        bible_verse.dart
        study_note.dart
      presentation/
        study_tab.dart
        widgets/
    sermons/
      data/
      domain/
      presentation/
    life/
      data/
      domain/
      presentation/
    mine/
      presentation/
      widgets/
    discipleship/
      data/
      domain/
      presentation/
    shell/
      shell_page.dart
      widgets/
        shell_app_bar.dart
        shell_navigation_bar.dart

  shared/
    widgets/
    utils/

  l10n/
    app_en.arb
    app_es.arb
    app_zh.arb
    app_zh_Hans.arb
    app_zh_Hant.arb

  theme/
    app_colors.dart
    app_theme.dart
    theme_provider.dart
```

### 3.1 First-Level `apps/mobile/lib/` Directories

Only these first-level directories should exist under `apps/mobile/lib/`:

```text
app/
  App composition: router and app widget. Shell UI belongs under `features/shell/`.

core/
  Cross-feature infrastructure: API, config, database, identity, platform,
  settings, and storage.

features/
  Product features. Each feature owns its data/domain/presentation code. Shared app shell UI belongs under `features/shell/`.

shared/
  Generic reusable UI and utilities with no product-feature ownership.

l10n/
  ARB files and generated localization code.

theme/
  Standalone theme module: dynamic color, light/dark ThemeData, app theme tokens.
```

Do not create these at the `apps/mobile/lib/` root:

```text
utils/
components/
screens/
pages/
services/
models/
providers/
helpers/
```

If code seems to belong in one of those generic directories, decide whether it is:

- feature-specific: put it under `features/<feature>/...`
- infrastructure: put it under `core/...`
- truly generic UI/helper code: put it under `shared/...`

### 3.2 Second-Level Directory Rules

`apps/mobile/lib/app/` may contain:

```text
walk_with_app.dart
app_router.dart
app_routes.dart
```

`apps/mobile/lib/core/` may contain:

```text
api/
config/
database/
identity/
platform/
settings/
storage/
```

`apps/mobile/lib/features/` may contain only feature folders:

```text
study/
sermons/
life/
mine/
discipleship/
shell/
```

Each feature folder must use this structure:

```text
features/<feature>/
  data/
  domain/
  presentation/
```

Allowed feature subdirectories:

```text
data/
  dto/
  mappers/
  local/
  remote/

domain/
  entities or value objects

presentation/
  screen files
  widgets/
  controllers/
```

The `features/shell/` feature is intentionally flatter because it only owns app shell UI:

```text
features/shell/
  shell_page.dart
  widgets/
```

`apps/mobile/lib/shared/` may contain:

```text
widgets/
utils/
```

`apps/mobile/lib/theme/` may contain:

```text
app_colors.dart
app_theme.dart
theme_provider.dart
```

`apps/mobile/lib/core/api/` may contain:

```text
api_client.dart
api_error.dart
```

`apps/mobile/lib/core/config/` may contain:

```text
app_config.dart
```

### 3.3 Why Theme Is Not Under `core/`

`theme/` is intentionally a first-level Flutter module.

Reasoning:

```text
core/
  Technical infrastructure: API, config, database, identity, platform, settings, storage.

theme/
  Design system: Material 3, dynamic color, light/dark ThemeData, typography, component defaults.
```

The theme module should be independently replaceable and easy to find because it governs visual behavior across mobile, and may later feed shared UI tokens for admin web and user web. Keeping it outside `core/` prevents `core/` from becoming a catch-all directory.

### 3.4 File Placement Rules

Use these placement rules before creating a file:

```text
Screen widget:
  features/<feature>/presentation/

Small widget used only by one feature:
  features/<feature>/presentation/widgets/

Widget reused by multiple features:
  shared/widgets/

Repository:
  features/<feature>/data/

DTO:
  features/<feature>/data/dto/

API data source:
  features/<feature>/data/remote/

Database/local data source:
  features/<feature>/data/local/

Domain model:
  features/<feature>/domain/

App route:
  app/app_router.dart or app/app_routes.dart

Theme:
  theme/

Theme mode provider:
  theme/theme_provider.dart

Localization:
  l10n/

Cross-feature API/identity/database/storage:
  core/
```

Never place a file at `apps/mobile/lib/` root except `main.dart`.

### 3.5 Import Direction Rules

Allowed dependency direction:

```text
presentation -> domain
presentation -> data repository providers
data -> domain
data -> core
app -> features
app -> theme
shared -> no feature imports
theme -> no feature imports
core -> no feature imports unless explicitly documented
```

Forbidden:

```text
domain -> presentation
domain -> Flutter widgets
domain -> API client
domain -> database package
shared -> features
theme -> features
```

Rules:

- `presentation/` can depend on `domain/` and repository providers.
- `domain/` must not depend on Flutter widgets, HTTP, or database packages.
- `data/` handles API DTOs, local database rows, and mapping into domain models.
- `core/` is infrastructure shared across features.
- `shared/widgets/` is for generic UI widgets, not feature-specific business UI.
- Avoid one large `utils.dart`. Use small files with clear ownership.

## 4. Routing

Use `go_router` for all app navigation. The current mobile shell uses four primary tabs: Study, Sermons, Life, and Mine.

Recommended dependency:

```yaml
dependencies:
  go_router: ^16.0.0
```

Initial route map:

```text
/study
/study/:bookId/:chapter
/study/verse/:verseId

/sermons
/sermons/:sermonId

/life
/life/posts/:postId

/mine

/prayer
/prayer/new

/giving
/giving/history
/giving/statements/:year

/login
```

Recommended router layout:

```text
lib/app/app_router.dart
lib/app/app_routes.dart
```

Rules:

- Use named routes, not raw strings scattered through widgets.
- Keep bottom tab navigation in a `StatefulShellRoute` when migrating to `go_router`.
- Keep route parsing near the router layer.
- Feature widgets should receive typed IDs or domain objects where possible.
- Auth redirects belong in router-level redirect logic, not inside every page.

Example route names:

```dart
class AppRouteNames {
  static const study = 'study';
  static const studyChapter = 'studyChapter';
  static const mine = 'mine';
  static const sermonDetail = 'sermonDetail';
  static const lifePost = 'lifePost';
  static const givingStatement = 'givingStatement';
}
```

## 5. State Management

Use `flutter_riverpod` for app state, async state, repositories, and controllers.

Recommended dependencies:

```yaml
dependencies:
  flutter_riverpod: ^3.0.0
  riverpod_annotation: ^4.0.2

dev_dependencies:
  riverpod_generator: ^4.0.3
  build_runner: ^2.0.0
```

Rules:

- Use providers for repositories, DAOs, API clients, and controllers.
- Prefer `riverpod_annotation` for new persistent controllers and shared providers.
- Commit generated `.g.dart` files when provider codegen is used.
- Keep generated provider names as produced by Riverpod; for a class ending in `Notifier`, the generated provider strips that suffix by default.
- Use `AsyncValue` for API/database loading states.
- Keep widget local state only for short-lived UI concerns such as selected tab, slider value, text field value, and animation state.
- Do not call HTTP clients directly from widgets.
- Do not call database DAOs directly from widgets unless the widget is an internal data tool.
- Prefer small controllers per feature instead of one global app controller.
- App startup must override `sharedPreferencesProvider` before `WalkWithApp` is built.
- Theme mode is owned by `theme/theme_provider.dart`; widgets read `themeModeProvider` and update through `themeModeProvider.notifier`.

State categories:

```text
Ephemeral UI state:
  selected tab, expanded panel, reader font scale slider

Persistent local state:
  reading progress, bookmarks, cached sermons, cached bulletin

Remote authoritative state:
  profile, giving history, prayer requests, admin content

Derived state:
  related sermons, filtered sermon list, grouped bulletin sections
```

## 6. Local Database

Use Drift with SQLite for structured local data.

Recommended dependencies:

```yaml
dependencies:
  drift: ^2.0.0
  drift_sqflite: ^2.0.0
  sqflite: ^2.0.0
  path_provider: ^2.0.0
  path: ^1.9.0

dev_dependencies:
  drift_dev: ^2.0.0
  build_runner: ^2.0.0
  sqflite_common_ffi: ^2.0.0
```

Local database responsibilities:

- Cache public Bible data.
- Cache public sermon metadata.
- Cache sermon references, outlines, and transcript segments when allowed.
- Cache public life posts and weekly bulletin.
- Store reading progress, bookmarks, highlights, and study notes.
- Store sync queue records for local changes waiting to upload.

Do not store by default:

- Raw payment card data.
- Long-lived auth secrets.
- Annual statement PDFs.
- Private prayer requests.
- Giving transaction history.
- Raw AI question history.

If the product later needs offline prayer notes or sensitive pastoral notes, add explicit encryption and retention rules first.

### 6.1 Initial Local Tables

```text
local_bible_books
  id text primary key
  testament text
  category text
  name_zh text
  name_zh_hant text
  name_en text
  abbreviation_zh text
  abbreviation_zh_hant text
  abbreviation_en text
  chapter_count integer
  sort_order integer
  updated_at text

local_bible_translations
  id text primary key
  locale_code text
  name text
  abbreviation text
  copyright_status text
  source_url text
  updated_at text

local_bible_verses (legacy verse metadata; reader text uses local_bible_verse_texts)
  id text primary key
  book_id text
  chapter integer
  verse integer
  text_zh text
  text_en text nullable
  has_lexicon integer
  updated_at text

local_bible_verse_texts
  id text primary key
  version_id text
  verse_id text
  book_id text
  chapter integer
  verse integer
  text text
  updated_at text

local_sermons
  id text primary key
  title text
  speaker text
  sermon_date text
  series text nullable
  primary_reference text nullable
  duration_seconds integer
  summary text nullable
  audio_url text nullable
  audio_url_expires_at text nullable
  updated_at text

local_sermon_outlines
  id text primary key
  sermon_id text
  title text
  summary text
  start_seconds integer
  sort_order integer

local_sermon_references
  id text primary key
  sermon_id text
  verse_id text
  reference_text text
  note text nullable
  start_seconds integer nullable

local_life_posts
  id text primary key
  type text
  title text
  body text
  starts_at text nullable
  ends_at text nullable
  visibility text
  image_url text nullable
  updated_at text

reading_progress
  id text primary key
  book_id text
  chapter integer
  verse_id text nullable
  updated_at text

study_notes
  id text primary key
  verse_id text
  note_text text
  highlight_color text nullable
  dirty integer
  deleted integer
  updated_at text

study_bookmarks
  id text primary key
  verse_id text
  dirty integer
  deleted integer
  updated_at text

sync_queue
  id text primary key
  entity_type text
  entity_id text
  action text
  payload_json text
  attempts integer
  last_error text nullable
  created_at text
```

### 6.2 Drift Rules

- Put table definitions under `core/database/tables/`.
- Put feature-specific queries under `core/database/daos/` or feature-owned local data sources.
- Keep database rows separate from domain models.
- Add migration tests before shipping destructive schema changes.
- Use integer cents for money if money is ever cached locally.
- Store timestamps as ISO 8601 UTC strings unless a strong reason exists to use integer milliseconds.

## 7. Secure Storage and Preferences

Use `flutter_secure_storage` for secrets:

```yaml
dependencies:
  flutter_secure_storage: ^9.0.0
```

Secure storage keys:

```text
access_token
refresh_token
session_expires_at
```

Use `shared_preferences` for non-sensitive settings:

```yaml
dependencies:
  shared_preferences: ^2.5.5
```

Preference examples:

```text
reader_font_scale
reader_theme_mode
last_opened_tab
sermon_playback_speed
```

Rules:

- Never store payment card data.
- Never store admin secrets.
- Keep secure storage access behind `SessionStore`.
- Keep direct `shared_preferences` access behind `core/storage/shared_preferences_provider.dart` or a dedicated store/controller.
- Use startup overrides for synchronously read preferences, such as theme mode, to avoid first-frame flicker.
- App UI language follows the platform app language setting. Do not store an in-app language override unless the product explicitly changes this rule.

## 8. API Client

Use `dio` for HTTP.

Recommended dependency:

```yaml
dependencies:
  dio: ^5.0.0
```

API client responsibilities:

- Base URL configuration.
- Authorization header injection.
- `Accept-Language` header injection.
- Request ID generation.
- Timeout configuration.
- Error normalization into `ApiError`.
- Optional retry for idempotent GET requests.

Rules:

- Widgets never import `dio`.
- Repositories call remote data sources.
- Remote data sources call `ApiClient`.
- All server errors map to a typed `ApiError`.
- Never log auth tokens, giving payloads, prayer bodies, or raw AI questions in production logs.

## 9. Data Flow

Use repository-based data flow.

```text
Widget
  -> Controller / Provider
  -> Repository
  -> LocalDataSource
  -> RemoteDataSource
  -> ApiClient
```

For cacheable public data:

```text
read local first
  -> render cached data
  -> fetch remote in background
  -> upsert local database
  -> UI updates from local watch query
```

For sensitive or financial data:

```text
fetch remote only
  -> show loading
  -> render response
  -> do not cache unless explicitly approved
```

For local edits:

```text
write local immediately
  -> mark dirty
  -> enqueue sync job
  -> upload when online/authenticated
  -> clear dirty flag after success
```

## 10. UI Architecture

Use Material Design 3 everywhere.

Rules:

- `ThemeData(useMaterial3: true)` is required.
- Use dynamic color when available, with a stable seed color fallback.
- Keep shared styling in the standalone `lib/theme/` module.
- Prefer built-in Material components before custom drawing.
- Keep cards and card-like surfaces at the app Material 3 card radius, 24dp, unless a component has a specific reason.
- Keep modal bottom sheets at the Material 3 extra-large top radius, 28dp.
- Avoid page sections styled as nested cards.
- Feature category groupings, such as Bible book groups, may use a single card wrapper when it improves scanning.
- Bottom sheets that present pickers should define a clear max height and scroll internally.
- Use icons for compact actions and tooltips for less obvious icons.
- Keep dense church operations screens quiet and scannable.
- Do not put business logic in widgets.

Recommended shared widgets:

```text
shared/widgets/app_scaffold.dart
shared/widgets/app_section_header.dart
shared/widgets/app_info_pill.dart
shared/widgets/app_empty_state.dart
shared/widgets/app_error_state.dart
shared/widgets/app_loading_state.dart
shared/widgets/app_list_card.dart
shared/widgets/app_bottom_sheet.dart
```

Responsive rules:

- Use `LayoutBuilder` for major layout changes.
- Use `SafeArea` around primary app surfaces.
- Support text scaling.
- Avoid fixed heights for text-heavy cards.
- Use stable dimensions for icon buttons, audio controls, and reader controls.

## 11. File Size and Code Splitting

Keep files small enough to review, test, and safely modify.

Preferred limits:

```text
Widget file:
  150-250 lines preferred
  350 lines should trigger a split

Controller / repository file:
  150-250 lines preferred
  300 lines should trigger a split

Domain model file:
  Keep one major model family per file

Generated files:
  Exempt from line limits
```

Splitting rules:

- Split large pages into section widgets under `presentation/widgets/`.
- Split repeated UI blocks into `shared/widgets/` only when they are truly generic.
- Keep one screen-level widget focused on layout orchestration.
- Move business decisions out of widgets into controllers or repositories.
- Move formatting, date, and small utility helpers into `shared/utils/`.
- Move constants into feature-owned constants unless they are genuinely
  cross-feature and belong in a shared utility file.
- Move route names and path builders into `app_routes.dart`.
- Move API mapping into DTO/mapper files, not screen widgets.

Recommended page pattern:

```text
study/
  presentation/
    study_tab.dart                 # screen composition
    widgets/
      bible_chapter_header.dart
      bible_verse_tile.dart
      ai_study_sheet.dart
      lexicon_bottom_sheet.dart
```

Screen file responsibility:

```text
Good:
  assembles sections
  reads providers
  handles simple navigation callbacks

Avoid:
  long bottom sheet bodies inline
  API parsing
  database calls
  business rules
  complex repeated card markup
```

If a widget has more than two private helper widgets below it, consider moving those helpers into separate files. If a file requires frequent scrolling to understand one screen, split it before adding more features.

## 12. Multilingual Support

Use Flutter's built-in localization with ARB files.

Recommended configuration:

```yaml
flutter:
  generate: true
```

Recommended files:

```text
lib/l10n/app_en.arb
lib/l10n/app_zh.arb
lib/l10n/app_zh_Hans.arb
lib/l10n/app_zh_Hant.arb
```

Rules:

- Do not hardcode user-facing strings in widgets after localization is introduced.
- Use generated localization accessors.
- Store backend text with language awareness when content is translated.
- Send `Accept-Language` in API requests.
- Keep Bible translation language separate from app UI language.

Language concepts:

```text
app locale:
  UI labels, tabs, buttons, errors

content language:
  sermons, bulletins, prayer requests

Bible translation:
  Chinese Union Version, ESV, etc.
```

Bible content seed:

- Canonical Bible source artifacts live in `packages/bible_content/sources/<version>/normalized/`.
- Mobile runtime assets are copied under `apps/mobile/assets/bible/<version>/`.
- The Flutter app imports the packaged seed into Drift on first use through `BibleSeedImporter`.
- Runtime seeding is split by responsibility: `local_bible_books` and `local_bible_translations` are seeded first, while `local_bible_verse_texts` is seeded lazily by the active `translationId`. First app open must not import every packaged Bible version.
- Do not hand-edit packaged Bible assets. Regenerate them from `packages/bible_content/tools/`.
- Use compact stable IDs from the normalized pipeline, for example `rom`, `rom.8`, and `rom.8.28`.
- Sermon references, study notes, highlights, bookmarks, AI explanation records, and backend APIs must use the same IDs.
- Translation language is data, not UI locale. The current seed stores translation metadata in `local_bible_translations` and verse text in `local_bible_verse_texts`.
- Current packaged public-domain Bible translations:
  - `web`: World English Bible, locale `en`.
  - `cuvs`: Chinese Union Version, Simplified, locale `zh-Hans`.
  - `cuvt`: Chinese Union Version, Traditional, locale `zh-Hant`.
- Current runtime mapping:
  - non-Chinese app locale -> `web`.
  - `zh-Hans` or generic mainland-style Chinese -> `cuvs`.
  - `zh-Hant`, `zh-TW`, `zh-HK`, or `zh-MO` -> `cuvt`.
- Store per-translation verse text in `local_bible_verse_texts`; keep stable verse IDs such as `rom.8.28` independent from translation.

Bible knowledge seed:

- Local reading-assist entities live in `apps/mobile/assets/bible_knowledge/`.
- `people.json` and `places.json` must keep multilingual fields for English, Simplified Chinese, and Traditional Chinese.
- Each entity should include stable `id`, localized `name`, localized category/role, summary, detail sections, translation-specific aliases, and optional verse-specific aliases.
- Import packaged assets into the backend CMS with `bun run db:seed:bible-knowledge`; set `BIBLE_KNOWLEDGE_ASSET_DIR` when assets are not at `apps/mobile/assets/bible_knowledge/`.
- Reader UI must show people and places as chapter-level entries, deduplicated by first appearance, instead of highlighting every repeated name in the chapter.
- Backend/admin CMS APIs preserve the same entity shape so local assets can be replaced by synced content without changing reader widgets.

Recommended first locales:

```text
zh-Hans
zh-Hant
en
es
```

## 13. Backend Architecture

Backend code lives under `backend/`.

Recommended first stack:

```text
Runtime: Bun
Framework: Fastify
Database: Postgres
ORM/query: Drizzle
Queue: Postgres-backed task tables plus explicit service/scheduler code
Object storage: S3-compatible storage
Vector search: pgvector first
```

Use explicit modules with thin route handlers, feature services, and repository
interfaces. Do not add a Redis/BullMQ worker unless the architecture docs are
updated and the VPS/runtime tradeoff is approved.

Backend module layout:

```text
backend/src/
  modules/
    admin/
    ai/
    audit/
    bible-knowledge/
    bible-verse-notes/
    care/
    courses/
    discipleship/
    giving/
    groups/
    health/
    jobs/
    life/
    media/
    members/
    newcomers/
    notifications/
    prayer/
    public/
    reading-plans/
    sermon-discussion-guides/
    sermons/
    serving/
    settings/
  shared/
    config/
    db/
    http/
    storage/
    security/
```

Rules:

- Keep route handlers thin.
- Put business logic in services.
- Put SQL/ORM access in repositories.
- Validate request bodies with schemas.
- Version routes under `/v1`.
- Add request IDs and structured logs.
- Keep admin, finance, prayer, and giving actions audit-logged.
- Keep payment webhook processing idempotent.

## 14. Backend Database

Use Postgres as the source of truth.

Core tables are defined conceptually in `architecture.md`. Implementation
should update the Drizzle schema and generate migrations with Drizzle Kit:

```text
backend/src/shared/db/schema.ts
backend/migrations/
```

Rules:

- Treat `backend/src/shared/db/schema.ts` as the backend database schema source
  of truth.
- Use `bun run db:generate` from `backend/` to create normal schema
  migrations.
- Use hand-written SQL only for complex data repair or backfill migrations, and
  keep `backend/migrations/meta/_journal.json` aligned with the SQL file.
- Use `bun run db:check` before finishing migration work.
- Use `bun run db:migrate` to apply migrations locally, in source deploys, and
  in VPS deploys.
- Use UUID primary keys for normal business entities.
- Use stable text IDs for Bible books and verses, for example `rom` and `rom.8.28`.
- Use integer cents for money.
- Store timestamps in UTC.
- Keep payment provider IDs in separate columns.
- Keep financial data access separate from content admin access.
- Add indexes for common list filters: sermon date, speaker, series, book/chapter, life post visibility, created date.
- Add audit logs before enabling finance/admin production workflows.

## 15. Plugin and Package Policy

Do not add packages casually. Add a package only when it clearly reduces complexity or provides platform integration that should not be hand-built.

Approved planned Flutter packages:

```text
app_settings
audio_service
audio_session
cupertino_icons
dio
drift
drift_sqflite
dynamic_color
firebase_core
firebase_messaging
flutter_local_notifications
flutter_markdown_plus
flutter_riverpod
flutter_secure_storage
flutter_tts
go_router
intl
just_audio
mobile_scanner
path
path_provider
riverpod_annotation
share_plus
shared_preferences
sqflite
url_launcher
```

Planned dev packages:

```text
build_runner
drift_dev
flutter_lints
flutter_test
riverpod_generator
sqflite_common_ffi
```

Feature-specific packages:

- Use `just_audio` for playback.
- Use one shared `audio_service` handler for sermon and Bible TTS media sessions; use `audio_session` for focus and interruption behavior.
- Use `flutter_tts` for Bible TTS from local text; do not hand-roll TTS.
- Use Firebase packages and `flutter_local_notifications` for FCM registration,
  foreground display, and notification permission handoff.
- Use `mobile_scanner` for event QR check-in.
- Use payment provider SDKs only when the giving flow is ready and app store policy is confirmed.
- Use PDF generation on the backend for annual giving statements, not on the client by default.

Package rules:

- Keep package versions explicit in `pubspec.yaml`.
- Run `flutter pub outdated` before large dependency upgrades.
- Avoid overlapping packages that solve the same problem.
- Prefer packages with active maintenance and platform support.

## 16. Reusable Code Rules

Write reusable code when it protects a real boundary.

Good reusable boundaries:

- API error handling.
- Auth/session storage.
- Database access.
- Repository interfaces.
- Loading/error/empty UI states.
- Date, duration, and money formatters.
- App route names and route builders.
- Section headers, info pills, list cards, bottom sheets.

Avoid premature abstraction:

- Do not create generic base repositories before two or three features prove the same pattern.
- Do not create a shared widget if it is only used once and has business-specific content.
- Do not hide simple UI behind overly configurable components.

Naming rules:

- Domain models: `BibleVerse`, `Sermon`, `LifePost`.
- DTOs: `BibleVerseDto`, `SermonDto`.
- Drift rows/tables: `LocalBibleVerses`, `LocalBibleVerse`.
- Repositories: `StudyRepository`, `SermonRepository`.
- Controllers: `StudyController`, `SermonPlayerController`.

## 17. Privacy Rules in Code

Privacy requirements should be enforced by architecture, not by comments.

Rules:

- Keep giving data out of generic analytics.
- Keep prayer data out of logs.
- Do not store raw AI prompts unless a feature explicitly requires history.
- Do not send private notes into AI context unless the user explicitly opts in.
- Keep finance routes and admin roles separate.
- Mask sensitive values in debug output.
- Add code review attention for every feature touching prayer, giving, auth, or AI context.

## 18. Testing Strategy

Use tests where behavior matters.

Flutter tests:

```text
unit:
  formatters, mappers, repositories with fake data sources

widget:
  major screens, loading/error/empty states, navigation shell

integration:
  login, reading flow, sermon playback flow, giving flow later
```

Backend tests:

```text
unit:
  services, validators, permission checks

integration:
  API routes with test database

workflow:
  local sermon package import, webhook idempotency, PDF statement generation
```

Required before merging sensitive changes:

- Auth tests.
- Permission tests.
- Giving webhook idempotency tests.
- Prayer visibility tests.
- API error tests.

## 19. Implementation Order

Recommended next steps:

1. Keep Study reader stable while refining Bible UX, notes, bookmarks, verse reflections, and AI explanation surfaces.
2. Keep sermon audio playback aligned with Android / iOS native media controls and reviewed sermon package imports.
3. Keep App, Admin Web, public Web, backend routes, SDK docs, and route registry in lockstep when features change.
4. Continue production hardening for auth, notification permission, giving, annual statements, prayer moderation, and audit logs.
5. Prefer small feature refinements and verification over adding large unbounded modules.

## 20. Definition of Done

For frontend feature work:

- UI follows Material 3 and app theme.
- Large screens are split into small section widgets.
- User-facing strings are localized once l10n is enabled.
- Data access goes through repository/provider layers.
- Loading, error, empty, and offline states are handled.
- Sensitive data is not cached without explicit approval.
- `dart format`, `flutter analyze`, and relevant tests pass.

For backend feature work:

- Route is documented in `docs/api.md`.
- Request validation exists.
- Permission checks exist.
- Database migration exists if schema changed.
- Tests cover success and important failure paths.
- Sensitive actions are audit-logged.
