# Line-by-line audit - 2026-07-08

Status: complete for the tracked files covered by this audit pass.

This audit tracks the strict review requested for the repository. Text files are
reviewed line by line in batches. Binary files and generated resource artifacts
are tracked separately with the reason they cannot be line-reviewed and the
validation used instead.

## Scope

- Source of file truth: `git ls-files`.
- Tracked files at audit start: 1125.
- Tracked files at completion pass: 1137.
- Tracked text line count at audit start: 501662.
- Ignored build output such as `dist/` is out of scope unless explicitly
  requested later.

## Rules

1. Mark a text file complete only after reading its contents directly.
2. Mark generated text separately when it is read or structurally validated.
3. Mark binary files separately with file type, hash, references, and use.
4. If a defect is found, fix it in the owning layer, verify, and commit that
   stage before continuing.
5. Do not count a test suite or grep scan as a substitute for line review.

## Batches

| Batch | Area | Status | Notes |
| --- | --- | --- | --- |
| 0 | Startup docs and workflow | Complete for startup | Read required startup and workflow docs to establish boundaries; these docs will still be line-reviewed again in the docs batch. |
| 1 | Root tracked files | Complete | Line-reviewed `.gitignore`, `AGENTS.md`, `README.md`, `package.json`, `tsconfig.base.json`, and `bun.lock` lines 1-1237. No defects found. |
| 2 | Workflow, architecture, and core docs | Complete | Line-reviewed `docs/agent-workflow/*.md`, `docs/architecture*.md`, `docs/architecture/*.md`, and `docs/core/*.md`. Fixed one duplicate architecture section number. |
| 3 | Capability docs | Complete | Line-reviewed `docs/capabilities/*.md`. No defects found. |
| 4 | Domain docs | Complete | Line-reviewed `docs/domains/*.md`. No defects found. |
| 5 | Surface docs | Complete | Line-reviewed `docs/surfaces/*.md`. Fixed one stale admin Web stage wording. |
| 6 | Feature docs | Complete | Line-reviewed `docs/features/*.md`. No defects found. |
| 7 | SDK docs | Complete | Line-reviewed `docs/sdk.md` and `docs/sdk/*.md`. Fixed one stale member verification code description. |
| 8 | Top-level product, API, release, security, testing, and development docs | Complete | Line-reviewed top-level docs including `docs/api.md` and `docs/development_guidelines.md`. Fixed stale auth, webhook, package, UI, public Web, deployment, privacy, and numbering rules. |
| 9 | Backend Config, Migrations, Shared Core, Auth, Settings, Public Landing, AI, Bible, Members | Complete | Line-reviewed backend config, migrations, shared core, admin/member auth, settings, public landing, AI, Bible knowledge, Bible verse notes, and members source files. No code changes required in that source batch. |
| 10 | Backend Life Posts, Event Registration, Check-In, and Life Images | Complete | Line-reviewed backend Life post/event/check-in/image source files. Fixed stale legacy JSON body parsing and S3 missing-object handling. |
| 11 | Backend Jobs, Admin Job Routes, Job Contract, and Postgres Smoke | Complete | Line-reviewed backend jobs, admin job routes, job contract, and Postgres smoke. Fixed in-memory job pagination cursor semantics. |
| 12 | Backend Notification Delivery, Push Devices, Inbox, Retry, and Admin Operations | Complete | Line-reviewed backend notification delivery, inbox, push devices, retry scheduler, admin notification routes, route wiring, and push contract. Fixed inbox fanout cap, admin retry/cancel audit records, and cancel error ownership. |
| 13 | Backend Sermons, Audio Storage, Publishing, Recommendations, and Admin Workflow | Complete | Line-reviewed backend sermon repositories, audio storage, routes, services, recommendations, admin workflow, and sermon contract. Fixed cursor semantics and publish notification audit summaries. |
| 14 | Backend Prayer Requests, Moderation, Shared Visibility, and Notifications | Complete | Line-reviewed backend prayer repositories, routes, service, admin moderation, and contract. Added redacted audit records for public/member prayer submissions. |
| 15 | Backend Newcomer Follow-Up | Complete | Line-reviewed backend newcomer repositories, routes, service, admin routes, and contract. No code changes required. |
| 16 | Backend Care | Complete | Line-reviewed pastoral care backend, contract, docs, and target tests. Fixed follow-up status advancement and access audit gaps. |
| 17 | Backend Groups | Complete | Line-reviewed group ministry backend, contract, docs, and target route tests. Fixed group visibility membership access and material assignment error ownership. |
| 18 | Backend Courses | Complete | Line-reviewed course learning backend, contract, docs, and course route test segment. No source changes required. |
| 19 | Backend Serving | Complete | Line-reviewed serving schedule backend, contract, docs, and target tests. Fixed covered confirmation and invalid check-in state guards. |
| 20 | Backend Discipleship Journey | Complete | Line-reviewed discipleship journey backend, contract, docs, schema segment, and target tests. Fixed task reference validation, stage/task audit coverage, and assignment aggregate status updates. |
| 21 | Backend Reading Plan | Complete | Line-reviewed reading plan backend, contract, docs, schema segment, and target tests. Fixed assignment aggregate completion/reopen state and progress `completedAt` clearing. |
| 22 | Backend Sermon Discussion Guide | Complete | Line-reviewed sermon discussion guide backend, contract, docs, schema segment, and target tests. Fixed response question validation, first-version group visibility guard, and private-response list exposure. |
| 23 | Backend Bible Verse Notes | Complete | Line-reviewed Bible verse notes backend, contract, docs, API/SDK sections, and target tests. Fixed admin deleted-note default visibility and added failure-chain/audit coverage. |
| 24 | Mobile Member Session Storage | Complete | Line-reviewed member session storage owner, auth docs, models, and target tests. Moved member access token persistence behind secure `SessionStore`. |
| 25 | Mobile Core Entry, API, Config, and Shell | Complete | Line-reviewed mobile core entry/router/API/config/storage/settings/shell files. Fixed shared `Accept-Language` injection and release fallback API URL. |
| 26 | Mobile Shared UI, Theme, and Utilities | Complete | Line-reviewed shared widgets, theme utilities, UI system doc, and target tests. Fixed shared touch targets below 44dp. |
| 27 | Mobile Study Local Bible Catalog and Repository | Complete | Line-reviewed local Bible domain/catalog/repository/import/search/annotation files and target tests. Fixed static catalog book ids to match packaged Bible assets and removed fake-repository aliases. |
| 28 | Mobile Study Core Presentation Pages | Complete | Line-reviewed Study tab, Bible reader, search page, reader app bar, scroll/TTS sessions, sheet actions, and assist settings providers. No source changes required. |
| 29 | Mobile Study Reader Widgets and Notes UI | Complete | Line-reviewed Study reader widgets, reader sheets, AI/person/place helpers, reading-plan widgets, note domain/repository, and target tests. Fixed shared-note delete reseeding from stale provider data. |
| 30 | Mobile Study Extended Data, TTS, Knowledge, and Reading Plan Progress | Complete | Line-reviewed Study AI/TTS/knowledge/reading-plan data and domain files plus target tests. Fixed reading-plan progress `completedAt` ownership so backend, not App/client payloads, sets completion time. |
| 31 | Mobile Study Target Test Completion | Complete | Line-reviewed remaining Study-focused tests and widget test harness. Fixed AI Study test data to use canonical dot-style verse ids. |
| 32 | Mobile Sermons Data, Player, and Repository Tests | Complete | Line-reviewed Sermons domain, DTOs, data sources, repositories, player session, mock data, and target tests. Fixed unencoded sermon/discussion-guide path ids in API client calls. |
| 33 | Mobile Sermons Presentation and Playback Interaction | Complete | Line-reviewed Sermons presentation pages/widgets and widget checks. Fixed playback source-switch loading ownership and bottom-sheet input keyboard behavior. |
| 34 | Mobile Life Feed and Event Data Chain | Complete | Line-reviewed Life feed/event domain, DTO, data sources, repositories, cache, mock data, and target tests. Fixed Life API path id encoding and mock visibility filtering. |
| 35 | Mobile Giving and Annual Statements | Complete | Line-reviewed mobile giving/statement domain, repository, file/export services, UI, and target tests. Fixed async mounted guards and localized empty giving category fallback. |
| 36 | Mobile Prayer Requests App Chain | Complete | Line-reviewed mobile Prayer request domain, repository, section/sheet/cards, docs, SDK notes, and target tests. Fixed duplicate request ownership so member-owned copies are not overwritten by public/shared duplicates. |
| 37 | Mobile Pastoral Care App Chain | Complete | Line-reviewed mobile Care request domain, DTO, repository, section/sheet/card, support widgets, docs, and target tests. App code already respected member-safe summary boundaries; added Care provider failure coverage. |
| 38 | Mobile Group, Course, and Serving App Chains | Complete | Line-reviewed mobile group/course/serving domain, DTOs, repositories, cards, sections, docs, and target tests. Fixed unencoded member support action path ids. |
| 39 | Mobile Newcomer App Chain | Complete | Line-reviewed mobile newcomer domain, DTO, repository, welcome sheet, docs, and target tests. Added guest external-user regression and stabilized sibling sheet success snackbar context. |
| 40 | Mobile Life Dashboard, Detail, and Event UI | Complete | Line-reviewed mobile Life dashboard, detail, event registration/check-in UI, card parts, classification, hero, and target tests. Removed duplicate Life post image fallback implementation. |
| 41 | Mobile Notification And Push App Chain | Complete | Line-reviewed mobile notification permission, device registration, local/remote inbox, notification center UI, controller, docs, and target tests. Fixed unencoded notification paths/routes and guest registration fallback. |
| 42 | Mobile Mine, Member Profile, and Preferences | Complete | Line-reviewed mobile Mine/member session, profile, preferences, sign-in, About, docs, and target tests. Removed stale Mine overview UI, unified Mine chips, trimmed About links, and made push sync best-effort after auth state changes. |
| 43 | Mobile Discipleship Journey App Chain | Complete | Line-reviewed mobile discipleship docs, domain, DTO, repository, Mine card, API contract/route snippets, and target tests. Fixed local-time DTO fallback and hid internal journey ids from Mine UI. |
| 44 | Mobile Drift Database Core and Migrations | Complete | Line-reviewed mobile database docs, hand-written Drift schema/tables/connection/tests, and structurally validated generated Drift output. Added idempotent before-open performance indexes and migration coverage. |
| 45 | Mobile Cross-Cutting Quality Tests and Harness | Complete | Line-reviewed accessibility, l10n placeholder, user-facing error, and widget harness tests. No source changes required. |
| 46 | Admin Web Core Shell, API, Auth, Config, and I18n | Complete | Line-reviewed admin Web core entry, router, shell, API client, auth store, config, Vuetify/theme, CSS, and i18n. Fixed stale in-memory auth state after refresh-token failure. |
| 47 | Admin Web Business API Helpers | Complete | Line-reviewed remaining admin Web `core/api` helpers and SDK workflow docs. Added shared path segment encoding and removed old sermon list array compatibility. |
| 48 | Admin Web Auth, Dashboard, Audit, and Settings Pages | Complete | Line-reviewed login, dashboard, audit logs, and settings UI/presenter files. Fixed login redirect/email normalization and settings submit permission guard. |
| 49 | Admin Web Life Components and Presenters | Complete | Line-reviewed Life/event registration components, markdown preview/editor, preview cards, and presenters. Removed stale Life `processing/failed` status colors. |
| 50 | Admin Web Life Controller and Page | Complete | Line-reviewed Life composables and page wiring. Added controller-side action guards and normalized Life post payload text fields. |
| 51 | Admin Web Sermon Components, AI Draft Panel, and Pipeline Presenter | Complete | Line-reviewed sermon admin UI components, shared AI draft panel, and sermon pipeline presenter. No source changes required in this layer. |
| 52 | Admin Web Sermon Controller, Forms, Audio State, and Page Wiring | Complete | Line-reviewed sermon composables and page wiring. Removed status mutation from ordinary save and added controller-side action guards. |
| 53 | Admin Web Bible Knowledge and Bible Verse Notes | Complete | Line-reviewed Bible knowledge and public verse-note moderation pages. Added action guards, trimmed knowledge payloads, and fixed deleted-note moderation UI. |
| 54 | Admin Web Pastoral Care, Courses, and Groups | Complete | Line-reviewed care, course, and group admin pages/components after splitting truncated reads into smaller chunks. Added action guards, normalized payloads, and aligned pending UI states. |
| 55 | Admin Web Members, Users, Newcomers, Prayer, Notifications, and Serving | Complete | Line-reviewed remaining single-page admin ministry/system surfaces in this batch. Added guarded actions, mutation permission checks, trimmed payloads, safe datetime conversion, and serving team-role consistency checks. |
| 56 | Admin Web Jobs, Reading Plans, and Sermon Discussion Guides | Complete | Line-reviewed jobs, reading plan, and sermon discussion guide admin files. Added guarded job actions, reading-plan payload/state guards, and discussion guide save/response moderation guards. |
| 57 | Admin Web Discipleship Journey | Complete | Line-reviewed discipleship admin docs, API helper, contract, components, controller, and page. Added guarded journey/stage/task/assignment/progress actions and split page controller logic out of the page. |
| 58 | Admin Web Giving Finance | Complete | Line-reviewed giving finance docs, contract, admin API helper, controller, page, and giving components. Added guarded export/statement/fund actions, statement download wiring, and fund maintenance UI. |
| 59 | Backend Giving Finance | Complete | Line-reviewed backend giving repositories, services, routes, Stripe provider/webhook, and target tests. Fixed Postgres non-succeeded status summary behavior and added repository regression coverage. |
| 60 | Backend Core/Auth/AI/Public/Members Test Closure | Complete | Line-reviewed Batch 9 related backend test files and shared test helpers. Fixed audit table omissions for batches 9-15; no source changes required. |
| 61 | Public Web Landing Surface | Complete | Line-reviewed public landing Vue/Vuetify source, API/locale helpers, styles, config, and logo asset metadata. Fixed external-link rel safety and localized service image alt text. |
| 62 | API Contracts Core, Life, Members, Public, Settings, and Route Registry | Complete | Line-reviewed remaining shared contract files and route registry. Route coverage check passed; no source changes required. |
| 63 | Shared Packages and Repository Check Scripts | Complete | Line-reviewed shared type/UI token packages plus repository check and prebuilt release scripts. Verification scripts passed; no source changes required. |
| 64 | VPS Deployment Manager Script | Complete | Line-reviewed the full VPS deployment manager and deployment doc. Shell syntax/help checks passed; no source changes required. |
| 65 | Backend Jobs, Notifications, Newcomer, and Postgres Test Closure | Complete | Line-reviewed backend test config plus Jobs, Notifications, Newcomer, and Postgres target tests. Targeted suite passed; no source changes required. |
| 66 | Backend Life, Prayer, Sermon Media, Event Registration, and Statement Test Closure | Complete | Line-reviewed remaining backend Life, Prayer, Sermon media, event registration, and annual statement tests. Targeted suite passed; no source changes required. |
| 67 | Backend Admin Routes, Placeholders, and Drizzle Snapshot Metadata | Complete | Line-reviewed remaining small backend/admin placeholder files and structurally validated generated Drizzle snapshots 0031-0046. No source changes required. |
| 68 | Mobile Android Platform, App Metadata, and Launcher Assets | Complete | Line-reviewed Flutter/Android platform config and structurally validated Android launcher PNG assets. Flutter analyze passed with the known flutter_tts SPM warning. |
| 69 | Mobile iOS Platform, Bundle Identity, and App Assets | Complete | Line-reviewed iOS project/config/source files and structurally validated iOS app icons/launch images. Fixed the default iOS bundle identifier. |
| 70 | Mobile Firebase Stub and Localization Sources | Complete | Line-reviewed Firebase stub and ARB localization sources, structurally validated generated localization Dart, and unified Chinese annual statement wording to annual proof. |
| 71 | Mobile Bible Resource Assets and Normalizer | Complete | Line-reviewed the Bible normalizer and knowledge repository contract, structurally parsed every bundled Bible JSONL line, fixed leaked USFM headings and Mark reference typos, and synced app Bible assets. |
| 72 | Local Sermon Studio Tool | Complete | Line-reviewed the local sermon processing CLI/GUI package, tests, and setup docs. Fixed repo doc links, canonical scripture id filtering, and manifest-owned audio upload selection. |
| 73 | Bible Content Source Package Metadata | Complete | Line-reviewed Bible content docs, metadata, and license files; structurally validated raw source zips and remaining normalized mapping/chapter artifacts. Added missing CUV metadata records. |
| 74 | Mobile Root Config and Placeholder Files | Complete | Line-reviewed mobile root Flutter/analyzer/l10n config files and structurally validated repository placeholder files as newline-only `.gitkeep` entries. No source changes required. |
| 75 | Mobile Pubspec and Dependency Lock | Complete | Line-reviewed the mobile pubspec and every lockfile line. Fixed the stale default Flutter package description. |
| 76 | Mobile Launcher and Launch Image Binary Remainders | Complete | Individually validated previously grouped Android monochrome/round launcher PNGs and iOS launch image variants with file type, dimensions, hashes, and references. No source changes required. |
| 77 | Bible Content Normalized Generated Outputs | Complete | Structurally validated every normalized Bible JSON/JSONL output for WEB, CUVS, and CUVT, including per-line chapter and verse parsing. No source changes required. |
| 78 | Audit Ledger Self-Review | Complete | Line-reviewed this audit ledger itself through line 3366, then updated completion status and self-review evidence. |

## Findings

### Fixed

- `docs/architecture/backend_web.md` had duplicate `## 13` headings. Changed the related-docs section to `## 14`.
- `docs/surfaces/admin_web.md` described third-stage management entries as future additions even though the route map already includes them. Updated wording to first-version entries already added.
- `docs/sdk/errors.md` described `member_login_code_invalid` as a normal login code error. Current code uses that error for registration email verification, so the description was corrected.
- `docs/api_standards.md` still used the old Stripe webhook path and treated email verification as login. Updated it to `/v1/webhooks/giving/stripe`, email/password login, and optional registration email verification.
- `docs/api.md` had stale auth examples, stale giving routes, old webhook path, outdated module layout, stale public/privacy classification, and old open decisions. Updated the contract to match the current route registry and product boundary.
- `docs/database.md` referenced durable event attendance state in a removed table name. Updated it to `event_registrations`.
- `docs/privacy_security.md` described email verification code member login. Updated it to email/password login plus optional registration email verification.
- `docs/product_vision.md` and `docs/product_vision_zh.md` described App notification preferences too broadly. Updated the wording to system notification permission entry plus backend delivery filters.
- `docs/testing.md` and `docs/ui_design_system.md` had duplicate or stale headings/sections. Updated test taxonomy, Mine UI structure, and accessibility numbering.
- `docs/vps_deployment.md` said separate public Web domains were unsupported while the script exposes `--public-origin`. Updated the limitation wording.
- `docs/development_guidelines.md` contained early package, module, public Web, mobile directory, and implementation-order assumptions. Updated it to the current monorepo layout and package strategy.
- Mobile static Bible catalog ids used English slugs such as `romans` and `genesis`, while packaged Bible assets and verse ids use canonical abbreviations such as `rom` and `gen`. Updated static catalog ids, aligned the widget fake repository, and added an asset/catalog regression test.
- Mobile shared verse note editing could reseed a just-deleted note into the input field if provider data refreshed with stale content. Changed note seeding to ignore empty note lists and prevent stale reseeding after delete, with a widget regression test.
- Reading-plan day progress accepted client-supplied `completedAt` through the shared contract and backend repositories, and the App also sent its own completion timestamp. Removed `completedAt` from the update request contract, made both backend repositories derive completion time from status, and stopped the App from sending a client timestamp.
- AI Study repository test data used a hyphenated verse id (`rom-8-28`) even though the Bible content contract uses canonical dot ids such as `rom.8.28`. Updated the test request and assertion to use the canonical id shape.
- Sermon progress and sermon discussion guide App repositories inserted sermon/guide ids directly into URL paths. Encoded those path components and added regression tests with slash-containing ids.
- Sermon playback source loading could ignore a new sermon selected while a previous audio source was still loading, leaving the player tied to stale loading state. Added loading URL ownership to `SermonPlayerSession`, added a regression test, and aligned sermon bottom-sheet inputs with keyboard-safe shared filled fields.
- Life App API data source inserted life post ids directly into URL paths, and mock Life remote exposed members-only content to guests. Encoded Life post path segments, kept empty list queries free of trailing `?`, and made mock visibility follow public/member boundaries.
- Giving checkout and annual statement export async error paths could try to show state/snackbars after their widget context was unmounted. Added mounted guards, and changed the empty giving transaction category fallback from hardcoded English to `l10n.givingTitle`.
- Mobile Prayer request deduplication used a last-write-wins map in both repository and UI section merge paths, so a public/shared duplicate could overwrite the member-owned version. Changed both paths to preserve the first occurrence, keeping member/private/review state authoritative, and added repository/widget regressions.
- Mobile member support provider tests covered group, course, and serving repository failures but not Care repository failures. Added Care provider failure coverage so the member-safe Care section's retryable error path remains protected.
- Mobile group application, course enrollment, and serving confirm/leave repositories interpolated ids directly into URL paths. Encoded all action path ids and added a shared repository regression covering slash/space ids and bearer auth.
- Mobile newcomer repository tests did not cover the guest external-user submission path. Added a guest regression for no bearer token, external user id header, trimmed contact payload, and omitted empty fields. Newcomer, Prayer, and Care bottom sheets also now capture `Navigator`/`ScaffoldMessenger` before async work so success snackbars do not depend on a popped sheet context.
- Mobile Life post image fallback was implemented twice with duplicate icon mapping in `life_post_card_parts.dart` and `life_post_image_fallback.dart`. Consolidated fallback rendering into the shared widget with an optional title mode used by cards.
- Mobile notification inbox read/archive paths and generated push deep links interpolated ids without path encoding. Encoded notification ids and generated Life/Sermon route path segments. Push startup now falls back to guest token registration if member session restore fails, preserving the guest public push contract.
- Mobile Mine still carried an unused `MemberLifeOverviewCard` implementation for the old second-card church-life UI even though the active Mine page and tests intentionally fold those chips into the profile card. Removed the stale file, migrated Mine profile chips to the shared `AppChip`, normalized About link trimming before opening, hid verification `devCode` outside debug builds, and made push registration sync best-effort after member sign-in/sign-out so notification failures do not block auth state changes.
- Mobile discipleship DTOs used `DateTime.now()` when assignment/progress timestamps were missing, creating client-local time as if it were backend state. They now use a stable unknown timestamp fallback. Mine discipleship cards also displayed raw `journeyId` values, so the App now shows a localized feature title instead of exposing internal ids.
- Mobile Drift database docs required local performance indexes for Bible, Life, Study, and SyncQueue, and actual local Sermon/Life queries also sort by sermon date and weighted publish dates. The database only created Bible verse-text and Study indexes, and only on create/old upgrade paths. Added idempotent `beforeOpen` index creation for Bible, Sermon, Life, Study, and SyncQueue, with migration-test coverage.
- Admin Web API refresh failure cleared only localStorage, so the Pinia auth store could keep stale user and permission state until reload. Refresh failure now clears stored session through the shared auth storage helper, emits a session-cleared event, and the app bootstrap clears the in-memory auth store and redirects protected routes to login.
- Admin Web business API helpers interpolated many ids directly into URL path segments. Added a shared `pathSegment(...)` helper and routed admin users, Bible knowledge, Bible verse notes, care, courses, discipleship, giving, groups, jobs, life posts, members, newcomers, notifications, prayer requests, reading plans, sermon discussion guides, sermons, serving, and settings path ids through it.
- Admin Web sermon list helper still accepted the old array response shape. It now validates only the current `sermonListResponseSchema` contract.
- Admin login accepted any redirect query that started with `/` and sent untrimmed email input to the backend. Login now trims email before submit and only accepts single-slash internal redirects, rejecting protocol-relative `//...` values.
- Admin settings save relied on a disabled button for `settings:update` permission, but the form submit handler itself did not guard permission. `saveSetting()` now returns early when the admin lacks update permission.
- Admin Life presenter still included `processing` and `failed` colors even though Life post status is limited to `draft`, `needs_review`, `published`, and `archived`. Removed the stale status entries and changed status/visibility color maps to typed `Record<..., string>` maps.
- Admin Life page submit/actions relied on disabled buttons for some permission and readiness gates. The controller now exposes guarded action methods for save, review, publish, unpublish, archive, and delete, so form submit or emitted events cannot bypass `life_posts:update`, `life_posts:publish`, or publish-readiness checks.
- Admin Life save/publish payloads used trimmed values for validation but sent untrimmed type/title/body/meta/icon fields to the backend. Payload construction now trims those fields and falls back to the default icon when the icon field is blank.
- Admin Sermon ordinary save payload carried `status` from the metadata form, making the metadata tab a hidden status-migration entry. Ordinary save now sends only content fields; review/publish actions explicitly inject their target status and still pass through backend publish validation.
- Admin Sermon page submit/actions and audio actions called mutations directly from the page or relied on disabled buttons. The controller now owns guarded action methods for create, save, review, publish, status transitions, archive/delete, and audio upload/preview/delete.
- Admin Bible Knowledge create/update/delete actions relied on form buttons and sent untrimmed text payloads. The page now has guarded save/delete functions, mutation-level permission checks, trimmed payload construction, and a readable invalid JSON error for verse alias input.
- Admin Bible Verse Notes hide/restore actions relied on button state and showed a hide action for deleted notes. Moderation now has guarded action functions, mutation-level permission checks, localized status/author labels, and only exposes hide for `published` notes and restore for `hidden` notes.
- Admin Care, Courses, and Groups pages relied on direct mutation calls or UI-disabled state for some privileged actions. Added guarded submit/action methods, mutation-level permission checks, trimmed payload builders, invalid date guards, capacity/progress normalization, and pending-state disabled/loading UI.
- Admin Members, Users, Newcomers, Prayer, Notifications, and Serving pages had the same direct-action pattern in several places. Added page-level guarded actions plus mutation-level permission/readiness checks, normalized text payloads, safe datetime conversion, notification retry/cancel state guards, and Serving assignment team-role consistency checks.
- Admin Jobs, Reading Plans, and Sermon Discussion Guides had direct action/mutation paths and missing readiness guards. Added guarded job cancel/mark-succeeded actions, reading-plan save/day/assignment payload builders and assignment constraints, and discussion-guide save/response-hide permission/readiness guards.
- Admin Discipleship page had direct mutation paths, insufficient mutation-level readiness guards, and grew past the Admin Web page hard limit when those guards were added. Moved query/mutation/payload ownership into a page controller, added guarded actions for journey/stage/task/assignment/progress updates, required active journeys for assignment creation, required references for non-manual tasks, and reduced the page back to layout composition.
- Admin Giving exposed export and statement generation through direct mutation objects, had no Admin Web statement download action, and had fund create/update API helpers that were not wired into the UI. Added controller-owned guarded export/generate/download/fund-save actions, mutation-level `giving:export` and `giving:manage` checks, statement download wiring, typed CSV download handling, and a fund maintenance drawer for create/update.
- Backend Postgres giving summaries ignored non-succeeded status filters by overwriting the requested status with `succeeded`, while the in-memory repository returned an empty succeeded-only summary for `refunded`, `pending`, or `failed` filters. Postgres now returns an empty yearly summary for non-succeeded summary requests, and a repository regression test prevents accidental successful-gift leakage.
- Audit batch table rows for batches 9-15 were missing even though their detailed sections existed. Restored the summary rows so the table matches the completed batch bodies.
- Public Web new-tab actions emitted `rel="noreferrer"` without `noopener`, and the service section image alt text was hardcoded in Simplified Chinese. Updated external link rel output to `noopener noreferrer` and made service image alt text come from the localized backend service title.
- Bible USFM normalization treated non-verse heading and metadata marker lines as verse continuations after a verse had started, leaking Chinese section headings, WEB Psalm 119 acrostic labels, and Song of Songs speaker labels into verse text. The normalizer now skips those markers during verse continuation parsing and the normalized/app Bible assets were regenerated and synced.
- Bible knowledge related verse ids used the non-canonical `mak` book id for four Mark references. Updated them to the app's canonical `mrk` id so related-verse lookup can resolve those references.
- Sermon Studio's scripture-reference sanitizer accepted shape-valid but non-canonical book ids such as `mak.5.22` and `mark.5.22`. Added a 66-book canonical id allowlist and regression coverage.
- Sermon Studio upload selected the first non-normalized file from the `source/` directory instead of the original audio file named in the manifest. Upload now resolves `manifest.audio.fileName`, preventing stale or extra source files from being uploaded accidentally.
- Sermon Studio README linked repo-root docs as if they were local docs. Updated links to point to the correct repo-relative locations.
- Bible content source rules required each version to record source URL, date, and checksum in `metadata.json`, but CUVS and CUVT only had raw archives and copyright HTML. Added metadata records for both Chinese versions and updated the package layout docs.

### Resolved Follow-Ups

- Mobile docs require access tokens to use secure storage. Batch 24 fixed the source-code issue by moving member access token persistence behind `SessionStore` backed by `flutter_secure_storage`.

## Completed Files

### Batch 1 - Root Tracked Files

- `.gitignore` - 60 lines reviewed.
- `AGENTS.md` - 129 lines reviewed.
- `README.md` - 132 lines reviewed.
- `package.json` - 44 lines reviewed.
- `tsconfig.base.json` - 15 lines reviewed.
- `bun.lock` - 1237 lines reviewed.

Notes:

- `README.md` references `docs/product_vision.md`; the referenced file exists.
- `README.md` includes the current test API URL. It is a deployment endpoint reference, not a secret.
- `bun.lock` was reviewed as a generated lockfile; no manual package inconsistency was found in this pass.

### Batch 2 - Workflow, Architecture, And Core Docs

- `docs/agent-workflow/agent_ownership.md` - 112 lines reviewed.
- `docs/agent-workflow/backend_workflow.md` - 72 lines reviewed.
- `docs/agent-workflow/code_boundaries.md` - 50 lines reviewed.
- `docs/agent-workflow/code_splitting.md` - 58 lines reviewed.
- `docs/agent-workflow/docs_linkage.md` - 33 lines reviewed.
- `docs/agent-workflow/failure_escalation.md` - 44 lines reviewed.
- `docs/agent-workflow/file_naming.md` - 63 lines reviewed.
- `docs/agent-workflow/frontend_workflow.md` - 52 lines reviewed.
- `docs/agent-workflow/product_boundaries.md` - 57 lines reviewed.
- `docs/agent-workflow/sdk_workflow.md` - 63 lines reviewed.
- `docs/agent-workflow/verification.md` - 69 lines reviewed.
- `docs/architecture.md` - 160 lines reviewed.
- `docs/architecture/app.md` - 254 lines reviewed.
- `docs/architecture/backend_web.md` - 283 lines reviewed.
- `docs/architecture_integration_audit.md` - 336 lines reviewed.
- `docs/core/README.md` - 83 lines reviewed.
- `docs/core/ai_contract.md` - 97 lines reviewed.
- `docs/core/contracts.md` - 128 lines reviewed.
- `docs/core/error_model.md` - 73 lines reviewed.
- `docs/core/feature_integration.md` - 154 lines reviewed.
- `docs/core/lifecycle.md` - 87 lines reviewed.
- `docs/core/logic_chain.md` - 56 lines reviewed.

Notes:

- `docs/agent-workflow/backend_workflow.md` uses `backend/`; the actual repository contains `backend/`, so this is current.
- `docs/architecture/backend_web.md` section numbering was corrected during this batch.

### Batch 3 - Capability Docs

- `docs/capabilities/README.md` - 38 lines reviewed.
- `docs/capabilities/ai_provider.md` - 82 lines reviewed.
- `docs/capabilities/audio_playback.md` - 98 lines reviewed.
- `docs/capabilities/capability_matrix.md` - 32 lines reviewed.
- `docs/capabilities/data_export.md` - 53 lines reviewed.
- `docs/capabilities/media_processing.md` - 52 lines reviewed.
- `docs/capabilities/notification_delivery.md` - 69 lines reviewed.
- `docs/capabilities/object_storage.md` - 61 lines reviewed.
- `docs/capabilities/payment_gateway.md` - 49 lines reviewed.
- `docs/capabilities/pdf_generation.md` - 47 lines reviewed.
- `docs/capabilities/qr_check_in.md` - 53 lines reviewed.
- `docs/capabilities/scheduled_notification.md` - 57 lines reviewed.
- `docs/capabilities/tts_playback.md` - 48 lines reviewed.

Notes:

- Capability owner paths and provider boundaries are internally consistent in this pass.

### Batch 4 - Domain Docs

- `docs/domains/README.md` - 48 lines reviewed.
- `docs/domains/analytics_metrics.md` - 33 lines reviewed.
- `docs/domains/audit_log.md` - 49 lines reviewed.
- `docs/domains/bible_content.md` - 35 lines reviewed.
- `docs/domains/content_visibility.md` - 46 lines reviewed.
- `docs/domains/course_learning.md` - 36 lines reviewed.
- `docs/domains/discipleship_journey.md` - 38 lines reviewed.
- `docs/domains/event_attendance.md` - 35 lines reviewed.
- `docs/domains/giving_finance.md` - 35 lines reviewed.
- `docs/domains/giving_fund.md` - 32 lines reviewed.
- `docs/domains/media_asset.md` - 35 lines reviewed.
- `docs/domains/member_identity.md` - 57 lines reviewed.
- `docs/domains/ministry_group.md` - 34 lines reviewed.
- `docs/domains/newcomer_followup.md` - 37 lines reviewed.
- `docs/domains/notification_preference.md` - 38 lines reviewed.
- `docs/domains/pastoral_care.md` - 39 lines reviewed.
- `docs/domains/privacy.md` - 35 lines reviewed.
- `docs/domains/reading_plan.md` - 38 lines reviewed.
- `docs/domains/sermon_discussion_guide.md` - 38 lines reviewed.
- `docs/domains/serving_schedule.md` - 33 lines reviewed.

Notes:

- Domain source-of-truth statements are consistent with the architecture docs in this pass.

### Batch 5 - Surface Docs

- `docs/surfaces/README.md` - 33 lines reviewed.
- `docs/surfaces/admin_web.md` - 124 lines reviewed.
- `docs/surfaces/backend_api.md` - 102 lines reviewed.
- `docs/surfaces/mobile_app.md` - 112 lines reviewed.
- `docs/surfaces/public_web.md` - 138 lines reviewed.

Notes:

- Surface route maps remain bounded to UI/API expression layers; no source-of-truth violation was found in these docs.
- `docs/surfaces/admin_web.md` stage wording was corrected during this batch.

### Batch 6 - Feature Docs

- `docs/features/README.md` - 115 lines reviewed.
- `docs/features/ai_bible_study.md` - 165 lines reviewed.
- `docs/features/ai_content_assist.md` - 165 lines reviewed.
- `docs/features/annual_statement.md` - 171 lines reviewed.
- `docs/features/bible_tts.md` - 150 lines reviewed.
- `docs/features/bible_verse_notes.md` - 163 lines reviewed.
- `docs/features/church_life_publishing.md` - 104 lines reviewed.
- `docs/features/course_learning.md` - 91 lines reviewed.
- `docs/features/discipleship_journey.md` - 196 lines reviewed.
- `docs/features/event_attendance.md` - 100 lines reviewed.
- `docs/features/event_registration.md` - 195 lines reviewed.
- `docs/features/giving_flow.md` - 189 lines reviewed.
- `docs/features/giving_funds.md` - 91 lines reviewed.
- `docs/features/group_ministry.md` - 120 lines reviewed.
- `docs/features/member_profile.md` - 98 lines reviewed.
- `docs/features/ministry_analytics.md` - 85 lines reviewed.
- `docs/features/newcomer_followup.md` - 159 lines reviewed.
- `docs/features/notification_delivery.md` - 119 lines reviewed.
- `docs/features/pastoral_care.md` - 97 lines reviewed.
- `docs/features/prayer_moderation.md` - 87 lines reviewed.
- `docs/features/reading_plan.md` - 150 lines reviewed.
- `docs/features/sermon_discovery.md` - 88 lines reviewed.
- `docs/features/sermon_discussion_guide.md` - 153 lines reviewed.
- `docs/features/sermon_publishing.md` - 212 lines reviewed.
- `docs/features/serving_schedule.md` - 119 lines reviewed.

Notes:

- Feature documents consistently describe business loops rather than individual pages or API endpoints in this pass.

### Batch 7 - SDK Docs

- `docs/sdk.md` - 102 lines reviewed.
- `docs/sdk/admin.md` - 64 lines reviewed.
- `docs/sdk/ai.md` - 85 lines reviewed.
- `docs/sdk/analytics.md` - 26 lines reviewed.
- `docs/sdk/auth.md` - 63 lines reviewed.
- `docs/sdk/bible.md` - 64 lines reviewed.
- `docs/sdk/errors.md` - 96 lines reviewed.
- `docs/sdk/giving.md` - 43 lines reviewed.
- `docs/sdk/growth.md` - 183 lines reviewed.
- `docs/sdk/life.md` - 161 lines reviewed.
- `docs/sdk/ministry.md` - 56 lines reviewed.
- `docs/sdk/notifications.md` - 81 lines reviewed.
- `docs/sdk/people.md` - 37 lines reviewed.
- `docs/sdk/prayer.md` - 35 lines reviewed.
- `docs/sdk/sermons.md` - 84 lines reviewed.

Notes:

- `member_login_code_invalid` still exists in backend code as the stable error code; the wording now reflects that it is used for registration email verification.

### Batch 8 - Top-Level Docs

- `docs/ai_policy.md` - 160 lines reviewed.
- `docs/api.md` - 2263 lines reviewed.
- `docs/api_standards.md` - 591 lines reviewed.
- `docs/backend_release_checklist.md` - 330 lines reviewed.
- `docs/board_app_launch_summary.md` - 297 lines reviewed.
- `docs/closure_validation_plan_zh.md` - 258 lines reviewed.
- `docs/database.md` - 313 lines reviewed.
- `docs/development_guidelines.md` - 1450 lines reviewed.
- `docs/feature_completion_audit.md` - 111 lines reviewed.
- `docs/local_sermon_processing.md` - 264 lines reviewed.
- `docs/operations.md` - 185 lines reviewed.
- `docs/privacy_security.md` - 180 lines reviewed.
- `docs/product_vision.md` - 316 lines reviewed.
- `docs/product_vision_zh.md` - 401 lines reviewed.
- `docs/push_notifications.md` - 210 lines reviewed.
- `docs/roadmap.md` - 210 lines reviewed.
- `docs/stage_two_status.md` - 109 lines reviewed.
- `docs/testing.md` - 144 lines reviewed.
- `docs/ui_design_system.md` - 281 lines reviewed.
- `docs/vps_deployment.md` - 305 lines reviewed.

Notes:

- `docs/roadmap.md` is marked as a historical implementation-order draft and was not changed for old phase language.
- `docs/board_app_launch_summary.md` is a board-facing snapshot rather than the current source of completion truth, so its historical completion wording was left intact.
- Top-level docs now agree that public Web is introduction/entry focused, while deep Bible, sermon, life, giving, statement, and notification flows are App/backend/Admin-owned.

### Batch 9 - Backend Config, Migrations, Shared Core, Auth, Settings, Public Landing, AI, Bible, Members

- `backend/.env.example` - 54 lines reviewed.
- `backend/.env.production.example` - 60 lines reviewed.
- `backend/drizzle.config.ts` - 8 lines reviewed.
- `backend/package.json` - 39 lines reviewed.
- `backend/src/config/env.ts` - 237 lines reviewed.
- `backend/src/main.ts` - 22 lines reviewed.
- `backend/src/app.ts` - 308 lines reviewed.
- `backend/src/app_routes.ts` - 303 lines reviewed.
- `backend/src/shared/db/client.ts` - 28 lines reviewed.
- `backend/src/shared/db/schema.ts` - 1960 lines reviewed.
- `backend/src/shared/http/api-response.ts` - 14 lines reviewed.
- `backend/src/shared/http/app-error.ts` - 74 lines reviewed.
- `backend/src/shared/http/error-handler.ts` - 99 lines reviewed.
- `backend/src/shared/http/external-user-id.ts` - 11 lines reviewed.
- `backend/src/shared/security/password-hasher.ts` - 112 lines reviewed.
- `backend/src/types/fastify.d.ts` - 16 lines reviewed.
- `backend/migrations/meta/_journal.json` - 321 lines reviewed.
- `backend/migrations/0001_initial.sql` - 171 lines reviewed.
- `backend/migrations/0002_admin_auth_and_tokens.sql` - 50 lines reviewed.
- `backend/migrations/0003_sermon_transcripts.sql` - 6 lines reviewed.
- `backend/migrations/0004_jobs.sql` - 23 lines reviewed.
- `backend/migrations/0005_prayer_requests.sql` - 27 lines reviewed.
- `backend/migrations/0006_giving_finance.sql` - 46 lines reviewed.
- `backend/migrations/0007_members.sql` - 26 lines reviewed.
- `backend/migrations/0008_settings.sql` - 50 lines reviewed.
- `backend/migrations/0009_sermon_audio.sql` - 16 lines reviewed.
- `backend/migrations/0010_bible_knowledge_sections.sql` - 2 lines reviewed.
- `backend/migrations/0011_life_post_metadata_columns.sql` - 27 lines reviewed.
- `backend/migrations/0012_member_optional_auth.sql` - 31 lines reviewed.
- `backend/migrations/0014_push_notifications.sql` - 28 lines reviewed.
- `backend/migrations/0015_sermon_review_markdown.sql` - 5 lines reviewed.
- `backend/migrations/0016_life_post_schedule_media_columns.sql` - 7 lines reviewed.
- `backend/migrations/0017_life_post_pinned.sql` - 5 lines reviewed.
- `backend/migrations/0018_life_post_cta.sql` - 3 lines reviewed.
- `backend/migrations/0019_life_post_status.sql` - 12 lines reviewed.
- `backend/migrations/0020_giving_stripe_checkout.sql` - 16 lines reviewed.
- `backend/migrations/0021_payment_provider_events.sql` - 20 lines reviewed.
- `backend/migrations/0022_giving_finance_reconciliation.sql` - 40 lines reviewed.
- `backend/migrations/0023_event_registrations.sql` - 46 lines reviewed.
- `backend/migrations/0024_giving_funds.sql` - 36 lines reviewed.
- `backend/migrations/0025_event_attendance.sql` - 14 lines reviewed.
- `backend/migrations/0026_group_ministry.sql` - 59 lines reviewed.
- `backend/migrations/0027_course_learning.sql` - 63 lines reviewed.
- `backend/migrations/0028_serving_schedule.sql` - 54 lines reviewed.
- `backend/migrations/0029_pastoral_care.sql` - 40 lines reviewed.
- `backend/migrations/0030_notification_delivery_tasks.sql` - 28 lines reviewed.
- `backend/migrations/0031_remove_external_sermon_import.sql` - 15 lines reviewed.
- `backend/migrations/0032_warm_stepford_cuckoos.sql` - 42 lines reviewed.
- `backend/migrations/0033_spicy_night_nurse.sql` - 6 lines reviewed.
- `backend/migrations/0034_complex_loners.sql` - 0 lines reviewed.
- `backend/migrations/0035_romantic_chameleon.sql` - 9 lines reviewed.
- `backend/migrations/0036_illegal_ben_urich.sql` - 5 lines reviewed.
- `backend/migrations/0037_chief_norman_osborn.sql` - 4 lines reviewed.
- `backend/migrations/0038_flaky_blackheart.sql` - 3 lines reviewed.
- `backend/migrations/0039_flat_grey_gargoyle.sql` - 25 lines reviewed.
- `backend/migrations/0040_deep_mordo.sql` - 39 lines reviewed.
- `backend/migrations/0041_melted_tyrannus.sql` - 74 lines reviewed.
- `backend/migrations/0042_famous_grandmaster.sql` - 59 lines reviewed.
- `backend/migrations/0043_concerned_karnak.sql` - 36 lines reviewed.
- `backend/migrations/0044_oval_lake.sql` - 31 lines reviewed.
- `backend/migrations/0045_happy_annihilus.sql` - 27 lines reviewed.
- `backend/migrations/0046_lush_lord_tyger.sql` - 18 lines reviewed.
- `backend/src/modules/admin/auth/admin-auth-errors.ts` - 101 lines reviewed.
- `backend/src/modules/admin/auth/admin-auth.middleware.ts` - 52 lines reviewed.
- `backend/src/modules/admin/auth/admin-auth.repository.ts` - 90 lines reviewed.
- `backend/src/modules/admin/auth/admin-auth.routes.ts` - 176 lines reviewed.
- `backend/src/modules/admin/auth/admin-auth.service.ts` - 388 lines reviewed.
- `backend/src/modules/admin/auth/admin-rbac.ts` - 181 lines reviewed.
- `backend/src/modules/admin/auth/in-memory-admin-auth.repository.ts` - 202 lines reviewed.
- `backend/src/modules/admin/auth/password-hasher.ts` - 4 lines reviewed.
- `backend/src/modules/admin/auth/postgres-admin-auth.repository.ts` - 245 lines reviewed.
- `backend/src/modules/admin/users/admin-user-errors.ts` - 15 lines reviewed.
- `backend/src/modules/admin/users/admin-users.routes.ts` - 77 lines reviewed.
- `backend/src/modules/ai/ai-errors.ts` - 123 lines reviewed.
- `backend/src/modules/ai/ai-provider-fetch.ts` - 48 lines reviewed.
- `backend/src/modules/ai/ai-provider.factory.ts` - 56 lines reviewed.
- `backend/src/modules/ai/ai-rate-limiter.ts` - 113 lines reviewed.
- `backend/src/modules/ai/ai.provider.ts` - 21 lines reviewed.
- `backend/src/modules/ai/ai.routes.ts` - 129 lines reviewed.
- `backend/src/modules/ai/ai.service.ts` - 211 lines reviewed.
- `backend/src/modules/ai/disabled-ai.provider.ts` - 27 lines reviewed.
- `backend/src/modules/ai/gemini-ai.provider.ts` - 103 lines reviewed.
- `backend/src/modules/ai/openai-compatible-ai.provider.ts` - 101 lines reviewed.
- `backend/src/modules/audit/audit.repository.ts` - 15 lines reviewed.
- `backend/src/modules/audit/audit.service.ts` - 15 lines reviewed.
- `backend/src/modules/audit/in-memory-audit.repository.ts` - 47 lines reviewed.
- `backend/src/modules/audit/postgres-audit.repository.ts` - 48 lines reviewed.
- `backend/src/modules/health/health.routes.ts` - 18 lines reviewed.
- `backend/src/modules/media/local_media_path.ts` - 21 lines reviewed.
- `backend/src/modules/settings/settings-errors.ts` - 33 lines reviewed.
- `backend/src/modules/settings/settings.repository.ts` - 11 lines reviewed.
- `backend/src/modules/settings/settings.routes.ts` - 15 lines reviewed.
- `backend/src/modules/settings/settings.service.ts` - 84 lines reviewed.
- `backend/src/modules/settings/in-memory-settings.repository.ts` - 59 lines reviewed.
- `backend/src/modules/settings/postgres-settings.repository.ts` - 124 lines reviewed.
- `backend/src/modules/settings/settings_seed_data.ts` - 140 lines reviewed.
- `backend/src/modules/public/public_landing.routes.ts` - 16 lines reviewed.
- `backend/src/modules/public/public_landing_content.ts` - 143 lines reviewed.
- `backend/src/modules/public/public_landing_defaults.ts` - 858 lines reviewed.
- `backend/src/modules/public/public_landing_setting_schemas.ts` - 63 lines reviewed.
- `backend/src/modules/bible-knowledge/bible-knowledge-asset-importer.ts` - 283 lines reviewed.
- `backend/src/modules/bible-knowledge/bible-knowledge-errors.ts` - 19 lines reviewed.
- `backend/src/modules/bible-knowledge/bible-knowledge.repository.ts` - 25 lines reviewed.
- `backend/src/modules/bible-knowledge/bible-knowledge.routes.ts` - 20 lines reviewed.
- `backend/src/modules/bible-knowledge/bible-knowledge.service.ts` - 34 lines reviewed.
- `backend/src/modules/bible-knowledge/in-memory-bible-knowledge.repository.ts` - 171 lines reviewed.
- `backend/src/modules/bible-knowledge/postgres-bible-knowledge.repository.ts` - 187 lines reviewed.
- `backend/src/modules/admin/bible-knowledge/admin-bible-knowledge.routes.ts` - 140 lines reviewed.
- `backend/src/scripts/import-bible-knowledge-assets.ts` - 66 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note-errors.ts` - 56 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.repository.ts` - 48 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.routes.ts` - 162 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.service.ts` - 103 lines reviewed.
- `backend/src/modules/bible-verse-notes/in-memory-bible-verse-note.repository.ts` - 211 lines reviewed.
- `backend/src/modules/bible-verse-notes/postgres-bible-verse-note.repository.ts` - 233 lines reviewed.
- `backend/src/modules/members/auth/member-auth-errors.ts` - 92 lines reviewed.
- `backend/src/modules/members/auth/member-auth.middleware.ts` - 43 lines reviewed.
- `backend/src/modules/members/auth/member-auth.repository.ts` - 59 lines reviewed.
- `backend/src/modules/members/auth/member-auth.routes.ts` - 108 lines reviewed.
- `backend/src/modules/members/auth/member-auth.service.ts` - 399 lines reviewed.
- `backend/src/modules/members/auth/in-memory-member-auth.repository.ts` - 105 lines reviewed.
- `backend/src/modules/members/auth/postgres-member-auth.repository.ts` - 129 lines reviewed.
- `backend/src/modules/members/member-errors.ts` - 15 lines reviewed.
- `backend/src/modules/members/member.repository.ts` - 15 lines reviewed.
- `backend/src/modules/members/member.service.ts` - 54 lines reviewed.
- `backend/src/modules/members/in-memory-member.repository.ts` - 186 lines reviewed.
- `backend/src/modules/members/postgres-member.repository.ts` - 238 lines reviewed.
- `backend/src/modules/admin/members/admin-members.routes.ts` - 120 lines reviewed.

Generated/structural checks:

- `backend/migrations/meta/*_snapshot.json` - JSON structure validated and journal/table counts inspected.
- Drizzle journal-to-SQL/snapshot presence was checked; the journaled empty migration `0034_complex_loners.sql` is intentionally retained.

Notes:

- This is a backend partial batch, not the completion of all backend files.
- Member registration correctly follows backend settings for open/closed/admin-only, optional email verification, and optional admin approval.
- Bible verse notes support both member identity and external user id; ownership checks are enforced for edit/delete and admin moderation is audited.
- No code changes were required in this batch.

## Batch 10 - Backend Life Posts, Event Registration, Check-In, and Life Images

Scope reviewed line by line:

- `backend/src/modules/life/event_registration_csv.ts` - 42 lines reviewed.
- `backend/src/modules/life/event_registration_errors.ts` - 142 lines reviewed.
- `backend/src/modules/life/event_registration_summary.ts` - 86 lines reviewed.
- `backend/src/modules/life/in-memory-life-post.repository.ts` - 481 lines reviewed.
- `backend/src/modules/life/in_memory_life_post_seed.ts` - 58 lines reviewed.
- `backend/src/modules/life/life-post-errors.ts` - 97 lines reviewed.
- `backend/src/modules/life/life-post-image-storage.service.ts` - 263 lines reviewed.
- `backend/src/modules/life/life-post.repository.ts` - 103 lines reviewed.
- `backend/src/modules/life/life-post.service.ts` - 349 lines reviewed.
- `backend/src/modules/life/life.routes.ts` - 259 lines reviewed.
- `backend/src/modules/life/life_event_registration.service.ts` - 491 lines reviewed.
- `backend/src/modules/life/life_post_registration_summary.ts` - 24 lines reviewed.
- `backend/src/modules/life/postgres-life-post.repository.ts` - 469 lines reviewed.
- `backend/src/modules/life/postgres_life_post_mappers.ts` - 112 lines reviewed.
- `backend/src/modules/admin/life-posts/admin-life-posts.routes.ts` - 373 lines reviewed.
- `backend/src/modules/admin/life-posts/admin_life_post_registrations.routes.ts` - 169 lines reviewed.

Findings fixed:

- Removed stale legacy JSON-body parsing from the Postgres life post mapper. Current life post data is owned by explicit `body`, `meta`, and `iconName` columns.
- Updated S3 life image reads so missing objects from either `HeadObject` or `GetObject` resolve to `null` instead of leaking provider-specific 404 errors.

Logic chain audit:

- Public life post reads stay limited to published public posts.
- Member life post reads merge public and member-visible published posts, then attach registration summaries and durable server read states.
- Member registration enforces visibility, published status, registration enablement, deadline, max party size, capacity, and checked-in immutability in `LifeEventRegistrationService`.
- QR check-in and self check-in both write attendance state through the repository and audit their route-level actions.
- Admin create/update cannot direct-publish; publish is the only route that may trigger optional App notification delivery.
- Admin registration export, attendance updates, check-in code rotation, and image upload all pass through service/repository boundaries and record audit entries where side effects occur.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`

## Batch 16 - Backend Pastoral Care

Scope reviewed line by line:

- `packages/api_contracts/src/care.ts` - 112 lines reviewed.
- `backend/src/modules/care/care_errors.ts` - 29 lines reviewed.
- `backend/src/modules/care/care.repository.ts` - 34 lines reviewed.
- `backend/src/modules/care/care.service.ts` - 168 lines reviewed.
- `backend/src/modules/care/care.routes.ts` - 69 lines reviewed.
- `backend/src/modules/care/in_memory_care.repository.ts` - 173 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/care/postgres_care.repository.ts` - 201 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/care/care_status_rules.ts` - 15 lines reviewed after adding the shared status rule.
- `backend/src/modules/admin/care/admin_care.routes.ts` - 122 lines reviewed before fix, then changed lines re-reviewed.
- `backend/tests/care.routes.test.ts` - 505 lines reviewed before fix, then changed lines re-reviewed.
- `docs/features/pastoral_care.md` - 97 lines reviewed for feature contract alignment.
- `docs/domains/pastoral_care.md` - 39 lines reviewed for domain contract alignment.
- `backend/src/app_routes.ts` lines 130-260 reviewed for care route wiring.

Findings fixed:

- Planned or cancelled care follow-ups were advancing the parent care request to `in_progress`. Added a shared care status rule and applied it in both in-memory and Postgres repositories so only completed follow-ups advance non-final requests.
- Backend care list access and follow-up list access were not audited even though the domain contract requires access audit. Added redacted audit records for admin care request list and follow-up list reads.
- Extended care route tests to cover planned follow-up status behavior and access audit records without storing care body, internal note, or follow-up note text in audit payloads.

Logic chain audit:

- Member care creation remains member-auth guarded, creates only the member's own request, and audits redacted submission metadata.
- Member list/detail returns summary fields only and does not expose `internalNote` or `followUps`.
- Admin list is permission-gated, privacy-filtered by `CareService`, and now writes a redacted access audit record.
- Admin update remains permission-gated, enforces privacy levels in the service, and writes redacted update audit metadata.
- Admin follow-up list is permission-gated, privacy-checked by `CareService`, and now writes a redacted access audit record.
- Admin follow-up creation writes redacted audit metadata and advances the parent request only when the follow-up is completed and the parent is not already `resolved` or `archived`.
- In-memory and Postgres repositories now share the same follow-up status advancement rule.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/care.routes.test.ts tests/admin-rbac.test.ts`

## Batch 17 - Backend Group Ministry

Scope reviewed line by line:

- `docs/features/group_ministry.md` - 120 lines reviewed before fix, then changed line re-reviewed.
- `docs/domains/ministry_group.md` - 34 lines reviewed.
- `packages/api_contracts/src/groups.ts` - 238 lines reviewed.
- `backend/src/modules/groups/group-errors.ts` - 74 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/groups/group.repository.ts` - 89 lines reviewed.
- `backend/src/modules/groups/group.routes.ts` - 76 lines reviewed.
- `backend/src/modules/groups/group.service.ts` - 213 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/groups/in-memory-group.repository.ts` - 424 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/groups/postgres-group.repository.ts` - 497 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/groups/postgres_group_mappers.ts` - 59 lines reviewed.
- `backend/src/modules/admin/groups/admin-groups.routes.ts` - 258 lines reviewed.
- `backend/src/shared/db/schema.ts` lines 535-690 reviewed for group table, membership, material assignment, and attendance record schema.
- `packages/shared_types/src/content.ts` - 47 lines reviewed for visibility levels.
- `backend/tests/groups_courses_serving.routes.test.ts` group-specific lines 1-202 reviewed before fix, then changed lines re-reviewed.
- `backend/tests/group_v2.routes.test.ts` - 199 lines reviewed before fix, then changed lines re-reviewed.

Findings fixed:

- Member group list/detail treated `group` visibility as inaccessible even when the current member had an active or leader membership. Updated in-memory and Postgres repositories so `group` visibility is visible only to active/leader members of that group, while `private` remains hidden from member APIs.
- Material assignment update returned `group_not_found` when the group existed but the assignment did not. Added `group_material_assignment_not_found` at the feature layer and documented it in the group feature error model.
- Added route tests for group-only visibility list/detail behavior and the material assignment not-found error.

Logic chain audit:

- Member group list/detail remains member-auth guarded and `GroupService` forces App-visible lists to active groups.
- Group applications are created by members only after capacity and membership checks, and member-submitted notes remain redacted in audit snapshots.
- Admin group create/update/application review/material/attendance operations remain permission-gated and audited.
- Application approval still upserts membership and synchronizes the member profile `fellowshipGroupId` so Mine, Prayer, and member filtering share the same source of truth.
- Group material assignments store only source references, title, due date, and task status; they do not copy sermon, course, or reading plan source content.
- Attendance upsert remains idempotent by group/date/member and writes redacted audit metadata.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/groups_courses_serving.routes.test.ts tests/group_v2.routes.test.ts`

## Batch 18 - Backend Course Learning

Scope reviewed line by line:

- `docs/features/course_learning.md` - 91 lines reviewed.
- `docs/domains/course_learning.md` - 36 lines reviewed.
- `packages/api_contracts/src/courses.ts` - 161 lines reviewed.
- `backend/src/modules/courses/course-errors.ts` - 60 lines reviewed.
- `backend/src/modules/courses/course.repository.ts` - 65 lines reviewed.
- `backend/src/modules/courses/course.routes.ts` - 91 lines reviewed.
- `backend/src/modules/courses/course.service.ts` - 167 lines reviewed.
- `backend/src/modules/courses/in-memory-course.repository.ts` - 417 lines reviewed.
- `backend/src/modules/courses/postgres-course.repository.ts` - 487 lines reviewed.
- `backend/src/modules/admin/courses/admin-courses.routes.ts` - 202 lines reviewed.
- `backend/tests/groups_courses_serving.routes.test.ts` course-specific lines 282-552 reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Public/member course catalog is limited to `open` and `in_progress` courses.
- Public users only see public courses; signed-in members see public/member courses.
- Enrolled members can still open completed historical course details through their enrollment state, while public completed course details stay hidden.
- Enrollment creation returns existing active enrollment, applies capacity to choose `enrolled` or `waitlisted`, and audits a redacted enrollment snapshot.
- Admin course, lesson, and enrollment writes are permission-gated and audited.
- Enrollment progress updates cap `completedLessonCount` to canonical `lessonCount`, preserving the domain rule that progress cannot exceed lesson count.
- In-memory and Postgres repositories agree on course visibility, enrollment status, lesson ordering, listMine behavior, and derived count hydration.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/groups_courses_serving.routes.test.ts`

## Batch 19 - Backend Serving Schedule

Scope reviewed line by line:

- `docs/features/serving_schedule.md` - 119 lines reviewed.
- `docs/domains/serving_schedule.md` - 33 lines reviewed.
- `packages/api_contracts/src/serving.ts` - 241 lines reviewed.
- `backend/src/modules/serving/serving-errors.ts` - 71 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/serving/serving.repository.ts` - 63 lines reviewed.
- `backend/src/modules/serving/serving.routes.ts` - 154 lines reviewed.
- `backend/src/modules/serving/serving.service.ts` - 209 lines reviewed before fix, then changed lines re-reviewed.
- `backend/src/modules/serving/in-memory-serving.repository.ts` - 415 lines reviewed.
- `backend/src/modules/serving/postgres-serving.repository.ts` - 429 lines reviewed.
- `backend/src/modules/serving/postgres_serving_mappers.ts` - 98 lines reviewed.
- `backend/src/modules/admin/serving/admin-serving.routes.ts` - 302 lines reviewed.
- `backend/src/shared/db/schema.ts` lines 790-940 reviewed for serving tables and check-in uniqueness.
- `backend/tests/groups_courses_serving.routes.test.ts` serving-specific lines 555-780 reviewed.
- `backend/tests/serving_v2.routes.test.ts` - 190 lines reviewed before fix, then changed lines re-reviewed.

Findings fixed:

- Covered assignments could still be confirmed by the assigned member. `confirmAssignment` now rejects both `cancelled` and `covered` states with `serving_assignment_conflict`.
- Member and admin check-in accepted cancelled or otherwise non-active assignments. Added `serving_check_in_invalid` and limited check-in to `scheduled` or `confirmed` assignments.
- Added serving v2 route tests for covered confirmation rejection and invalid member/admin check-in attempts.

Logic chain audit:

- Admin team, role, assignment, availability, and check-in routes remain permission-gated and audited.
- Assignment create/update validates that the final `teamId` and `roleId` belong together before repository writes.
- Member assignment list only returns the member's assignments and omits cancelled rows.
- Member confirm/leave requires assignment ownership and now respects covered/cancelled state constraints.
- Availability and check-in writes audit only redacted metadata, not free-form notes.
- In-memory and Postgres repositories agree on assignment filtering, role/team joins, availability ordering, and assignment-scoped check-in upsert behavior.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/groups_courses_serving.routes.test.ts tests/serving_v2.routes.test.ts`

## Batch 20 - Backend Discipleship Journey

Scope reviewed line by line:

- `docs/features/discipleship_journey.md` - 196 lines reviewed.
- `docs/domains/discipleship_journey.md` - 38 lines reviewed.
- `packages/api_contracts/src/discipleship.ts` - 214 lines reviewed.
- `backend/src/modules/discipleship/discipleship-errors.ts` - 91 lines reviewed before and after fix.
- `backend/src/modules/discipleship/discipleship.repository.ts` - 54 lines reviewed.
- `backend/src/modules/discipleship/discipleship.routes.ts` - 24 lines reviewed.
- `backend/src/modules/discipleship/discipleship.service.ts` - 121 lines reviewed before and after fix.
- `backend/src/modules/discipleship/discipleship_status_rules.ts` - 46 lines reviewed after creation.
- `backend/src/modules/discipleship/in-memory-discipleship.repository.ts` - 290 lines reviewed before and after fix.
- `backend/src/modules/discipleship/postgres-discipleship.repository.ts` - 412 lines reviewed before and after fix.
- `backend/src/modules/admin/discipleship/admin-discipleship.routes.ts` - 240 lines reviewed before and after fix.
- `backend/src/shared/db/schema.ts` lines 1080-1215 reviewed for discipleship task, assignment, and progress tables.
- `backend/tests/discipleship.routes.test.ts` - 465 lines reviewed before and after fix.

Findings fixed:

- Non-`manual_review` discipleship tasks could be created without a stable `referenceId`. Added `discipleship_reference_invalid` validation in the service owner.
- Admin stage and task creation were not audited. Added redacted audit snapshots for `discipleship_stage` and `discipleship_task`.
- Assignment aggregate status did not complete when all canonical task progress was completed, and did not reopen when completed progress moved back to review. Added shared repository status rules for in-memory and Postgres implementations.
- Removed a stale unused Postgres progress lookup and the now-unused private helper from task progress upsert.

Logic chain audit:

- Admin journey, stage, task, assignment, and task-progress routes remain permission-gated.
- Stage creation requires an existing journey before persistence.
- Task creation verifies stage ownership when a stage is supplied and now rejects non-manual references without a stable id before repository writes.
- Assignment creation is still limited to active journeys.
- Task progress update verifies assignment existence and task ownership before upsert.
- Assignment aggregate counts and status are derived from canonical task progress in both repository implementations.
- `blocked`, `paused`, and `cancelled` assignment states remain manual states and are not silently rewritten by task-progress updates.
- Audit snapshots avoid storing task/stage titles, descriptions, or pastoral progress notes.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/discipleship.routes.test.ts`

## Batch 21 - Backend Reading Plan

Scope reviewed line by line:

- `docs/features/reading_plan.md` - 150 lines reviewed.
- `docs/domains/reading_plan.md` - 38 lines reviewed.
- `docs/sdk/growth.md` reading-plan section reviewed.
- `docs/api.md` reading-plan API section reviewed.
- `docs/capabilities/scheduled_notification.md` - 38 lines reviewed for reminder boundary.
- `docs/capabilities/tts_playback.md` - 35 lines reviewed for App TTS boundary.
- `packages/api_contracts/src/reading-plans.ts` - 197 lines reviewed.
- `backend/src/modules/reading-plans/reading-plan-errors.ts` - 88 lines reviewed.
- `backend/src/modules/reading-plans/reading-plan.repository.ts` - 54 lines reviewed.
- `backend/src/modules/reading-plans/reading-plan.service.ts` - 154 lines reviewed.
- `backend/src/modules/reading-plans/reading-plan.routes.ts` - 124 lines reviewed.
- `backend/src/modules/admin/reading-plans/admin-reading-plan.routes.ts` - 161 lines reviewed.
- `backend/src/modules/reading-plans/in-memory-reading-plan.repository.ts` - 277 lines reviewed before and after fix.
- `backend/src/modules/reading-plans/postgres-reading-plan.repository.ts` - 397 lines reviewed before and after fix.
- `backend/src/modules/reading-plans/reading_plan_status_rules.ts` - 38 lines reviewed after creation.
- `backend/src/shared/db/schema.ts` lines 1549-1673 reviewed for reading plan tables.
- `backend/tests/reading_plan.routes.test.ts` - 359 lines reviewed before and after fix.

Findings fixed:

- Reading plan assignments moved from `not_started` to `active`, but never moved to `completed` when all canonical plan days were completed.
- Completed assignments did not reopen when day progress moved away from `completed`.
- Non-completed day progress preserved the previous `completedAt` when no explicit timestamp was supplied. It now clears `completedAt` by default.
- Removed the now-unused Postgres day-progress lookup helper after status calculation no longer needs the previous row.

Logic chain audit:

- Public read routes expose published public plans without login and member-only plans only to member viewers.
- Public day payloads contain scripture references only, not Bible text.
- Self-assignment requires either member auth or `X-External-User-Id`.
- Admin assignment rejects draft plans and rejects member-only plans for external users.
- Progress update checks assignment ownership and day-plan ownership before repository writes.
- In-memory and Postgres repositories now share assignment state resolution after progress changes.
- `paused` and `abandoned` assignments remain manual states and are not silently rewritten by day-progress updates.
- Admin plan, day, and assignment writes remain permission-gated and audited with redacted snapshots.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/reading_plan.routes.test.ts`

## Batch 22 - Backend Sermon Discussion Guide

Scope reviewed line by line:

- `docs/features/sermon_discussion_guide.md` - 153 lines reviewed.
- `docs/domains/sermon_discussion_guide.md` - 38 lines reviewed.
- `packages/api_contracts/src/sermon-discussion-guides.ts` - 163 lines reviewed.
- `backend/src/modules/sermon-discussion-guides/sermon-discussion-guide-errors.ts` - 105 lines reviewed before and after fix.
- `backend/src/modules/sermon-discussion-guides/sermon-discussion-guide.repository.ts` - 45 lines reviewed.
- `backend/src/modules/sermon-discussion-guides/sermon-discussion-guide.service.ts` - 143 lines reviewed before and after fix.
- `backend/src/modules/sermon-discussion-guides/sermon-discussion-guide.routes.ts` - 70 lines reviewed.
- `backend/src/modules/admin/sermon-discussion-guides/admin-sermon-discussion-guide.routes.ts` - 144 lines reviewed before and after fix.
- `backend/src/modules/sermon-discussion-guides/in-memory-sermon-discussion-guide.repository.ts` - 187 lines reviewed.
- `backend/src/modules/sermon-discussion-guides/postgres-sermon-discussion-guide.repository.ts` - 273 lines reviewed.
- `backend/src/shared/db/schema.ts` lines 131-203 reviewed for discussion guide and response tables.
- `backend/tests/sermon_discussion_guide.routes.test.ts` - 214 lines reviewed before and after fix.

Findings fixed:

- Responses could reference a question id that did not belong to the guide. Added `sermon_discussion_response_invalid` validation in the service owner.
- The first-version response API allowed `shared_with_group` without a group context or membership check. It now rejects non-private response visibility with `sermon_discussion_visibility_denied` until an explicit group-sharing chain exists.
- The admin ordinary response list returned private responses by default. It now defaults to `shared_with_group` so private responses do not appear in ordinary list results.

Logic chain audit:

- Public discussion guide read requires a published sermon and returns only a published public guide.
- Admin guide create/update remains permission-gated and validates sermon existence; published guide creation/update requires a published sermon.
- User response creation requires member auth or `X-External-User-Id`.
- User responses are tied to an existing published guide and, when a question id is supplied, to a canonical question on that guide.
- Personal response visibility is private-only in the first version because no group context is carried in the App response request.
- Admin hide remains permission-gated and writes a redacted audit payload containing `hasContent`, not the response body.
- In-memory and Postgres repositories agree on published public guide lookup, response persistence, response listing filters, and status update behavior.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/sermon_discussion_guide.routes.test.ts`

## Batch 23 - Backend Bible Verse Notes

Scope reviewed line by line:

- `docs/features/bible_verse_notes.md` - 163 lines reviewed.
- `docs/sdk/bible.md` - 64 lines reviewed.
- `docs/api.md` - Bible verse notes API section lines 943-985 reviewed.
- `packages/api_contracts/src/bible-verse-notes.ts` - 92 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.repository.ts` - 48 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note-errors.ts` - 56 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.service.ts` - 103 lines reviewed.
- `backend/src/modules/bible-verse-notes/bible-verse-note.routes.ts` - 162 lines reviewed.
- `backend/src/modules/bible-verse-notes/in-memory-bible-verse-note.repository.ts` - 215 lines reviewed.
- `backend/src/modules/bible-verse-notes/postgres-bible-verse-note.repository.ts` - 235 lines reviewed.
- `backend/tests/bible_verse_notes.routes.test.ts` - 297 lines reviewed.

Findings fixed:

- Admin Bible verse note lists returned `deleted` notes by default when no status filter was supplied. The feature contract says deleted notes are hidden from ordinary admin lists by default, while still available through an explicit status filter. Fixed both in-memory and Postgres repositories.
- Added route coverage for missing author identity, mismatched `verseId` reference validation, public list exclusion after author deletion, explicit `status=deleted` admin filtering, and redacted hide/restore audit records.

Logic chain audit:

- App Bible text remains local; backend public notes are linked only by stable `verseId`.
- Public note creation requires either member auth or `X-External-User-Id`; external ids remain limited to low-sensitivity guest authorship.
- Authors can update only their own published notes. Admin-hidden notes are not restored through author edits.
- Author deletion soft-deletes the note; public App list and default admin list no longer expose deleted notes.
- Admin hide/restore remains permission-gated and writes audit snapshots that omit note content and hidden reasons.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/bible_verse_notes.routes.test.ts`

## Batch 24 - Mobile Member Session Storage

Scope reviewed line by line:

- `docs/sdk/auth.md` - 63 lines reviewed.
- `docs/domains/member_identity.md` - 57 lines reviewed.
- `docs/development_guidelines.md` storage/API section lines 880-949 reviewed.
- `apps/mobile/lib/features/mine/data/member_session_repository.dart` - 243 lines reviewed before and after fix.
- `apps/mobile/lib/features/mine/data/member_session_models.dart` - 175 lines reviewed.
- `apps/mobile/lib/core/storage/shared_preferences_provider.dart` - 9 lines reviewed.
- `apps/mobile/lib/main.dart` - 27 lines reviewed for startup storage overrides.
- `apps/mobile/lib/core/storage/session_store.dart` - 77 lines reviewed after creation.
- `apps/mobile/test/member_session_repository_test.dart` - 115 lines reviewed before and after fix.
- `apps/mobile/pubspec.yaml` - 136 lines reviewed around dependency ownership.

Generated/structural checks:

- `apps/mobile/pubspec.lock` dependency lock update was generated by `flutter pub get --offline`; the new `flutter_secure_storage` dependency family was inspected in the diff.

Findings fixed:

- `MemberSessionRepository` was reading and writing `member_access_token` directly through `SharedPreferences`, which violated the storage rule that secrets stay behind a secure session store.
- Added `SessionStore`/`SecureSessionStore` so the access token uses `flutter_secure_storage`, while the non-sensitive member profile session view remains in `SharedPreferences`.
- Updated repository construction and tests so the repository depends on the session store boundary rather than raw preferences.

Logic chain audit:

- Login, registration sign-in, verification sign-in, profile update, explicit persistence, restore, and logout all pass through `MemberSessionRepository`.
- Token persistence now has one source of truth: `SessionStore.read/write/clearAccessToken`.
- Member profile cache remains a non-authoritative session view; backend member identity remains the source of truth.
- Debug member bypass still returns the in-memory debug session without writing a token.
- Logout clears both secure token and cached profile through the same store boundary.

Verification:

- `dart format apps/mobile/lib/core/storage/session_store.dart apps/mobile/lib/features/mine/data/member_session_repository.dart apps/mobile/test/member_session_repository_test.dart`
- `flutter pub get --offline`
- `flutter analyze`
- `flutter test test/member_session_repository_test.dart`
- Note: one parallel Flutter test attempt failed due concurrent access to `ios/Flutter/ephemeral`; it was rerun sequentially and passed.

## Batch 25 - Mobile Core Entry, API, Config, and Shell

Scope reviewed line by line:

- `docs/architecture/app.md` - 160 lines reviewed.
- `docs/surfaces/mobile_app.md` - 112 lines reviewed.
- `docs/agent-workflow/frontend_workflow.md` - 52 lines reviewed for App workflow.
- `apps/mobile/lib/main.dart` - 27 lines reviewed.
- `apps/mobile/lib/app/app_router.dart` - 166 lines reviewed.
- `apps/mobile/lib/app/app_routes.dart` - 35 lines reviewed.
- `apps/mobile/lib/app/walk_with_app.dart` - 85 lines reviewed.
- `apps/mobile/lib/core/api/api_client.dart` - 288 lines reviewed before and after fix.
- `apps/mobile/lib/core/api/api_client_support.dart` - 80 lines reviewed.
- `apps/mobile/lib/core/api/api_error.dart` - 65 lines reviewed.
- `apps/mobile/lib/core/config/app_config.dart` - 48 lines reviewed before and after fix.
- `apps/mobile/lib/core/config/app_version.dart` - 8 lines reviewed.
- `apps/mobile/lib/core/storage/shared_preferences_provider.dart` - 9 lines reviewed.
- `apps/mobile/lib/core/storage/shared_preferences_provider.g.dart` - 57 generated lines reviewed.
- `apps/mobile/lib/core/storage/session_store.dart` - 77 lines reviewed.
- `apps/mobile/lib/core/identity/external_user_identity_repository.dart` - 43 lines reviewed.
- `apps/mobile/lib/core/platform/external_link_service.dart` - 26 lines reviewed.
- `apps/mobile/lib/core/settings/app_settings.dart` - 128 lines reviewed.
- `apps/mobile/lib/core/settings/app_settings_repository.dart` - 61 lines reviewed.
- `apps/mobile/lib/core/settings/app_text_scale_provider.dart` - 42 lines reviewed.
- `apps/mobile/lib/features/shell/shell_page.dart` - 18 lines reviewed.
- `apps/mobile/lib/features/shell/widgets/shell_app_bar.dart` - 95 lines reviewed.
- `apps/mobile/lib/features/shell/widgets/shell_navigation_bar.dart` - 47 lines reviewed.
- `apps/mobile/test/core_api_error_test.dart` - 151 lines reviewed before and after fix.

Findings fixed:

- `ApiClient` did not inject `Accept-Language` even though the App/API contract assigns locale header ownership to the shared client. Added a shared locale provider and request interceptor header injection, with target test coverage.
- Release/mobile fallback API URL silently pointed Android builds to emulator localhost when `API_BASE_URL` was omitted. The fallback now points to the current test API host, while explicit build-time `API_BASE_URL` still overrides it.

Logic chain audit:

- App startup owns shared preferences override only; secure member token storage remains behind `SessionStore`.
- `MaterialApp.router` follows supported localizations and applies text scale centrally.
- Routes parse path/query parameters and pass them to page owners; business validation remains in repositories/backend.
- API requests now consistently receive `x-request-id` and `accept-language` headers from the shared transport owner.
- Structured backend errors still map into `ApiError` helpers used by feature repositories and UI.

Verification:

- `dart format apps/mobile/lib/core/config/app_config.dart apps/mobile/lib/core/api/api_client.dart apps/mobile/test/core_api_error_test.dart`
- `flutter test test/core_api_error_test.dart test/member_session_repository_test.dart`
- `flutter analyze`

## Batch 26 - Mobile Shared UI, Theme, and Utilities

Scope reviewed line by line:

- `docs/ui_design_system.md` - 281 lines reviewed.
- `docs/agent-workflow/code_splitting.md` - 58 lines reviewed.
- `apps/mobile/lib/shared/widgets/app_button.dart` - 204 lines reviewed before and after fix.
- `apps/mobile/lib/shared/widgets/app_chip.dart` - 147 lines reviewed.
- `apps/mobile/lib/shared/widgets/app_markdown_body.dart` - 77 lines reviewed.
- `apps/mobile/lib/shared/widgets/app_skeleton.dart` - 133 lines reviewed.
- `apps/mobile/lib/shared/widgets/filled_text_field.dart` - 101 lines reviewed.
- `apps/mobile/lib/shared/widgets/period_picker_button.dart` - 71 lines reviewed before and after fix.
- `apps/mobile/lib/shared/widgets/period_selector_sheet.dart` - 249 lines reviewed.
- `apps/mobile/lib/shared/widgets/secondary_app_bar.dart` - 82 lines reviewed before and after fix.
- `apps/mobile/lib/shared/widgets/section_header.dart` - 34 lines reviewed.
- `apps/mobile/lib/shared/utils/ai_error_messages.dart` - 21 lines reviewed.
- `apps/mobile/lib/shared/utils/app_formatters.dart` - 98 lines reviewed.
- `apps/mobile/lib/shared/utils/date_period.dart` - 93 lines reviewed.
- `apps/mobile/lib/theme/app_colors.dart` - 41 lines reviewed.
- `apps/mobile/lib/theme/app_theme.dart` - 128 lines reviewed.
- `apps/mobile/lib/theme/theme_provider.dart` - 28 lines reviewed.
- `apps/mobile/lib/theme/theme_provider.g.dart` - 62 generated lines reviewed.
- `apps/mobile/lib/features/shell/widgets/shell_app_bar.dart` - 95 lines re-reviewed for shared action sizing.
- `apps/mobile/test/app_button_test.dart` - 136 lines reviewed before and after fix.
- `apps/mobile/test/theme_provider_test.dart` - 54 lines reviewed.

Findings fixed:

- Several shared interactive controls were below the design-system touch target minimum of 44dp: `AppButton`, `PeriodPickerButton`, `SecondaryAppBar` back button, and shell app-bar icon actions.
- Updated shared defaults to 44dp and added an `AppButton` regression test for the default minimum height.

Logic chain audit:

- Material 3 theme already sets global button minimum size to 48x44; shared widgets no longer override it down to 40dp.
- Filled text field keeps hint-only behavior and tinted card default color, matching the current auth/profile input boundary.
- Shared date and formatter helpers remain UI-only utilities and do not own business rules.
- Generated Riverpod providers were read as generated artifacts and left unchanged.

Verification:

- `dart format apps/mobile/lib/shared/widgets/app_button.dart apps/mobile/lib/shared/widgets/period_picker_button.dart apps/mobile/lib/shared/widgets/secondary_app_bar.dart apps/mobile/lib/features/shell/widgets/shell_app_bar.dart apps/mobile/test/app_button_test.dart`
- `flutter test test/app_button_test.dart`
- `flutter analyze`

## Batch 27 - Mobile Study Local Bible Catalog and Repository

Scope reviewed line by line:

- `docs/domains/bible_content.md` - 35 lines re-reviewed for local Bible ownership.
- `docs/sdk/bible.md` lines 37-58 re-reviewed for offline Bible and public verse note contract.
- `apps/mobile/lib/features/study/domain/bible_book.dart` - 38 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_translation.dart` - 67 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_verse.dart` - 13 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_search_result.dart` - 23 lines reviewed.
- `apps/mobile/lib/features/study/domain/study_annotation.dart` - 33 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_catalog_old_testament.dart` - 433 lines reviewed before and after fix.
- `apps/mobile/lib/features/study/data/bible_catalog_new_testament.dart` - 301 lines reviewed before and after fix.
- `apps/mobile/lib/features/study/data/bible_catalog_mock.dart` - 8 lines reviewed.
- `apps/mobile/lib/features/study/data/study_repository_contract.dart` - 152 lines reviewed.
- `apps/mobile/lib/features/study/data/study_repository.dart` - 3 lines reviewed.
- `apps/mobile/lib/features/study/data/study_repository_providers.dart` - 79 lines reviewed.
- `apps/mobile/lib/features/study/data/local_study_repository.dart` - 224 lines reviewed.
- `apps/mobile/lib/features/study/data/local/bible_seed_importer.dart` - 300 lines reviewed.
- `apps/mobile/lib/features/study/data/local/bible_search_ranker.dart` - 100 lines reviewed.
- `apps/mobile/lib/features/study/data/local/study_annotation_store.dart` - 166 lines reviewed.
- `apps/mobile/lib/features/study/data/local/study_row_mappers.dart` - 63 lines reviewed.
- `apps/mobile/test/bible_seed_importer_test.dart` - 119 lines reviewed.
- `apps/mobile/test/bible_seed_importer_real_assets_test.dart` - 76 lines reviewed before and after fix.
- `apps/mobile/test/bible_book_display_test.dart` - 25 lines reviewed.
- `apps/mobile/test/widget_test.dart` - 362 lines reviewed after test wait fix.
- `apps/mobile/test/widget_test_harness.dart` - 490 lines reviewed after fake repository fix.

Findings fixed:

- Static Bible catalog files used English slug book ids while packaged Bible assets use canonical abbreviated ids. This created a duplicate source of truth and forced the widget fake repository to accept aliases such as `romans` and `genesis`. Updated all static catalog ids to match packaged assets and tightened the fake repository to the same ids.
- Added a real-asset regression test that compares static catalog ids and chapter counts against `assets/bible/web/books.json`.
- Replaced one widget test `pumpAndSettle` wait after testament switching with a bounded pump and target-content wait so the test verifies the Bible navigation loop without timing out on page animations.

Logic chain audit:

- Local Bible text remains app-local and seeded from packaged assets; backend is not introduced into the Bible text reading path.
- `BibleSeedImporter` owns metadata and verse text import, with translation ids constrained to `web`, `cuvs`, and `cuvt`.
- `LocalStudyRepository` uses the imported asset ids for book lookup, chapter loading, search, reading progress, and annotations.
- Study annotation storage still queues local note/bookmark sync records without moving Bible text ownership out of the app.
- Widget fake study data now uses the same book ids as packaged assets, so reader navigation, continue-reading progress, sermon recommendations, and search tests exercise the production id shape.

Verification:

- `dart format apps/mobile/lib/features/study/data/bible_catalog_old_testament.dart apps/mobile/lib/features/study/data/bible_catalog_new_testament.dart apps/mobile/test/widget_test_harness.dart apps/mobile/test/bible_seed_importer_real_assets_test.dart`
- `flutter test test/bible_seed_importer_test.dart test/bible_seed_importer_real_assets_test.dart test/bible_book_display_test.dart test/widget_test.dart`
- `git diff --check`
- `flutter analyze`

## Batch 28 - Mobile Study Core Presentation Pages

Scope reviewed line by line:

- `apps/mobile/lib/features/study/presentation/bible_book_display.dart` - 9 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_reader_app_bar.dart` - 63 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_reader_page.dart` - 442 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_reader_scroll_session.dart` - 222 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_reader_sheet_actions.dart` - 218 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_reader_tts_session.dart` - 156 lines reviewed.
- `apps/mobile/lib/features/study/presentation/bible_search_page.dart` - 318 lines reviewed.
- `apps/mobile/lib/features/study/presentation/reader_assist_settings_provider.dart` - 76 lines reviewed.
- `apps/mobile/lib/features/study/presentation/reader_assist_settings_provider.g.dart` - 65 generated lines reviewed.
- `apps/mobile/lib/features/study/presentation/study_tab.dart` - 318 lines reviewed.
- `apps/mobile/lib/app/app_router.dart` lines 70-100 re-reviewed for reader route query parsing.
- `apps/mobile/lib/app/app_routes.dart` - 35 lines re-reviewed for study route names and paths.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Study tab reads book list and progress through providers and only owns UI state for the selected testament and sheet opening.
- Reader route parsing supports both exact `verseId` and numeric `verse` query parameters, so search results and reading-plan references both reach the same reader entry.
- Bible reader composes repository-backed book, chapter, annotation, people, place, sermon recommendation, and TTS state without owning persistence or backend transport directly.
- Reader scroll and TTS sessions own transient UI/playback state and call repository/provider owners for progress and preference persistence.
- Sheet actions route note, highlight, and bookmark changes through `studyRepositoryProvider` and invalidate annotation providers after writes.

Verification:

- `flutter test test/widget_test.dart test/bible_tts_controller_test.dart`

## Batch 29 - Mobile Study Reader Widgets and Notes UI

Scope reviewed line by line:

- `apps/mobile/lib/features/study/presentation/widgets/ai_study_info_panel.dart` - 54 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/ai_study_sheet.dart` - 240 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_book_section.dart` - 93 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_book_tile.dart` - 37 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_person_sheet.dart` - 172 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_place_sheet.dart` - 175 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_reader_content_view.dart` - 154 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_reader_loading_view.dart` - 101 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_tts_bar.dart` - 139 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/bible_verse_tile.dart` - 158 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/chapter_grid_sheet.dart` - 117 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/chapter_nav_bar.dart` - 72 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/chapter_people_sheet.dart` - 106 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/chapter_places_sheet.dart` - 106 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/continue_reading_card.dart` - 69 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/empty_chapter_view.dart` - 26 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/lexicon_bottom_sheet.dart` - 40 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reader_load_error.dart` - 52 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reader_settings_sheet.dart` - 70 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reading_plan_card.dart` - 119 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reading_plan_day_card.dart` - 108 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reading_plan_detail_sheet.dart` - 244 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/reading_plan_section.dart` - 200 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/related_sermons_section.dart` - 93 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/study_chapter_header.dart` - 73 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/study_loading_view.dart` - 147 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/testament_segmented_control.dart` - 38 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/verse_annotation_sheet.dart` - 249 lines reviewed before and changed section re-reviewed after fix.
- `apps/mobile/lib/features/study/presentation/widgets/verse_church_notes_tab.dart` - 148 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/verse_highlight_options.dart` - 99 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/verse_my_note_tab.dart` - 106 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/verse_picker_sheet.dart` - 89 lines reviewed.
- `apps/mobile/lib/features/study/presentation/widgets/verse_shared_note_card.dart` - 49 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_note.dart` - 47 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_notes_repository.dart` - 140 lines reviewed.
- `apps/mobile/lib/shared/widgets/app_button.dart` - 204 lines re-reviewed for selected color precedence.
- `apps/mobile/test/verse_annotation_sheet_test.dart` - 114 lines reviewed after creation.

Findings fixed:

- `VerseAnnotationSheet` seeded church-note edit state with `null` data and reset seed state after delete. If provider data refreshed with stale pre-delete content, the deleted reflection could repopulate the input field. The sheet now seeds only from an actual existing note and keeps the editor protected from stale reseeding after a successful delete.
- Added `verse_annotation_sheet_test.dart` to reproduce stale provider data after delete and verify the editor remains empty.

Logic chain audit:

- Reader widgets remain presentation-only and receive all book, verse, annotation, sermon, and TTS state from page/session owners.
- Chapter selection uses the shared `AppButton`; default unselected color stays card-like, while selected state is owned by the shared button selected-color path.
- Bible note list/create/update/delete calls remain inside `BibleNotesRepository`, which supplies external user id and optional member access token through shared identity/session owners.
- AI study UI requires a member session and routes generation through `aiStudyRepositoryProvider`; the sheet does not own AI transport.
- Reading-plan widgets call repository actions through `readingPlanRepositoryProvider` and do not mutate plan domain state locally.

Verification:

- `dart format apps/mobile/lib/features/study/presentation/widgets/verse_annotation_sheet.dart apps/mobile/test/verse_annotation_sheet_test.dart`
- `flutter test test/verse_annotation_sheet_test.dart test/widget_test.dart`
- `git diff --check`
- `flutter analyze`

## Batch 30 - Mobile Study Extended Data, TTS, Knowledge, and Reading Plan Progress

Scope reviewed line by line:

- `apps/mobile/lib/features/study/data/ai_study_repository.dart` - 103 lines reviewed.
- `apps/mobile/lib/features/study/domain/ai_study_response.dart` - 25 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_tts_state.dart` - 90 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_tts_engine.dart` - 67 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_tts_controller.dart` - 251 lines reviewed.
- `apps/mobile/test/bible_tts_controller_test.dart` - 320 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_person.dart` - 35 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_place.dart` - 33 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_person_matcher.dart` - 131 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_place_matcher.dart` - 131 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_people_repository.dart` - 279 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_places_repository.dart` - 273 lines reviewed.
- `apps/mobile/lib/features/study/data/reading_plan_repository_contract.dart` - 33 lines reviewed.
- `apps/mobile/lib/features/study/domain/reading_plan.dart` - 137 lines reviewed.
- `apps/mobile/lib/features/study/data/reading_plan_repository.dart` - 180 lines reviewed after fix.
- `apps/mobile/lib/features/study/data/mock_reading_plan_repository.dart` - 149 lines reviewed.
- `apps/mobile/lib/features/study/data/dto/reading_plan_dto.dart` - 160 lines reviewed.
- `apps/mobile/lib/features/study/data/dto/reading_plan_assignment_dto.dart` - 122 lines reviewed.
- `apps/mobile/test/reading_plan_repository_test.dart` - 219 lines reviewed after fix.
- `packages/api_contracts/src/reading-plans.ts` - 196 lines reviewed after contract fix.
- `backend/src/modules/reading-plans/reading-plan.service.ts` - 154 lines reviewed for progress ownership.
- `backend/src/modules/reading-plans/reading-plan.routes.ts` - 124 lines reviewed for progress payload validation.
- `backend/src/modules/reading-plans/reading-plan.repository.ts` - 54 lines reviewed for repository contract.
- `backend/src/modules/reading-plans/reading_plan_status_rules.ts` - 38 lines reviewed.
- `backend/src/modules/reading-plans/in-memory-reading-plan.repository.ts` lines 210-260 reviewed and changed section re-reviewed.
- `backend/src/modules/reading-plans/postgres-reading-plan.repository.ts` lines 253-320 reviewed and changed section re-reviewed.
- `backend/tests/reading_plan.routes.test.ts` - 361 lines reviewed after fix.
- `docs/features/bible_tts.md`, `docs/features/bible_verse_notes.md`, `docs/features/ai_bible_study.md`, `docs/features/reading_plan.md`, `docs/domains/bible_content.md`, `docs/domains/reading_plan.md`, `docs/capabilities/tts_playback.md`, `docs/capabilities/ai_provider.md`, `docs/core/feature_integration.md`, and `docs/core/logic_chain.md` were re-read for Study boundary checks.
- `docs/api.md` reading-plan section, `docs/sdk/bible.md`, and `docs/sdk/growth.md` changed sections were reviewed after documentation updates.

Findings fixed:

- Reading-plan day progress accepted a client-supplied `completedAt` in the shared request contract. The mobile App also supplied a local timestamp for completed days, which made completion time look client-owned even though reading-plan progress is backend-owned. Removed `completedAt` from the update request contract, made both backend repositories derive completion time from the submitted status, stopped the App from sending it, and added App/backend regression assertions.

Logic chain audit:

- AI study repository sends member-authenticated requests only to the backend `/member/ai/study` route and does not expose provider keys or direct provider transport in the App.
- Bible TTS controller owns system TTS lifecycle and maps missing text, language failure, interruption, disposal, pause/resume, and repeated playback into explicit state transitions.
- Bible people/place repositories use remote knowledge when available and fall back to bundled assets, preserving the local Bible reader as the source of scripture text.
- Bible people/place matchers deduplicate chapter-level entities by id and keep repeated-name detection out of reader widgets.
- Reading-plan App flow now sends identity plus `status`/`note` intent only; backend route validates the request, service verifies viewer ownership and day membership, repositories write canonical progress and completion timestamps, and the App refreshes from returned backend state.

Verification:

- `dart format apps/mobile/lib/features/study/data/reading_plan_repository.dart apps/mobile/test/reading_plan_repository_test.dart`
- `flutter test test/reading_plan_repository_test.dart`
- `bun run test -- reading_plan.routes.test.ts` from `backend/`
- `bun run typecheck`
- `flutter analyze`
- `git diff --check`

## Batch 31 - Mobile Study Target Test Completion

Scope reviewed line by line:

- `apps/mobile/test/ai_study_repository_test.dart` - 107 lines reviewed after fix.
- `apps/mobile/test/bible_knowledge_repository_test.dart` - 133 lines reviewed.
- `apps/mobile/test/bible_person_matcher_test.dart` - 60 lines reviewed.
- `apps/mobile/test/bible_place_matcher_test.dart` - 60 lines reviewed.
- `apps/mobile/test/widget_test_harness.dart` - 594 lines reviewed.

Findings fixed:

- `ai_study_repository_test.dart` used `rom-8-28` as the verse id in its Bible passage resource payload. The repository should preserve the canonical local Bible id shape (`rom.8.28`) when forwarding context to the backend AI route. Updated the test data and assertion so future regressions do not normalize toward the wrong id format.

Logic chain audit:

- AI Study repository test now verifies the App sends the member bearer token, canonical Bible passage resource id, reference label, body, question, and locale to the backend AI study route.
- Bible knowledge repository tests verify remote people/place data preserves translation-specific fallback section titles and English fallback behavior for WEB.
- Person/place matcher tests verify chapter-level deduplication order and ASCII word-boundary protection.
- Widget test harness overrides Study repositories with canonical book ids (`rom`, `gen`) and uses the real app router/theme/localization composition rather than bypassing feature providers.

Verification:

- `dart format apps/mobile/test/ai_study_repository_test.dart`
- `flutter test test/ai_study_repository_test.dart test/bible_knowledge_repository_test.dart test/bible_person_matcher_test.dart test/bible_place_matcher_test.dart test/widget_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 32 - Mobile Sermons Data, Player, and Repository Tests

Scope reviewed line by line:

- `docs/features/sermon_discovery.md` - 88 lines re-read for Sermons boundary.
- `docs/features/sermon_publishing.md` - 212 lines re-read for App playback and published-content boundary.
- `docs/capabilities/audio_playback.md` - 98 lines re-read for native playback/session ownership.
- `docs/domains/media_asset.md` - 35 lines re-read for media URL ownership.
- `docs/domains/sermon_discussion_guide.md` - 38 lines re-read for discussion-guide source of truth.
- `docs/sdk/sermons.md` - 84 lines re-read for SDK rules.
- `apps/mobile/lib/features/sermons/domain/sermon.dart` - 80 lines reviewed.
- `apps/mobile/lib/features/sermons/domain/sermon_discussion_guide.dart` - 85 lines reviewed.
- `apps/mobile/lib/features/sermons/domain/sermon_list_request.dart` - 39 lines reviewed.
- `apps/mobile/lib/features/sermons/data/dto/sermon_dto.dart` - 219 lines reviewed.
- `apps/mobile/lib/features/sermons/data/dto/sermon_discussion_guide_dto.dart` - 228 lines reviewed.
- `apps/mobile/lib/features/sermons/data/remote/sermons_remote_data_source.dart` - 17 lines reviewed.
- `apps/mobile/lib/features/sermons/data/remote/api_sermons_remote_data_source.dart` - 76 lines reviewed.
- `apps/mobile/lib/features/sermons/data/remote/mock_sermons_remote_data_source.dart` - 119 lines reviewed.
- `apps/mobile/lib/features/sermons/data/local/sermons_local_data_source.dart` - 288 lines reviewed.
- `apps/mobile/lib/features/sermons/data/sermons_repository.dart` - 230 lines reviewed.
- `apps/mobile/lib/features/sermons/data/sermon_progress_repository.dart` - 119 lines reviewed after fix.
- `apps/mobile/lib/features/sermons/data/sermon_ai_repository.dart` - 116 lines reviewed.
- `apps/mobile/lib/features/sermons/data/sermon_discussion_guide_repository.dart` - 142 lines reviewed after fix.
- `apps/mobile/lib/features/sermons/data/player/sermon_audio_engine.dart` - 147 lines reviewed.
- `apps/mobile/lib/features/sermons/data/player/sermon_playback_progress_coordinator.dart` - 76 lines reviewed.
- `apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart` - 300 lines reviewed.
- `apps/mobile/lib/features/sermons/data/player/sermon_player_session_provider.dart` - 15 lines reviewed.
- `apps/mobile/lib/features/sermons/data/mock_sermon_data.dart` - 78 lines reviewed.
- `apps/mobile/test/sermons_repository_test.dart` - 508 lines reviewed after fix.
- `apps/mobile/test/sermon_player_session_test.dart` - 278 lines reviewed.
- `apps/mobile/test/sermon_ai_repository_test.dart` - 139 lines reviewed.
- `apps/mobile/test/sermon_discussion_guide_repository_test.dart` - 161 lines reviewed after fix.

Findings fixed:

- `SermonProgressRepository.reportProgress` and `ApiSermonDiscussionGuideRepository` directly interpolated sermon and guide ids into URL paths. They now encode path components with `Uri.encodeComponent`, and repository tests use slash-containing ids to lock the behavior.

Logic chain audit:

- Sermon list/detail/recommendation reads flow through `SermonsRepository` and remote/local data sources; widgets are not involved in data ownership.
- Detail fetches treat remote null, 404, and `sermon_not_found` as authoritative misses, delete cached detail, and avoid exposing stale unpublished content.
- Remote list failures can fall back to cached published sermon data; authoritative detail misses do not.
- Audio URLs are accepted only when backend marks audio `ready`, relative media URLs are normalized against API base URL, and local package duration metadata fills missing top-level duration.
- Playback uses `SermonPlayerSession` and the audio engine capability, with system pause/completion saving or reporting progress through `SermonPlaybackProgressCoordinator`.
- Discussion guide responses default to private and use member bearer token plus external user id through `postJsonMapWithIdentity`.

Verification:

- `dart format apps/mobile/lib/features/sermons/data/sermon_progress_repository.dart apps/mobile/lib/features/sermons/data/sermon_discussion_guide_repository.dart apps/mobile/test/sermons_repository_test.dart apps/mobile/test/sermon_discussion_guide_repository_test.dart`
- `flutter test test/sermons_repository_test.dart test/sermon_player_session_test.dart test/sermon_ai_repository_test.dart test/sermon_discussion_guide_repository_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 33 - Mobile Sermons Presentation and Playback Interaction

Scope reviewed line by line:

- `apps/mobile/lib/features/sermons/presentation/sermon_detail_page.dart` - 368 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/sermons_tab.dart` - 309 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_ai_info_panel.dart` - 54 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_ai_question_sheet.dart` - 213 lines reviewed after fix.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_audio_status_pill.dart` - 41 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_card.dart` - 156 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_detail_cards.dart` - 117 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_discussion_guide_parts.dart` - 80 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_discussion_guide_section.dart` - 194 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_discussion_response_sheet.dart` - 120 lines reviewed after fix.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_empty_view.dart` - 22 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_error_view.dart` - 52 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_loading_view.dart` - 134 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_outline_list.dart` - 93 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_player_panel.dart` - 99 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_player_view.dart` - 209 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_reference_list.dart` - 72 lines reviewed.
- `apps/mobile/lib/features/sermons/presentation/widgets/sermon_transcript_card.dart` - 57 lines reviewed.
- `apps/mobile/test/widget_sermon_checks.dart` - 176 lines reviewed.
- `apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart` - 310 lines re-reviewed after fix.
- `apps/mobile/test/sermon_player_session_test.dart` - 350 lines re-reviewed after fix.

Findings fixed:

- `SermonPlayerSession` treated any in-flight source load as a reason to skip a new source load. Switching from one sermon to another while the first source was still loading could leave the new sermon without a loaded source and keep the UI in stale loading state. The session now tracks `_loadingUrl` and only deduplicates the same in-flight URL; a new sermon audio URL starts a new load version, and stale completions are ignored.
- `SermonAiQuestionSheet` did not apply keyboard bottom inset, unlike the discussion response sheet. The AI sheet now uses `SafeArea`, keyboard dismiss on drag, and bottom padding based on `MediaQuery.viewInsetsOf(context).bottom`.
- `SermonDiscussionResponseSheet` used a raw `TextField` instead of the shared filled input component. It now uses `AppFilledTextField`, keeping sermon response inputs aligned with the shared App input styling boundary.

Logic chain audit:

- Sermons tab reads list data through `sermonsProvider`, keeps month selection in UI state, and routes detail selection through `AppRouteNames.sermonDetail`.
- Sermon detail owns only UI state for selected section and speed sheet; sermon data, discussion guide data, AI requests, and playback progress remain in repository/session owners.
- Sermon player UI delegates loading, seeking, playback, completion, and progress reporting to `SermonPlayerSession` and `SermonPlaybackProgressCoordinator`.
- Scripture reference selection routes back to Study reader with canonical book/chapter path parameters and verse query parameter.
- Discussion-guide responses remain private, route through `sermonDiscussionGuideRepositoryProvider`, and use shared identity lookup rather than UI-authored identity data.

Verification:

- `dart format apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart apps/mobile/lib/features/sermons/presentation/widgets/sermon_ai_question_sheet.dart apps/mobile/lib/features/sermons/presentation/widgets/sermon_discussion_response_sheet.dart apps/mobile/test/sermon_player_session_test.dart`
- `flutter test test/sermon_player_session_test.dart test/widget_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 34 - Mobile Life Feed and Event Data Chain

Scope reviewed line by line:

- `docs/features/church_life_publishing.md` - 104 lines re-read for Life publishing/App boundary.
- `docs/features/event_registration.md` - 195 lines re-read for registration source-of-truth rules.
- `docs/features/event_attendance.md` - 100 lines re-read for onsite check-in boundary.
- `docs/domains/event_attendance.md` - 35 lines re-read for attendance domain rules.
- `docs/sdk/life.md` - 161 lines re-read for Life SDK behavior.
- `apps/mobile/lib/features/life/domain/life_post.dart` - 81 lines reviewed.
- `apps/mobile/lib/features/life/domain/life_post_list_request.dart` - 51 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/life_post_dto.dart` - 234 lines reviewed.
- `apps/mobile/lib/features/life/data/life_repository_contract.dart` - 43 lines reviewed.
- `apps/mobile/lib/features/life/data/life_repository.dart` - 66 lines reviewed.
- `apps/mobile/lib/features/life/data/cached_life_repository.dart` - 175 lines reviewed.
- `apps/mobile/lib/features/life/data/remote_life_repository.dart` - 115 lines reviewed.
- `apps/mobile/lib/features/life/data/remote/life_remote_data_source.dart` - 35 lines reviewed.
- `apps/mobile/lib/features/life/data/remote/api_life_remote_data_source.dart` - 166 lines reviewed after fix.
- `apps/mobile/lib/features/life/data/remote/mock_life_remote_data_source.dart` - 287 lines reviewed after fix.
- `apps/mobile/lib/features/life/data/local/life_local_data_source.dart` - 165 lines reviewed.
- `apps/mobile/lib/features/life/data/mock_life_data.dart` - 53 lines reviewed.
- `apps/mobile/test/life_repository_test.dart` - 296 lines reviewed after fix.
- `apps/mobile/test/life_repository_fakes.dart` - 461 lines reviewed after fix.
- `apps/mobile/test/life_local_data_source_test.dart` - 40 lines reviewed.
- `apps/mobile/test/life_refresh_chain_test.dart` - 221 lines reviewed.

Findings fixed:

- `ApiLifeRemoteDataSource` directly interpolated `postId` into member/public detail, read, registration, cancellation, and check-in paths. It now encodes path segments through a single helper, and a Dio-based regression test covers slash and space ids across public and member routes.
- `MockLifeRemoteDataSource` returned members-only posts to guest callers. It now filters mock list/detail results by published status and access-token visibility, matching backend public/member boundaries.

Logic chain audit:

- Life list and detail reads flow through `LifeRepository`, remote data source, and optional local cache. UI does not build route query strings directly.
- Backend remains the source of truth for visibility, status, display ordering, read state, registration status, capacity, and check-in state.
- Local cache can preserve published public/member content for fallback, but it does not generate unread state; cached fallback DTOs return `isRead: true`.
- Authoritative detail misses (`404`, `event_not_found`, `life_post_not_found`, or null remote detail) delete cached detail instead of showing stale hidden content.
- Event register/update/cancel/self-check-in methods submit intents and return backend DTOs; App data layer does not calculate final capacity or attendance.
- Onsite QR check-in uses the dedicated code route and upserts the returned post into cache after backend confirmation.

Verification:

- `dart format apps/mobile/lib/features/life/data/remote/api_life_remote_data_source.dart apps/mobile/lib/features/life/data/remote/mock_life_remote_data_source.dart apps/mobile/test/life_repository_test.dart apps/mobile/test/life_repository_fakes.dart`
- `flutter test test/life_repository_test.dart test/life_local_data_source_test.dart test/life_refresh_chain_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 35 - Mobile Giving and Annual Statements

Scope reviewed line by line:

- `docs/features/giving_flow.md` - 189 lines re-read for payment source-of-truth rules.
- `docs/features/giving_funds.md` - 91 lines re-read for fund source-of-truth rules.
- `docs/features/annual_statement.md` - 171 lines re-read for PDF/export boundary.
- `docs/domains/giving_finance.md` - 35 lines re-read for gross/fee/net rules.
- `docs/domains/giving_fund.md` - 32 lines re-read for fund rules.
- `docs/capabilities/payment_gateway.md` - 49 lines re-read for provider boundary.
- `docs/capabilities/data_export.md` - 53 lines re-read for export boundary.
- `docs/sdk/giving.md` - 43 lines re-read for mobile SDK rules.
- `apps/mobile/lib/features/life/domain/giving_record.dart` - 146 lines reviewed.
- `apps/mobile/lib/features/life/data/giving_repository.dart` - 265 lines reviewed.
- `apps/mobile/lib/features/life/data/annual_statement_export_service.dart` - 76 lines reviewed.
- `apps/mobile/lib/features/life/data/annual_statement_file_service.dart` - 114 lines reviewed.
- `apps/mobile/lib/features/life/presentation/giving_history_page.dart` - 146 lines reviewed.
- `apps/mobile/lib/features/life/presentation/annual_statements_page.dart` - 165 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/giving_checkout_card.dart` - 207 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/giving_fund_dropdown.dart` - 67 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/giving_history_cards.dart` - 175 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/annual_statement_card.dart` - 102 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/annual_statement_export_sheet.dart` - 165 lines reviewed after fix.
- `apps/mobile/test/giving_repository_test.dart` - 249 lines reviewed.
- `apps/mobile/test/giving_checkout_card_test.dart` - 129 lines reviewed.
- `apps/mobile/test/giving_status_cards_test.dart` - 113 lines reviewed after fix.
- `apps/mobile/test/annual_statement_file_service_test.dart` - 84 lines reviewed.

Findings fixed:

- `GivingCheckoutCard` could call `setState` in its async checkout error path after the widget had been disposed. The catch path now checks `mounted`.
- `AnnualStatementExportSheet` checked `context.mounted` on success paths but not on error paths. Both PDF open and share catch paths now guard snackbar display with `context.mounted`.
- `GivingTransactionCard` used hardcoded English `Giving` when a transaction category was empty. It now uses `l10n.givingTitle`, with a Simplified Chinese widget regression test.

Logic chain audit:

- Checkout creation submits amount, currency, backend fund id, fund code category, donor name, and donor email to the backend checkout route; App does not confirm final payment status.
- Checkout return handling only refreshes backend overview immediately and through delayed polling; final status remains backend/webhook-owned.
- Active funds are loaded from the backend and selected before checkout; App does not hardcode fund ids outside mock mode/tests.
- Giving history displays backend gross amount/status/category; fee, net, payout, refund, and dispute ownership remains backend/admin.
- Annual statement list and export data come from backend member giving routes; App only previews/copies/shares returned CSV/PDF data.
- Annual statement PDFs are written to temporary statement-prefixed files, share flow deletes the generated temporary file, and stale temporary PDFs are cleaned by the file service.

Verification:

- `dart format apps/mobile/lib/features/life/presentation/widgets/giving_checkout_card.dart apps/mobile/lib/features/life/presentation/widgets/annual_statement_export_sheet.dart apps/mobile/lib/features/life/presentation/widgets/giving_history_cards.dart apps/mobile/test/giving_status_cards_test.dart`
- `flutter test test/giving_repository_test.dart test/giving_checkout_card_test.dart test/giving_status_cards_test.dart test/annual_statement_file_service_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 36 - Mobile Prayer Requests App Chain

Scope reviewed line by line:

- `docs/features/prayer_moderation.md` - 87 lines re-read for moderation and visibility rules.
- `docs/sdk/life.md` - Prayer SDK section re-read for App repository contract.
- `apps/mobile/lib/features/life/domain/prayer_request.dart` - 39 lines reviewed.
- `apps/mobile/lib/features/life/data/prayer_repository.dart` - 192 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/prayer_request_card.dart` - 86 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/prayer_request_section.dart` - 102 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/life_prayer_tab_view.dart` - 72 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/prayer_request_sheet.dart` - 213 lines reviewed.
- `apps/mobile/test/prayer_repository_test.dart` - 238 lines reviewed after fix.
- `apps/mobile/test/life_privacy_labels_test.dart` - 153 lines reviewed after fix.

Findings fixed:

- `ApiPrayerRepository.fetchMemberRequests` merged the member-owned list before the shared list, but `_dedupeRequests` used a map literal where later duplicates replaced earlier entries. This could show a shared/public copy instead of the member-owned review/private copy. It now preserves the first occurrence.
- `PrayerRequestSection` built member requests first and public requests second, but used the same last-write-wins map pattern. It now preserves the member copy for display and still derives `isMine` from the member list.
- Added a repository regression where the member list and shared list return the same id with different status/title, and a widget regression where the public duplicate must not overwrite the member copy.

Logic chain audit:

- Public prayer reads call the public route without bearer auth; member prayer reads call member-owned and shared member routes with the member access token.
- Guest/member submissions send title, body, visibility, optional submitter name, and optional bearer token to backend ownership; App does not approve or publish prayer requests locally.
- Prayer visibility and moderation status remain backend-owned. UI cards only render returned visibility/status labels and do not infer approval.
- The request sheet uses shared filled fields, keyboard inset padding, and mounted guards around async submit paths.
- Member-owned copies take precedence when the same prayer request appears in more than one feed, preserving private/review state and preventing public feed data from replacing it.

Verification:

- `dart format apps/mobile/lib/features/life/data/prayer_repository.dart apps/mobile/lib/features/life/presentation/widgets/prayer_request_section.dart apps/mobile/test/prayer_repository_test.dart apps/mobile/test/life_privacy_labels_test.dart`
- `flutter test test/prayer_repository_test.dart test/life_privacy_labels_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 37 - Mobile Pastoral Care App Chain

Scope reviewed line by line:

- `docs/features/pastoral_care.md` - 97 lines re-read for App/backend privacy boundary.
- `docs/domains/pastoral_care.md` - 39 lines re-read for care status, privacy, and audit rules.
- `docs/sdk/people.md` - 37 lines re-read for Care repository and DTO boundaries.
- `apps/mobile/lib/features/life/domain/care_request.dart` - 32 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/care_request_dto.dart` - 72 lines reviewed.
- `apps/mobile/lib/features/life/data/care_repository.dart` - 136 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/care_request_card.dart` - 98 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/care_request_section.dart` - 66 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/care_request_sheet.dart` - 206 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_dashboard_support_widgets.dart` - 231 lines reviewed.
- `apps/mobile/test/life_member_support_providers_test.dart` - 126 lines reviewed after fix.
- `apps/mobile/test/life_repository_test.dart` - Care DTO mapping section re-read.
- `apps/mobile/test/life_section_states_test.dart` - 306 lines reviewed.
- `apps/mobile/test/life_status_cards_test.dart` - 221 lines reviewed.

Findings fixed:

- Care provider failure propagation was not covered in the member support provider test file, while sibling group, course, and serving providers were covered. Added a failing Care repository override and assertion that `careRequestsProvider` surfaces the repository failure.

Logic chain audit:

- `CareRepository` requires `MemberSession` for both list and submit actions; unauthenticated users receive an empty provider list and do not get the Care submit entry from `LifePrayerActionCard`.
- `CareRequestDto` maps only member-safe summary fields. It ignores admin-only `internalNote` and `followUps`, and the existing DTO regression verifies those fields are not present on the App domain model.
- Care request submission sends title, body, privacy level, and bearer token to `/me/care-requests`; App does not assign owners, create follow-up records, or transition final status.
- `CareRequestSection` renders loading, retryable error, empty, and card states without owning backend privacy decisions.
- `CareRequestSheet` uses shared filled fields, keyboard inset padding, login gating, validation, and mounted guards for async submit.

Verification:

- `dart format apps/mobile/test/life_member_support_providers_test.dart`
- `flutter test test/life_member_support_providers_test.dart test/life_section_states_test.dart test/life_status_cards_test.dart test/life_repository_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 38 - Mobile Group, Course, and Serving App Chains

Scope reviewed line by line:

- `docs/features/group_ministry.md` - 121 lines re-read for group membership and application boundaries.
- `docs/domains/ministry_group.md` - 34 lines re-read for group source-of-truth rules.
- `docs/features/course_learning.md` - 91 lines re-read for enrollment and course catalog boundaries.
- `docs/domains/course_learning.md` - 36 lines re-read for enrollment/progress separation.
- `docs/features/serving_schedule.md` - 119 lines re-read for serving assignment intent boundaries.
- `docs/domains/serving_schedule.md` - 33 lines re-read for assignment confirmation and leave rules.
- `apps/mobile/lib/features/life/domain/ministry_group.dart` - 33 lines reviewed.
- `apps/mobile/lib/features/life/domain/course_learning.dart` - 60 lines reviewed.
- `apps/mobile/lib/features/life/domain/serving_assignment.dart` - 28 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/ministry_group_dto.dart` - 65 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/course_learning_dto.dart` - 130 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/serving_assignment_dto.dart` - 64 lines reviewed.
- `apps/mobile/lib/features/life/data/group_repository.dart` - 114 lines reviewed after fix.
- `apps/mobile/lib/features/life/data/course_repository.dart` - 117 lines reviewed after fix.
- `apps/mobile/lib/features/life/data/serving_repository.dart` - 113 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/ministry_group_card.dart` - 127 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/ministry_group_section.dart` - 108 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/course_learning_card.dart` - 153 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/course_learning_section.dart` - 108 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/serving_assignment_card.dart` - 119 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/serving_assignment_section.dart` - 119 lines reviewed.
- `apps/mobile/test/life_member_support_repository_test.dart` - 100 lines reviewed after creation.
- `apps/mobile/test/life_member_support_providers_test.dart` - 142 lines re-read.
- `apps/mobile/test/life_section_states_test.dart` - 306 lines re-read.

Findings fixed:

- `ApiGroupRepository.applyToGroup`, `ApiCourseRepository.enroll`, and `ApiServingRepository.confirm/requestLeave` interpolated ids directly into path segments. They now encode ids with `Uri.encodeComponent`.
- Added a Dio-based repository regression that verifies slash/space ids are encoded for group application, course enrollment, serving confirm, and serving leave request paths, while preserving bearer auth and note trimming.

Logic chain audit:

- Group, course, and serving providers all require `MemberSession`; App does not expose member support lists to unauthenticated users.
- Group application, course enrollment, serving confirm, and serving leave are intent submissions only. UI invalidates the relevant provider after success and waits for backend canonical state.
- Cards display returned status, capacity, enrollment, membership, and assignment data; they do not calculate final membership, enrollment, or schedule state.
- Section error paths surface user-facing API messages and provide retry through provider invalidation.
- Mock repositories simulate local UI state only in mock mode; production repositories call backend routes through `ApiClient` and bearer auth.

Verification:

- `dart format apps/mobile/lib/features/life/data/group_repository.dart apps/mobile/lib/features/life/data/course_repository.dart apps/mobile/lib/features/life/data/serving_repository.dart apps/mobile/test/life_member_support_repository_test.dart`
- `flutter test test/life_member_support_repository_test.dart test/life_member_support_providers_test.dart test/life_section_states_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 39 - Mobile Newcomer App Chain

Scope reviewed line by line:

- `docs/features/newcomer_followup.md` - 159 lines re-read for App guest/member submission boundaries.
- `docs/domains/newcomer_followup.md` - 37 lines re-read for external user id and source-of-truth rules.
- `apps/mobile/lib/features/life/domain/newcomer_profile.dart` - 33 lines reviewed.
- `apps/mobile/lib/features/life/data/dto/newcomer_profile_dto.dart` - 80 lines reviewed.
- `apps/mobile/lib/features/life/data/newcomer_repository.dart` - 108 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/newcomer_welcome_sheet.dart` - 210 lines reviewed after fix.
- `apps/mobile/test/newcomer_repository_test.dart` - 155 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/prayer_request_sheet.dart` - success path re-read after sibling fix.
- `apps/mobile/lib/features/life/presentation/widgets/care_request_sheet.dart` - success path re-read after sibling fix.

Findings fixed:

- The newcomer repository test covered logged-in submissions but not the guest `externalUserId` path required by the feature docs. Added a guest regression that verifies no bearer token, the external user id header/payload, trimming, and omission of empty optional fields.
- `NewcomerWelcomeSheet`, `PrayerRequestSheet`, and `CareRequestSheet` popped their bottom sheet and then looked up `ScaffoldMessenger` from the sheet context. They now capture `Navigator` and `ScaffoldMessenger` before async submit work and use those stable references on success.

Logic chain audit:

- Newcomer submission can run without login through `externalUserId`, and can also include member bearer auth when a member session exists.
- App validates display name plus at least one contact method before submit; backend remains responsible for dedupe, assignment, status, and follow-up records.
- `NewcomerProfileDto` maps member-safe profile summary fields and does not expose follow-up notes, assignee ids as editable state, or conversion actions to the App.
- Preferred language is derived from the current locale and sent as payload; source stays `app`.
- Success UI closes the sheet and shows a snackbar without reading from a popped sheet context.

Verification:

- `dart format apps/mobile/lib/features/life/presentation/widgets/newcomer_welcome_sheet.dart apps/mobile/lib/features/life/presentation/widgets/care_request_sheet.dart apps/mobile/lib/features/life/presentation/widgets/prayer_request_sheet.dart apps/mobile/test/newcomer_repository_test.dart`
- `flutter test test/newcomer_repository_test.dart test/prayer_repository_test.dart test/life_privacy_labels_test.dart test/life_member_support_providers_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 40 - Mobile Life Dashboard, Detail, and Event UI

Scope reviewed line by line:

- `docs/features/event_registration.md` - 195 lines re-read for registration/check-in intent boundaries.
- `docs/features/church_life_publishing.md` - 104 lines re-read for Life publishing, read-state, and display-weight rules.
- `docs/domains/content_visibility.md` - 46 lines re-read for visibility source-of-truth rules.
- `apps/mobile/lib/features/life/presentation/life_tab.dart` - 163 lines reviewed.
- `apps/mobile/lib/features/life/presentation/life_post_detail_page.dart` - 400 lines reviewed.
- `apps/mobile/lib/features/life/presentation/life_post_detail_presentation.dart` - 30 lines reviewed.
- `apps/mobile/lib/features/life/presentation/life_post_detail_sheet.dart` - 76 lines reviewed.
- `apps/mobile/lib/features/life/presentation/event_check_in_error_message.dart` - 19 lines reviewed.
- `apps/mobile/lib/features/life/presentation/event_check_in_scan_page.dart` - 314 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/event_registration_action_buttons.dart` - 93 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/event_registration_card.dart` - 218 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_dashboard_tab_bar.dart` - 132 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_dashboard_tab_views.dart` - 201 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_dashboard_view.dart` - 216 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_empty_view.dart` - 22 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_error_view.dart` - 52 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_loading_view.dart` - 87 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_post_card.dart` - 137 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/life_post_card_parts.dart` - 150 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/life_post_classification.dart` - 188 lines reviewed.
- `apps/mobile/lib/features/life/presentation/widgets/life_post_image_fallback.dart` - 62 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/widgets/life_sunday_hero_card.dart` - 189 lines reviewed.
- `apps/mobile/test/life_post_classification_test.dart` - 44 lines reviewed.
- `apps/mobile/test/life_semantic_labels_test.dart` - 137 lines reviewed.
- `apps/mobile/test/widget_life_checks.dart` - 263 lines reviewed.

Findings fixed:

- `LifePostImageFallback` existed as two separate implementations, one in `life_post_card_parts.dart` and one in `life_post_image_fallback.dart`, each with its own icon mapping. The shared fallback widget now owns the mapping and supports `showTitle` for card image fallback, while detail fallback keeps icon-only mode.

Logic chain audit:

- Life tab queries current week/month posts through `lifePostListProvider`, fetches the latest hero through a separate backend-backed list request, and refreshes Life support providers without mutating local canonical state.
- Life dashboard tab counts unread badges only for signed-in members and uses backend-provided `isRead`; local cache does not create unread state.
- Detail page submits registration/update/cancel intents to `LifeRepository`, invalidates detail/list providers after success, and displays structured backend error mappings.
- Detail read marking is scheduled after render and writes through the repository; failure is swallowed so reading is not interrupted, and success invalidates backend-backed providers.
- QR check-in submits scanned code plus member session to repository, invalidates detail/list providers on success, and keeps backend as final check-in owner.
- Action URLs remain external-link actions; App does not treat CTA URLs as internal source-of-truth state.

Verification:

- `dart format apps/mobile/lib/features/life/presentation/widgets/life_post_image_fallback.dart apps/mobile/lib/features/life/presentation/widgets/life_post_card.dart apps/mobile/lib/features/life/presentation/widgets/life_post_card_parts.dart`
- `flutter test test/widget_test.dart test/life_post_classification_test.dart test/life_semantic_labels_test.dart test/life_section_states_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 41 - Mobile Notification And Push App Chain

Scope reviewed line by line:

- `docs/features/notification_delivery.md` - 119 lines re-read for App permission, guest token, inbox, and audience rules.
- `docs/capabilities/notification_delivery.md` - 69 lines re-read for delivery boundary.
- `docs/domains/notification_preference.md` - 38 lines re-read for device token and preference source-of-truth rules.
- `docs/sdk/notifications.md` - 81 lines re-read for SDK/App rules.
- `apps/mobile/lib/features/life/data/firebase_push_device_registration.dart` - 84 lines reviewed.
- `apps/mobile/lib/features/life/data/push_local_notification_presenter.dart` - 97 lines reviewed.
- `apps/mobile/lib/features/life/data/push_notification_inbox_repository.dart` - 263 lines reviewed after fix.
- `apps/mobile/lib/features/life/data/push_notification_platform_service.dart` - 227 lines reviewed.
- `apps/mobile/lib/features/life/data/push_notification_platform_types.dart` - 24 lines reviewed.
- `apps/mobile/lib/features/life/data/push_notification_repository.dart` - 151 lines reviewed after fix.
- `apps/mobile/lib/features/life/presentation/notification_center_page.dart` - 264 lines reviewed.
- `apps/mobile/lib/features/life/presentation/notification_inbox_provider.dart` - 175 lines reviewed.
- `apps/mobile/lib/features/life/presentation/push_notifications_controller.dart` - 270 lines reviewed after fix.
- `apps/mobile/test/push_notification_inbox_repository_test.dart` - 232 lines reviewed after fix.
- `apps/mobile/test/push_notifications_controller_test.dart` - 167 lines reviewed.

Findings fixed:

- `PushNotificationRepository.markInboxItemRead` and `archiveInboxItem` interpolated notification ids directly into member inbox paths. They now encode the notification id path segment, with a regression using slash/space ids.
- `routeFromPushData` generated `/life/posts/:id` and `/sermons/:id` routes without encoding the data id. It now encodes generated path segments while preserving explicit backend-provided `route` values.
- Push startup could skip guest token registration if member session restore failed. `_syncCurrentSession` now treats session restore errors as no session and registers a guest device when permission and token are available.

Logic chain audit:

- App notification permission remains OS-owned; controller requests permission once on first start and uses the Mine switch to request permission or open native notification settings.
- Guest devices can register without bearer auth and are limited by backend audience rules; member devices register with bearer auth when a session exists.
- Local inbox stores foreground/opened FCM messages as guest/offline fallback. Member inbox sync uses backend member notification APIs when a member session exists.
- Notification center marks remote items through backend APIs and falls back to local state on remote failure.
- Push payload route handling uses explicit backend routes when provided and otherwise maps known public types to encoded internal routes without using notification text as routing source of truth.

Verification:

- `dart format apps/mobile/lib/features/life/presentation/push_notifications_controller.dart apps/mobile/lib/features/life/data/push_notification_repository.dart apps/mobile/lib/features/life/data/push_notification_inbox_repository.dart apps/mobile/test/push_notification_inbox_repository_test.dart`
- `flutter test test/push_notification_inbox_repository_test.dart test/push_notifications_controller_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 42 - Mobile Mine, Member Profile, and Preferences

Scope reviewed line by line:

- `docs/features/member_profile.md` - 98 lines re-read for member self-service, admin-owned fields, and auth boundaries.
- `docs/domains/member_identity.md` - 57 lines re-read for identity, privacy, and membership ownership.
- `docs/sdk/people.md` - 37 lines re-read for member profile SDK boundaries.
- `apps/mobile/lib/features/mine/data/member_session_models.dart` - 175 lines reviewed.
- `apps/mobile/lib/features/mine/data/member_session_repository.dart` - 243 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/member_profile_page.dart` - 342 lines reviewed after re-reading in non-truncated chunks.
- `apps/mobile/lib/features/mine/presentation/mine_tab.dart` - 416 lines reviewed after fix.
- `apps/mobile/lib/features/mine/presentation/widgets/about_church_card.dart` - 131 lines reviewed after fix.
- `apps/mobile/lib/features/mine/presentation/widgets/member_life_overview_card.dart` - 166 lines reviewed and removed as unused stale UI.
- `apps/mobile/lib/features/mine/presentation/widgets/member_sign_in_form.dart` - 152 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/member_sign_in_sheet.dart` - 203 lines reviewed after fix.
- `apps/mobile/lib/features/mine/presentation/widgets/mine_giving_card.dart` - 71 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/mine_reading_plan_card.dart` - 185 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/preference_display_section.dart` - 144 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/preference_reader_assist_section.dart` - 97 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/preference_settings_card.dart` - 114 lines reviewed.
- `apps/mobile/lib/features/mine/presentation/widgets/preference_system_section.dart` - 80 lines reviewed.
- `apps/mobile/test/member_session_repository_test.dart` - 115 lines reviewed.
- `apps/mobile/test/mine_tab_test.dart` - 131 lines reviewed.
- `backend/src/modules/members/auth/member-auth.service.ts` lines 280-335 reviewed to confirm `devCode` is non-production only.
- `packages/api_contracts/src/auth.ts` lines 130-160 and 180-195 reviewed to confirm registration email verification contract shape.

Findings fixed:

- `MemberLifeOverviewCard` was an unused stale implementation of the old Mine "My church life" second card. The active Mine UI and tests already require those life chips to live inside the member profile card, so the stale file was deleted.
- Mine profile chips used a local `_FilledPill` implementation even though the shared `AppChip` owns chip shape/color/text behavior. The profile card now uses `AppChip` with filled variants.
- About/contact links were checked with trimmed values but opened with raw settings values. The card now trims address, map URL, phone, email, privacy URL, and terms URL once before display/open.
- The registration email verification `devCode` was displayed whenever the backend returned it. The backend only returns it outside production, and the App now additionally hides it outside Flutter debug builds.
- Member sign-in/sign-out awaited push device sync directly after auth state changes. Push registration sync is now best-effort so notification registration failures do not block a successful member session transition.

Logic chain audit:

- Mine tab remains a composition surface: it reads settings/session/support providers and delegates auth, external links, reading plans, giving history, notification permission, and reader assists to their owners.
- Member profile editing only sends self-service fields through `MemberSessionRepository.updateProfile`; status, roles, email, and fellowship group remain backend/admin-owned read-only values.
- Registration remains controlled by backend App settings, with optional email verification and no App-side hardcoded registration requirement.
- Notification permission remains OS-owned: Mine switch requests permission when disabled and opens native settings when already granted.
- Giving entry stays in Mine and requires member sign-in before opening giving history and statements.
- About card continues to show App-native church information and version only, without reintroducing landing-page app download/social/purpose content.

Verification:

- `dart format apps/mobile/lib/features/mine/presentation/mine_tab.dart apps/mobile/lib/features/mine/presentation/member_profile_page.dart apps/mobile/lib/features/mine/presentation/widgets/member_sign_in_sheet.dart apps/mobile/lib/features/mine/presentation/widgets/about_church_card.dart`
- `flutter test test/member_session_repository_test.dart test/mine_tab_test.dart test/push_notifications_controller_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 43 - Mobile Discipleship Journey App Chain

Scope reviewed line by line:

- `docs/features/discipleship_journey.md` - 196 lines re-read for App surface, source-of-truth, failure-chain, and verification rules.
- `docs/domains/discipleship_journey.md` - 38 lines re-read for domain boundaries.
- `packages/api_contracts/src/discipleship.ts` - 214 lines reviewed for assignment/summary contract.
- `backend/src/modules/discipleship/discipleship.routes.ts` - 24 lines reviewed for member route ownership.
- `apps/mobile/lib/features/discipleship/domain/discipleship_assignment.dart` - 53 lines reviewed.
- `apps/mobile/lib/features/discipleship/data/dto/discipleship_assignment_dto.dart` - 136 lines reviewed after fix.
- `apps/mobile/lib/features/discipleship/data/discipleship_repository.dart` - 111 lines reviewed.
- `apps/mobile/lib/features/discipleship/presentation/widgets/mine_discipleship_card.dart` - 186 lines reviewed after fix.
- `apps/mobile/test/discipleship_repository_test.dart` - 146 lines reviewed after fix.
- `apps/mobile/test/mine_tab_test.dart` - 132 lines reviewed after added assertion.

Findings fixed:

- `DiscipleshipAssignmentDto` and `DiscipleshipTaskProgressDto` used `DateTime.now()` for missing timestamp fallback. This made the App invent local time for backend-owned state. The fallback is now a stable UTC epoch sentinel and is covered by a repository/DTO regression.
- Mine discipleship cards displayed raw `journeyId` values. The App contract does not currently include a journey title, and the App must not copy template content, so the visible card title now uses the localized feature title instead of exposing internal ids. `mine_tab_test` guards against the mock journey id leaking.

Logic chain audit:

- Member Mine UI reads `myDiscipleshipAssignmentsProvider`; guests receive an empty list, and signed-in members fetch `/me/discipleship` with bearer auth.
- App only displays backend assignment summaries: status, `taskTotalCount`, `completedTaskCount`, and assignee display name. It does not calculate completion from `progress.length` and does not submit task-completion mutations.
- The member route is protected by `requireMember`, and the route returns only assignments for `request.member!.id`.
- The contract currently returns `journeyId` but not journey title, so App presentation avoids exposing ids while deferring real journey-name display to a future backend contract addition.

Verification:

- `dart format apps/mobile/lib/features/discipleship/data/dto/discipleship_assignment_dto.dart apps/mobile/lib/features/discipleship/presentation/widgets/mine_discipleship_card.dart apps/mobile/test/discipleship_repository_test.dart apps/mobile/test/mine_tab_test.dart`
- `flutter test test/discipleship_repository_test.dart test/mine_tab_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 44 - Mobile Drift Database Core and Migrations

Scope reviewed line by line:

- `docs/database.md` - 313 lines re-read for local cache, migration, index, sensitive-data, and backend migration rules.
- `apps/mobile/lib/core/database/app_database.dart` - 270 lines reviewed after fix.
- `apps/mobile/lib/core/database/connection/database_connection.dart` - 13 lines reviewed.
- `apps/mobile/lib/core/database/tables/local_bible_tables.dart` - 60 lines reviewed.
- `apps/mobile/lib/core/database/tables/local_life_tables.dart` - 22 lines reviewed.
- `apps/mobile/lib/core/database/tables/local_sermon_tables.dart` - 46 lines reviewed.
- `apps/mobile/lib/core/database/tables/local_study_tables.dart` - 38 lines reviewed.
- `apps/mobile/lib/core/database/tables/sync_queue_table.dart` - 15 lines reviewed.
- `apps/mobile/test/app_database_migration_test.dart` - 242 lines reviewed after fix.
- `apps/mobile/test/test_database.dart` - 17 lines reviewed.

Generated file validation:

- `apps/mobile/lib/core/database/app_database.g.dart` - 10875 generated lines, SHA-256 `8b6738a0243f5c31f0844fd16525b552fbe3c4760195e9b6ba9fd90e95fdcf66`.
- Verified generated header, `_$AppDatabase` table registration lines, and manager tail.
- `dart run build_runner build --delete-conflicting-outputs` completed and left no tracked generated-file diff.

Findings fixed:

- `_createPerformanceIndexes` only created Bible verse-text and Study annotation indexes, while `docs/database.md` and current local query chains need Bible chapter lookup, Sermon date/order, Sermon outline/reference, Life weight/date/type, and SyncQueue indexes.
- Index creation only ran on create and old upgrade paths. Existing schemaVersion 14 databases would not receive newly added indexes. The database now calls `_createPerformanceIndexes()` from `beforeOpen`, using `CREATE INDEX IF NOT EXISTS` for idempotent repair.
- `app_database_migration_test.dart` now verifies the performance indexes exist after a partially upgraded v5 database migrates to the current schema.

Logic chain audit:

- Local Drift cache still excludes giving transactions, annual statements, private prayer, care requests, group rosters, course rosters, private serving notes, AI raw prompts, and payment provider payloads.
- Local Bible seed compatibility remains protected by the version 12 clear of local Bible seed tables only; Study notes/bookmarks and reading progress are not wiped by this migration path.
- New performance indexes are manual SQLite indexes and do not require a Drift generated schema change; build runner confirmed `app_database.g.dart` stays unchanged.
- The app uses `SqfliteQueryExecutor` for production and an in-memory FFI executor for tests.

Verification:

- `dart format apps/mobile/lib/core/database/app_database.dart apps/mobile/test/app_database_migration_test.dart`
- `flutter test test/app_database_migration_test.dart`
- `flutter analyze`
- `dart run build_runner build --delete-conflicting-outputs`
- `git diff --check`

## Batch 45 - Mobile Cross-Cutting Quality Tests and Harness

Scope reviewed line by line:

- `apps/mobile/test/accessibility_semantics_test.dart` - 60 lines reviewed.
- `apps/mobile/test/l10n_placeholder_test.dart` - 27 lines reviewed.
- `apps/mobile/test/user_facing_error_messages_test.dart` - 54 lines reviewed.
- `apps/mobile/test/widget_test_harness.dart` - 594 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Accessibility tests cover Life unread badge semantics and Bible chapter picker semantics using localized MaterialApp setup.
- L10n placeholder test protects dynamic Spanish values for event registration, Mine life chips, unread counts, chapter semantics, related sermons, giving summaries, and annual statement saved paths.
- User-facing error tests confirm event check-in and AI errors do not leak raw exception strings and keep mapped API error messages.
- Widget harness creates isolated SharedPreferences and in-memory Drift database instances, overrides test repositories where needed, uses canonical Bible ids such as `rom.8.28`, and closes the database through `_TestHarness.close`.
- Fake Life and Sermon repositories remain scoped to widget tests and do not alter production owners.

Verification:

- `flutter test test/accessibility_semantics_test.dart test/l10n_placeholder_test.dart test/user_facing_error_messages_test.dart test/widget_test.dart`
- `flutter analyze`
- `git diff --check`

## Batch 46 - Admin Web Core Shell, API, Auth, Config, and I18n

Scope reviewed line by line:

- `docs/surfaces/admin_web.md` - 124 lines reviewed for surface boundaries.
- `docs/agent-workflow/frontend_workflow.md` - 52 lines reviewed for UI workflow rules.
- `apps/admin_web/.env.example` - 1 line reviewed.
- `apps/admin_web/.gitkeep` - 1 line reviewed.
- `apps/admin_web/index.html` - 12 lines reviewed.
- `apps/admin_web/package.json` - 33 lines reviewed.
- `apps/admin_web/tsconfig.json` - 16 lines reviewed.
- `apps/admin_web/vite.config.ts` - 36 lines reviewed.
- `apps/admin_web/src/env.d.ts` - 10 lines reviewed.
- `apps/admin_web/src/main.ts` - 25 lines reviewed after fix.
- `apps/admin_web/src/App.vue` - 16 lines reviewed.
- `apps/admin_web/src/router.ts` - 201 lines reviewed.
- `apps/admin_web/src/layouts/AdminShell.vue` - 300 lines reviewed.
- `apps/admin_web/src/plugins/vuetify.ts` - 33 lines reviewed.
- `apps/admin_web/src/styles.css` - 51 lines reviewed.
- `apps/admin_web/src/core/config/env.ts` - 14 lines reviewed.
- `apps/admin_web/src/core/api/auth.ts` - 50 lines reviewed.
- `apps/admin_web/src/core/api/client.ts` - 263 lines reviewed after fix.
- `apps/admin_web/src/core/api/api_errors.ts` - 98 lines reviewed.
- `apps/admin_web/src/core/auth/auth_storage.ts` - 14 lines reviewed after fix.
- `apps/admin_web/src/core/auth/auth_store.ts` - 90 lines reviewed after fix.
- `apps/admin_web/src/core/actions/action_guard.ts` - 9 lines reviewed.
- `apps/admin_web/src/core/i18n/i18n.ts` - 2383 lines reviewed in small chunks after two larger chunks were discarded because their output was truncated.

Findings fixed:

- `ApiClient.tryRefreshSession` cleared only browser storage when `/admin/auth/refresh` failed. The current tab's Pinia `admin-auth` store could remain authenticated with stale user and permission data. The refresh failure path now uses the shared auth storage helper, emits `mbc-admin-session-cleared`, and the app bootstrap clears the store and redirects protected routes to `/login`.
- Corrupt stored user or permission JSON now clears the full stored admin session instead of leaving a partial token/user/permission state behind.

Logic chain audit:

- Admin UI navigation still gates visible entries by `AdminPermission`, while `router.ts` separately guards protected routes and permissions; menu hiding remains only presentation, not security.
- API requests continue through the shared `ApiClient`, with JSON envelope parsing, blob error conversion, token refresh, and typed schema parsing in one transport owner.
- Session clearing now has one storage owner in `auth_storage.ts`; API client broadcasts session invalidation without importing Pinia, and `main.ts` is the bootstrap owner that bridges the event back into the auth store.
- I18n keeps system-locale fallback, four supported locales, and English fallback for missing Spanish strings. Navigation and shell accessibility labels have entries across the active locale maps.
- Vuetify theme and global CSS remain quiet MD3-oriented admin styling and do not embed business rules.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`

## Batch 47 - Admin Web Business API Helpers

Scope reviewed line by line:

- `docs/agent-workflow/sdk_workflow.md` - 63 lines reviewed for API helper rules.
- `docs/sdk.md` - 102 lines reviewed for shared SDK rules.
- `docs/sdk/admin.md` - 64 lines reviewed for admin Web API helper rules.
- `docs/sdk/errors.md` - 96 lines reviewed for transport/error boundaries.
- `apps/admin_web/src/core/api/admin_users.ts` - 48 lines reviewed after fix.
- `apps/admin_web/src/core/api/ai.ts` - 21 lines reviewed.
- `apps/admin_web/src/core/api/audit_logs.ts` - 37 lines reviewed.
- `apps/admin_web/src/core/api/bible_knowledge.ts` - 91 lines reviewed after fix.
- `apps/admin_web/src/core/api/bible_verse_notes.ts` - 67 lines reviewed after fix.
- `apps/admin_web/src/core/api/care.ts` - 86 lines reviewed after fix.
- `apps/admin_web/src/core/api/courses.ts` - 165 lines reviewed after fix.
- `apps/admin_web/src/core/api/dashboard.ts` - 10 lines reviewed.
- `apps/admin_web/src/core/api/discipleship.ts` - 203 lines reviewed after fix.
- `apps/admin_web/src/core/api/filter_types.ts` - 17 lines reviewed.
- `apps/admin_web/src/core/api/giving.ts` - 191 lines reviewed after fix.
- `apps/admin_web/src/core/api/groups.ts` - 106 lines reviewed after fix.
- `apps/admin_web/src/core/api/jobs.ts` - 85 lines reviewed after fix.
- `apps/admin_web/src/core/api/life_posts.ts` - 225 lines reviewed after fix.
- `apps/admin_web/src/core/api/members.ts` - 73 lines reviewed after fix.
- `apps/admin_web/src/core/api/newcomers.ts` - 98 lines reviewed after fix.
- `apps/admin_web/src/core/api/notifications.ts` - 78 lines reviewed after fix.
- `apps/admin_web/src/core/api/path_segments.ts` - 3 lines added and reviewed.
- `apps/admin_web/src/core/api/prayer_requests.ts` - 97 lines reviewed after fix.
- `apps/admin_web/src/core/api/reading_plans.ts` - 159 lines reviewed after fix.
- `apps/admin_web/src/core/api/sermon_discussion_guides.ts` - 132 lines reviewed after fix.
- `apps/admin_web/src/core/api/sermons.ts` - 173 lines reviewed after fix.
- `apps/admin_web/src/core/api/serving.ts` - 138 lines reviewed after fix.
- `apps/admin_web/src/core/api/settings.ts` - 51 lines reviewed after fix.

Previously completed in Batch 46:

- `apps/admin_web/src/core/api/api_errors.ts` - 98 lines reviewed.
- `apps/admin_web/src/core/api/auth.ts` - 50 lines reviewed.
- `apps/admin_web/src/core/api/client.ts` - 265 lines reviewed after Batch 46 fix.

Findings fixed:

- Path ids in business API helpers were interpolated directly into URL path segments. This could break admin actions for ids containing `/`, spaces, or other reserved path characters. Added `pathSegment(...)` and used it for all admin path ids while leaving query strings under `URLSearchParams`.
- `listAdminSermons` accepted an obsolete array response shape and reconstructed `nextCursor` from envelope meta. Current backend and contract return `sermonListResponseSchema`, so the helper now parses only the current contract shape.

Logic chain audit:

- Admin Web pages continue to call typed helpers under `core/api`; raw fetch remains centralized in `ApiClient`.
- Request payloads still parse through shared `@mbc/api-contracts` request schemas before sending.
- Response payloads still parse through shared response schemas before reaching pages and composables.
- Query parameters remain owned by `URLSearchParams`; `pathSegment(...)` only handles path segment values.
- No backend route or shared contract change was needed because the fix only corrects client URL construction and removes stale client fallback behavior.

Verification:

- `bun run typecheck` from `apps/admin_web`
- ``rg -n '\`/admin/.+\\$\\{' apps/admin_web/src/core/api``
- `rg -n "sermonSchema\\.array|getDataEnvelope\\(" apps/admin_web/src/core/api apps/admin_web/src/features`
- `git diff --check`

## Batch 48 - Admin Web Auth, Dashboard, Audit, and Settings Pages

Scope reviewed line by line:

- `apps/admin_web/src/features/auth/pages/LoginPage.vue` - 157 lines reviewed after fix.
- `apps/admin_web/src/features/dashboard/pages/DashboardPage.vue` - 272 lines reviewed.
- `apps/admin_web/src/features/audit/pages/AuditLogsPage.vue` - 178 lines reviewed.
- `apps/admin_web/src/features/settings/components/SettingsFiltersCard.vue` - 50 lines reviewed.
- `apps/admin_web/src/features/settings/components/SettingsPageHeader.vue` - 32 lines reviewed.
- `apps/admin_web/src/features/settings/pages/SettingsPage.vue` - 533 lines reviewed after fix.
- `apps/admin_web/src/features/settings/settings_presenters.ts` - 145 lines reviewed.

Findings fixed:

- Login redirect validation allowed any string starting with `/`, including protocol-relative `//...` values. The login page now accepts only single-slash internal redirects and falls back to `/`.
- Login sent the email exactly as typed. It now trims the email for submit and for submit-button enablement, without altering the password.
- Settings update permission existed in the disabled save button but not in the form submit handler. `saveSetting()` now guards `settings:update` before parsing or mutating.

Logic chain audit:

- Login still calls only the typed `loginAdmin` helper, stores the returned session through `AdminAuthStore`, and then routes to a safe internal path.
- Dashboard data still flows through `getAdminDashboard`; workspace shortcuts are filtered by `AdminPermission` before navigation.
- Audit logs use `listAuditLogs` and expose before/after JSON only inside the protected admin surface.
- Settings list/update flows remain API-helper based. UI presenters own display labels/icons; backend settings and shared contracts still own setting values and validation.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`

## Batch 49 - Admin Web Life Components and Presenters

Scope reviewed line by line:

- `docs/sdk/life.md` - 160 lines reviewed for Life SDK/admin rules.
- `docs/features/event_registration.md` - 195 lines reviewed for event registration boundaries.
- `docs/features/church_life_publishing.md` - 104 lines reviewed for Life publishing boundaries.
- `docs/features/notification_delivery.md` - 119 lines reviewed for publish-notification boundaries.
- `docs/features/ai_content_assist.md` - 165 lines reviewed for AI draft boundaries.
- `apps/admin_web/src/features/life-posts/components/LifeEventCheckInCodeDialog.vue` - 163 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifeEventRegistrationCreateDialog.vue` - 77 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifeEventRegistrationEditDialog.vue` - 63 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifeEventRegistrationsCard.vue` - 300 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostConfirmDialog.vue` - 40 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostEditorActions.vue` - 123 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostLibraryCard.vue` - 189 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostMarkdownEditor.vue` - 148 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostMarkdownPreview.vue` - 109 lines reviewed.
- `apps/admin_web/src/features/life-posts/components/LifePostPreviewCard.vue` - 70 lines reviewed.
- `apps/admin_web/src/features/life-posts/life_post_presenters.ts` - 79 lines reviewed after fix.

Findings fixed:

- `life_post_presenters.ts` carried stale `processing` and `failed` Life post status colors. The Life contract and feature docs only allow `draft`, `needs_review`, `published`, and `archived`, so the stale entries were removed and the color maps now use typed records.

Logic chain audit:

- Event registration components emit admin intents only; capacity, check-in state, status transitions, and export behavior remain backend/API owned.
- QR code printing escapes post title, labels, dates, and short code before writing print markup.
- Markdown preview disables raw HTML and does not write AI output or markdown output directly into source-of-truth data.
- Life display weight appears in Admin Web as an editor/operator field, while App-facing docs still prohibit rendering it as a priority chip.
- Publish/unpublish/archive/delete controls are disabled by permission/readiness props; the actual side effects remain in the controller/API layer.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`

## Batch 50 - Admin Web Life Controller and Page

Scope reviewed line by line:

- `apps/admin_web/src/features/life-posts/composables/use_life_event_registrations.ts` - 213 lines reviewed.
- `apps/admin_web/src/features/life-posts/composables/use_life_post_ai_drafts.ts` - 115 lines reviewed.
- `apps/admin_web/src/features/life-posts/composables/use_life_post_confirm_actions.ts` - 55 lines reviewed.
- `apps/admin_web/src/features/life-posts/composables/use_life_post_image_state.ts` - 85 lines reviewed.
- `apps/admin_web/src/features/life-posts/composables/use_life_posts_page_controller.ts` - 652 lines reviewed after fix.
- `apps/admin_web/src/features/life-posts/pages/LifePostsPage.vue` - 552 lines reviewed after fix.

Findings fixed:

- Life page form submit and action emits could call mutations directly even when UI buttons were disabled. The controller now owns guarded methods for save, submit review, return draft, publish, unpublish, archive, and delete.
- Life post payload construction sent untrimmed text fields despite using trimmed values for readiness checks. Payload construction now trims type, title, body, meta, and icon name, with a default icon fallback.

Logic chain audit:

- Life content create/update/publish/archive/delete still flows through typed API helpers; the page no longer calls mutations directly for high-risk actions.
- Publish notification remains an explicit admin choice and only enters the publish payload when `notifyAppOnPublish` is true.
- AI draft composable only writes editable form fields and does not save, publish, or call providers directly.
- Event registration composable emits backend intents for create, update, status change, QR generation, and CSV export; it does not calculate capacity or mutate canonical registration state locally.
- Image upload composable validates size/type before using the API helper and stores only the returned image URL in the form.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`

## Batch 51 - Admin Web Sermon Components, AI Draft Panel, and Pipeline Presenter

Scope reviewed line by line:

- `docs/sdk/sermons.md` - 84 lines re-read for sermon SDK and contract boundary.
- `docs/sdk/ai.md` - 85 lines re-read for admin AI draft contract boundary.
- `docs/features/sermon_publishing.md` - 212 lines re-read for sermon publishing ownership and local processing boundary.
- `docs/features/sermon_discovery.md` - 88 lines re-read for App-facing sermon read model boundary.
- `docs/capabilities/media_processing.md` - 52 lines re-read for local processing capability boundary.
- `docs/capabilities/ai_provider.md` - 82 lines re-read for AI provider boundary.
- `apps/admin_web/src/features/ai/components/AdminAiDraftPanel.vue` - 192 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonAudioTab.vue` - 148 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonEditorActions.vue` - 138 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonLibraryCard.vue` - 172 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonManualDraftCard.vue` - 140 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonMetadataTab.vue` - 95 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonOutlineTab.vue` - 80 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonPipelineTab.vue` - 139 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonReferencesTab.vue` - 76 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonReviewTab.vue` - 105 lines reviewed.
- `apps/admin_web/src/features/sermons/components/SermonTranscriptTab.vue` - 57 lines reviewed.
- `apps/admin_web/src/features/sermons/sermon_pipeline.ts` - 130 lines reviewed.

Findings:

- No source changes were required in this layer.

Logic chain audit:

- Sermon UI components render forms, status chips, checklist state, and action buttons, but they emit events instead of calling storage, backend mutations, or publishing logic directly.
- `AdminAiDraftPanel` generates editable draft text through the typed admin AI API helper and emits an apply event only; generated content is not saved or published automatically.
- Audio upload UI only accepts local file input and delegates validation/upload to the surrounding controller. It does not access object storage directly.
- Pipeline UI describes local processing and does not expose YouTube import, server transcription, or worker retry controls.
- The repository has no current reference to the old `docs/features/sermon_upload.md`; sermon upload/publishing rules are documented by `docs/features/sermon_publishing.md`.

Deferred follow-up:

- The sermon metadata form includes status selection. The next sermon controller/API batch must confirm that ordinary save actions cannot bypass backend-owned publish validation or status-transition ownership.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`

## Batch 52 - Admin Web Sermon Controller, Forms, Audio State, and Page Wiring

Scope reviewed line by line:

- `apps/admin_web/src/features/sermons/composables/use_sermon_ai_drafts.ts` - 129 lines reviewed.
- `apps/admin_web/src/features/sermons/composables/use_sermon_audio_state.ts` - 191 lines reviewed after fix.
- `apps/admin_web/src/features/sermons/composables/use_sermon_editor_forms.ts` - 259 lines reviewed after fix.
- `apps/admin_web/src/features/sermons/composables/use_sermon_library_query.ts` - 72 lines reviewed.
- `apps/admin_web/src/features/sermons/composables/use_sermon_pipeline_state.ts` - 301 lines reviewed.
- `apps/admin_web/src/features/sermons/composables/use_sermon_workflow.ts` - 38 lines reviewed.
- `apps/admin_web/src/features/sermons/composables/use_sermons_page_controller.ts` - 581 lines reviewed after fix.
- `apps/admin_web/src/features/sermons/pages/SermonsPage.vue` - 297 lines reviewed after fix.
- `apps/admin_web/src/features/sermons/components/SermonEditorActions.vue` - 145 lines re-reviewed after fix.
- `apps/admin_web/src/features/sermons/components/SermonMetadataTab.vue` - 64 lines re-reviewed after fix.

Findings fixed:

- Ordinary sermon save sent `status` from the metadata form through `UpdateSermonRequest`, so a content edit could also become a status migration. Removed the status field from ordinary save and removed the metadata status select; only save-for-review and save-and-publish inject a status.
- Sermon page and audio action emits called mutations directly or relied on UI disabled state. Added controller guard methods and mutation-level permission/readiness checks for create, save, review, publish, status transitions, archive/delete, and audio upload/preview/delete.

Logic chain audit:

- Manual sermon creation still uses the typed local draft API and does not upload media or publish automatically.
- AI draft apply functions only update editable form state; they do not call save, review, publish, or object storage.
- Ordinary save now updates only content fields and leaves status transitions to explicit workflow actions.
- Save-for-review and save-and-publish call the same typed update API with explicit status, while backend service remains the publish-readiness owner.
- Pure publish, submit-review, return-draft, mark-failed, archive, and delete actions use dedicated admin API helpers and are now called through controller guards instead of page-level mutation calls.
- Audio upload and delete require `sermons:update`; audio preview requires an existing ready audio record and still uses the admin audio API helper rather than direct object storage.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg -n "\.mutate\(|editForm\.status|status: editForm\.status|v-model=\"editForm.status\"" apps/admin_web/src/features/sermons/pages apps/admin_web/src/features/sermons/components apps/admin_web/src/features/sermons/composables`

## Batch 53 - Admin Web Bible Knowledge and Bible Verse Notes

Scope reviewed line by line:

- `docs/features/bible_verse_notes.md` - 163 lines re-read.
- `docs/features/ai_bible_study.md` - 165 lines re-read for Bible knowledge and AI study boundary.
- `docs/domains/bible_content.md` - 35 lines re-read.
- `docs/sdk/bible.md` - 64 lines re-read.
- `packages/api_contracts/src/bible-knowledge.ts` - 80 lines re-read.
- `packages/api_contracts/src/bible-verse-notes.ts` - 92 lines re-read.
- `apps/admin_web/src/core/api/bible_knowledge.ts` - 91 lines re-read.
- `apps/admin_web/src/core/api/bible_verse_notes.ts` - 67 lines re-read.
- `apps/admin_web/src/features/bible-knowledge/components/BibleKnowledgeEntityListCard.vue` - 134 lines reviewed.
- `apps/admin_web/src/features/bible-knowledge/pages/BibleKnowledgePage.vue` - 538 lines reviewed after fix.
- `apps/admin_web/src/features/bible-notes/pages/BibleNotesPage.vue` - 342 lines reviewed after fix.

Findings fixed:

- Bible Knowledge create/update/delete actions were directly triggered from page event bindings and mutation functions had no permission guard. Added guarded save/delete functions and mutation-level `bible_knowledge:update` checks.
- Bible Knowledge payload construction sent untrimmed text fields and surfaced raw JSON parse failures for verse aliases. Added trimmed payload builders and a stable invalid JSON error.
- Bible Verse Notes hide/restore actions were directly triggered from page event bindings and mutation functions had no moderation guard. Added guarded hide/restore functions and mutation-level `bible_notes:moderate` checks.
- Bible Verse Notes UI exposed hide for deleted notes and showed raw status/author labels. The drawer now exposes hide only for `published`, restore only for `hidden`, and localizes status/author labels plus the Verse ID filter label.

Logic chain audit:

- Admin Web still manages Bible knowledge metadata only; it does not edit packaged local Bible text or become Bible text source of truth.
- Bible knowledge list/create/update/delete uses typed admin API helpers with encoded path ids and locale/translation query keys.
- Verse note moderation only hides/restores backend-owned public心得 records; it does not edit note content, forge authors, or alter local private Study notes.
- Deleted verse notes remain non-actionable in Admin Web moderation UI.
- Public verse notes remain connected to local Bible content only through `verseId`, not by copying Bible text into note payloads.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg -n "@click=\".*Mutation\.mutate|label=\"verseId\"|\{\{ note\.status \}\}|\{\{ selectedNote\.status \}\}|authStore\.can\('bible_knowledge:update'\)" apps/admin_web/src/features/bible-knowledge apps/admin_web/src/features/bible-notes`

## Batch 54 - Admin Web Pastoral Care, Courses, and Groups

Scope reviewed line by line:

- `docs/features/pastoral_care.md` - 97 lines re-read.
- `docs/features/course_learning.md` - 91 lines re-read.
- `docs/features/group_ministry.md` - 121 lines re-read.
- `docs/domains/pastoral_care.md` - 39 lines re-read.
- `docs/domains/course_learning.md` - 36 lines re-read.
- `docs/domains/ministry_group.md` - 34 lines re-read.
- `docs/sdk/ministry.md` - 56 lines re-read.
- `apps/admin_web/src/features/care/pages/CarePage.vue` - 503 lines reviewed after fix.
- `apps/admin_web/src/features/courses/components/CourseEditorDrawer.vue` - 126 lines reviewed after fix.
- `apps/admin_web/src/features/courses/pages/CoursesPage.vue` - 595 lines reviewed after fix.
- `apps/admin_web/src/features/groups/components/GroupEditorDrawer.vue` - 231 lines reviewed after fix.
- `apps/admin_web/src/features/groups/pages/GroupsPage.vue` - 315 lines reviewed after fix.

Findings fixed:

- Care request update and follow-up submit paths called mutations directly and mutation functions lacked a permission guard. Added guarded submit functions, `care:manage` mutation checks, pending disabled states, trimmed internal/follow-up text, and invalid datetime protection.
- Course save, lesson status, lesson creation, and enrollment actions could be triggered directly from template events. Added guarded action methods, `courses:manage` mutation checks, trimmed course/lesson payloads, safe datetime conversion, normalized capacity/sort order, and clamped enrollment progress.
- Course lesson and enrollment buttons did not consistently reflect pending state even though the controller guarded the action. Added disabled/loading states to prevent duplicate privileged writes from the UI.
- Group save and application review paths called mutations directly and mutation functions lacked permission guards. Added guarded save/review methods, `groups:manage` mutation checks, trimmed group payloads, normalized capacity, and pending disabled states in the drawer.

Logic chain audit:

- Pastoral Care admin UI still only edits admin-owned status, assignment, privacy, internal notes, and follow-up records; member-safe App care summaries remain backend/DTO owned.
- Course management remains split between course content, lessons, and enrollments; Admin Web emits typed API intents and does not calculate completion outside the bounded lesson count.
- Group management still keeps applications and review decisions behind the group admin route/API; the drawer only emits review intent and the page action guard owns permission/pending checks.
- Payload normalization happens at the page/controller layer before typed API helpers; backend remains owner of persistence, audit, and final access enforcement.
- Reads that were truncated by tool output were discarded and re-run in smaller chunks before marking the files complete.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg "mutation\\.mutate\\(|@save=\\\".*Mutation|@review=\\\".*Mutation|new Date\\([^\\n]+\\)\\.toISOString\\(\\)" apps/admin_web/src/features/care/pages/CarePage.vue apps/admin_web/src/features/courses/pages/CoursesPage.vue apps/admin_web/src/features/groups/pages/GroupsPage.vue apps/admin_web/src/features/courses/components/CourseEditorDrawer.vue apps/admin_web/src/features/groups/components/GroupEditorDrawer.vue`

## Batch 55 - Admin Web Members, Users, Newcomers, Prayer, Notifications, and Serving

Scope reviewed line by line:

- `docs/agent-workflow/frontend_workflow.md` - 52 lines re-read.
- `docs/agent-workflow/agent_ownership.md` - 112 lines re-read.
- `docs/agent-workflow/code_splitting.md` - 58 lines re-read.
- `docs/agent-workflow/file_naming.md` - 63 lines re-read.
- `docs/features/member_profile.md` - 98 lines re-read.
- `docs/features/newcomer_followup.md` - 159 lines re-read.
- `docs/features/prayer_moderation.md` - 87 lines re-read.
- `docs/features/notification_delivery.md` - 119 lines re-read.
- `docs/features/serving_schedule.md` - 119 lines re-read.
- `docs/domains/member_identity.md` - 57 lines re-read.
- `docs/domains/newcomer_followup.md` - 37 lines re-read.
- `docs/domains/notification_preference.md` - 38 lines re-read.
- `docs/domains/serving_schedule.md` - 33 lines re-read.
- `docs/sdk/admin.md` - 64 lines re-read.
- `docs/sdk/notifications.md` - 81 lines re-read.
- `docs/sdk/prayer.md` - 35 lines re-read.
- `apps/admin_web/src/features/members/pages/MembersPage.vue` - 465 lines reviewed after fix.
- `apps/admin_web/src/features/users/pages/UsersPage.vue` - 421 lines reviewed after fix.
- `apps/admin_web/src/features/newcomers/newcomer_presenters.ts` - 63 lines reviewed after fix.
- `apps/admin_web/src/features/newcomers/pages/NewcomersPage.vue` - 518 lines reviewed after fix.
- `apps/admin_web/src/features/prayer/pages/PrayerPage.vue` - 543 lines reviewed after fix.
- `apps/admin_web/src/features/notifications/pages/NotificationsPage.vue` - 459 lines reviewed after fix.
- `apps/admin_web/src/features/serving/pages/ServingPage.vue` - 520 lines reviewed after fix.

Findings fixed:

- Member management create/update/delete relied on direct mutation calls and sent untrimmed profile fields. Added guarded save/delete functions, mutation-level `users:manage` checks, trimmed member payloads, and pending disabled states.
- Admin user create/update/password reset relied on direct mutation calls and lacked mutation-level permission checks. Added guarded create/save/reset functions, `users:manage` checks, trimmed email/name fields, and pending disabled states.
- Newcomer update/follow-up paths relied on direct mutation calls, sent untrimmed fields, and used datetime conversion that could throw. Added guarded save/follow-up functions, `newcomers:manage` checks, trimmed payloads, and safe datetime conversion.
- Prayer moderation save/approve/hide/archive/delete relied on direct mutation calls and sent untrimmed moderation fields. Added guarded moderation functions, mutation-level `prayer:moderate` checks, trimmed group/note fields, and pending disabled states.
- Notification retry-due, retry-one, and cancel actions relied on button visibility and direct mutation calls. Added guarded functions, mutation-level `notifications:manage` checks, retry/cancel state validation, and load-more fetch protection.
- Serving team, role, assignment, confirm, and cancel actions relied on direct mutation calls, sent untrimmed payloads, and did not guard team-role mismatch on assignment creation. Added guarded actions, `serving:manage` checks, trimmed payload builders, safe datetime conversion, pending disabled states, and role/team consistency validation.

Logic chain audit:

- Member and admin-user pages remain Admin Web surfaces over typed API helpers; backend remains owner of identity, roles, status, password hashing, and permission enforcement.
- Newcomer follow-up remains separate from member profile and pastoral care; Admin Web now submits sanitized update/follow-up intents without writing other feature state.
- Prayer moderation UI still does not decide public visibility outside backend APIs; approve/hide/archive/delete now pass through guarded admin API helpers with no private payload in notifications.
- Notification Admin Web still lists delivery tasks and requests retry/cancel only; it does not mutate canonical messages, inbox rows, or provider state directly.
- Serving Admin Web now prevents a selected role from being submitted under a different team before the typed API call, while backend remains final owner of assignment validation and audit.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg "mutation\\.mutate\\(|@submit\\.prevent=\\\".*Mutation|new Date\\([^\\n]+\\)\\.toISOString\\(\\)" apps/admin_web/src/features/members/pages/MembersPage.vue apps/admin_web/src/features/users/pages/UsersPage.vue apps/admin_web/src/features/newcomers apps/admin_web/src/features/prayer/pages/PrayerPage.vue apps/admin_web/src/features/notifications/pages/NotificationsPage.vue apps/admin_web/src/features/serving/pages/ServingPage.vue`

## Batch 56 - Admin Web Jobs, Reading Plans, and Sermon Discussion Guides

Scope reviewed line by line:

- `docs/features/reading_plan.md` - 150 lines re-read.
- `docs/features/sermon_discussion_guide.md` - 153 lines re-read.
- `docs/domains/reading_plan.md` - 38 lines re-read.
- `docs/domains/sermon_discussion_guide.md` - 38 lines re-read.
- `docs/sdk/sermons.md` - 84 lines re-read.
- `docs/capabilities/media_processing.md` - 52 lines re-read.
- `docs/capabilities/scheduled_notification.md` - 57 lines re-read.
- `apps/admin_web/src/features/jobs/components/JobFailureDiagnostics.vue` - 188 lines reviewed.
- `apps/admin_web/src/features/jobs/components/JobPipelineReadinessCard.vue` - 77 lines reviewed.
- `apps/admin_web/src/features/jobs/components/JobQueueCard.vue` - 144 lines reviewed.
- `apps/admin_web/src/features/jobs/composables/use_jobs_page_controller.ts` - 232 lines reviewed after fix.
- `apps/admin_web/src/features/jobs/pages/JobsPage.vue` - 317 lines reviewed after fix.
- `apps/admin_web/src/features/reading-plans/components/ReadingPlanAssignmentsPanel.vue` - 119 lines reviewed after fix.
- `apps/admin_web/src/features/reading-plans/components/ReadingPlanDaysPanel.vue` - 135 lines reviewed after fix.
- `apps/admin_web/src/features/reading-plans/pages/ReadingPlansPage.vue` - 533 lines reviewed after fix.
- `apps/admin_web/src/features/sermon-discussion-guides/components/SermonDiscussionGuideEditor.vue` - 255 lines reviewed after fix.
- `apps/admin_web/src/features/sermon-discussion-guides/components/SermonDiscussionQuestionCard.vue` - 82 lines reviewed.
- `apps/admin_web/src/features/sermon-discussion-guides/components/SermonDiscussionResponsesPanel.vue` - 164 lines reviewed after fix.
- `apps/admin_web/src/features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue` - 466 lines reviewed after fix.

Findings fixed:

- Jobs cancel and mark-succeeded actions relied on page button state and direct mutation calls. Added controller-owned guarded actions, mutation-level `jobs:manage` and status checks, and duplicate fetch protection for pagination.
- Reading plan save/day/assignment actions called mutations directly and sent untrimmed or loosely normalized payloads. Added guarded page actions, mutation-level `reading_plans:manage` checks, trimmed payload builders, day/reference number normalization, and pending disabled states.
- Reading plan assignment UI did not reflect the feature contract that assignments require a published plan and that `members` visibility cannot be assigned to an external user id. Added action/readiness guards for both constraints while leaving backend as the final validator.
- Sermon discussion guide save and response-hide actions called mutations directly and mutation functions lacked permission/readiness guards. Added guarded save/hide functions, mutation-level `sermon_guides:manage` checks, non-public audience id readiness, and pending disabled states.

Logic chain audit:

- Jobs Admin Web remains an operational diagnostics surface; local sermon processing still belongs to the local workstation workflow, and the VPS/Admin Web only shows job state and limited admin status actions.
- Reading plans still store only references and plan metadata; Admin Web does not edit or copy Bible text, and App local Bible remains scripture source of truth.
- Reading plan assignments now submit only sanitized intent to the typed API helper; backend remains owner of assignment state, visibility validation, and audit.
- Sermon discussion guides remain separate from sermon source content; guide payloads contain discussion structure and references, not sermon transcript/audio source of truth.
- Response moderation only hides backend-owned discussion responses and does not edit response content or forge user ownership.

Documentation gap:

- No dedicated `docs/features/jobs.md` or `docs/domains/jobs.md` exists. Jobs were audited as an Admin Web operational surface using `docs/sdk/admin.md`, media-processing, and scheduled-notification boundaries.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg "mutation\\.mutate\\(|@save-guide=\\\".*Mutation|@save-day=\\\".*Mutation|@assign=\\\".*Mutation|@click=\\\".*Mutation|new Date\\([^\\n]+\\)\\.toISOString\\(\\)" apps/admin_web/src/features/jobs apps/admin_web/src/features/reading-plans apps/admin_web/src/features/sermon-discussion-guides`

## Batch 57 - Admin Web Discipleship Journey

Scope reviewed line by line:

- `docs/features/discipleship_journey.md` - 196 lines re-read.
- `docs/domains/discipleship_journey.md` - 38 lines re-read.
- `docs/features/course_learning.md` - 91 lines re-read.
- `docs/domains/course_learning.md` - 36 lines re-read.
- `docs/features/member_profile.md` - 98 lines re-read.
- `docs/domains/member_identity.md` - 57 lines re-read.
- `docs/features/newcomer_followup.md` - 159 lines re-read.
- `docs/domains/newcomer_followup.md` - 37 lines re-read.
- `docs/sdk/admin.md` - 64 lines re-read.
- `docs/agent-workflow/frontend_workflow.md` - 52 lines re-read.
- `docs/agent-workflow/agent_ownership.md` - 112 lines re-read.
- `docs/agent-workflow/code_splitting.md` - 58 lines re-read.
- `docs/agent-workflow/file_naming.md` - 63 lines re-read.
- `packages/api_contracts/src/discipleship.ts` - 213 lines reviewed.
- `apps/admin_web/src/core/api/discipleship.ts` - 203 lines reviewed.
- `apps/admin_web/src/features/discipleship/components/DiscipleshipStagesTable.vue` - 36 lines reviewed.
- `apps/admin_web/src/features/discipleship/components/DiscipleshipTasksTable.vue` - 56 lines reviewed.
- `apps/admin_web/src/features/discipleship/components/DiscipleshipAssignmentsPanel.vue` - 258 lines reviewed after fix.
- `apps/admin_web/src/features/discipleship/components/DiscipleshipJourneyEditor.vue` - 280 lines reviewed after fix.
- `apps/admin_web/src/features/discipleship/components/DiscipleshipProgressDrawer.vue` - 246 lines reviewed after fix.
- `apps/admin_web/src/features/discipleship/composables/use_discipleship_page_controller.ts` - 531 lines reviewed after extraction.
- `apps/admin_web/src/features/discipleship/pages/DiscipleshipPage.vue` - 219 lines reviewed after extraction.

Findings fixed:

- Discipleship journey, stage, task, assignment, and progress actions were triggered directly from the page through mutation calls or relied on button disabled state. Added controller-owned guarded actions plus mutation-level `discipleship:manage` and readiness checks.
- Assignment creation did not reflect the feature contract that only `active` journeys can receive new assignments. Added action and mutation guards so draft, paused, or archived journeys cannot be assigned from Admin Web.
- Non-manual task creation could submit an empty reference id even though discipleship tasks are supposed to store stable references to owner features. Added readiness checks requiring `referenceId` for every reference type except `manual_review`.
- Payload construction was mixed into the page and sent loosely normalized form state. Added trimmed payload builders for journey, stage, task, assignment, and progress updates; sort order values are normalized before typed API helper calls.
- Adding these guards pushed `DiscipleshipPage.vue` past the Admin Web page hard limit. Extracted query, mutation, payload, permission, and readiness ownership into `use_discipleship_page_controller.ts`, reducing the page to layout and component composition.
- Progress drawer save now has a function-level guard for permission, pending state, selected assignment, and dirty state before emitting a save intent.

Logic chain audit:

- Admin Web remains a discipleship orchestration surface; it stores references and progress intents only, and does not copy Bible text, sermon content, course material, group membership, serving assignments, or newcomer/member source-of-truth data.
- `DiscipleshipPage.vue` now routes user actions through the controller; the controller builds typed payloads and calls `core/api/discipleship.ts`; the API helper validates contracts from `packages/api_contracts/src/discipleship.ts`; the backend remains final owner of authorization, reference existence, state transitions, and audit.
- Assignment creation now requires selected journey status `active` before Admin Web sends the API intent, matching the feature document while leaving backend as the canonical validator.
- Progress updates are scoped to the selected assignment and selected journey tasks before submission; backend still owns canonical completion counts and task progress state.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg "mutation\\.mutate\\(|@add-stage=\\\".*Mutation|@add-task=\\\".*Mutation|@save-journey=\\\".*Mutation|@assign=\\\".*Mutation|@update-progress=\\\".*Mutation|journeysQuery|assignmentsQuery|stagesQuery|tasksQuery" apps/admin_web/src/features/discipleship/pages apps/admin_web/src/features/discipleship/components`

## Batch 58 - Admin Web Giving Finance

Scope reviewed line by line:

- `docs/features/giving_flow.md` - 189 lines re-read.
- `docs/features/annual_statement.md` - 171 lines re-read.
- `docs/features/giving_funds.md` - 91 lines re-read.
- `docs/domains/giving_finance.md` - 35 lines re-read.
- `docs/domains/giving_fund.md` - 32 lines re-read.
- `docs/capabilities/payment_gateway.md` - 49 lines re-read.
- `docs/sdk/giving.md` - 43 lines re-read.
- `docs/agent-workflow/product_boundaries.md` - 57 lines re-read.
- `docs/agent-workflow/backend_workflow.md` - 72 lines re-read.
- `docs/agent-workflow/verification.md` - 69 lines re-read.
- `docs/agent-workflow/frontend_workflow.md` - 52 lines re-read.
- `docs/agent-workflow/code_splitting.md` - 58 lines re-read.
- `docs/agent-workflow/file_naming.md` - 63 lines re-read.
- `packages/api_contracts/src/giving.ts` - 324 lines reviewed.
- `apps/admin_web/src/core/api/giving.ts` - 200 lines reviewed after fix.
- `apps/admin_web/src/features/giving/components/GivingCategoryReportCard.vue` - 32 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingFundDrawer.vue` - 150 lines reviewed after fix.
- `apps/admin_web/src/features/giving/components/GivingFundsCard.vue` - 109 lines reviewed after fix.
- `apps/admin_web/src/features/giving/components/GivingProviderEventDrawer.vue` - 62 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingProviderEventsCard.vue` - 118 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingReconciliationCard.vue` - 132 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingStatementGeneratorCard.vue` - 75 lines reviewed after fix.
- `apps/admin_web/src/features/giving/components/GivingStatementsCard.vue` - 108 lines reviewed after fix.
- `apps/admin_web/src/features/giving/components/GivingSummaryCards.vue` - 47 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingTransactionDrawer.vue` - 104 lines reviewed.
- `apps/admin_web/src/features/giving/components/GivingTransactionsCard.vue` - 136 lines reviewed.
- `apps/admin_web/src/features/giving/composables/use_giving_page_controller.ts` - 529 lines reviewed after fix.
- `apps/admin_web/src/features/giving/pages/GivingPage.vue` - 241 lines reviewed after fix.

Findings fixed:

- Export, statement generation, and statement download were high-risk finance actions but Admin Web exposed export/generate as direct mutation objects and had no statement download wiring. Added guarded controller actions, mutation-level `giving:export` checks, download helper wiring for `/admin/giving/statements/:year/download`, and typed CSV download handling.
- Fund create/update API helpers existed but the Admin Web fund surface was read-only. Added a guarded fund maintenance path with new/edit drawer form, `giving:manage` action and mutation checks, trimmed fund payload construction, target amount normalization, and fund query invalidation.
- Giving page and components accepted query and mutation objects directly. Replaced those crossings with explicit controller-owned refresh/action/pending/error props so UI components no longer own TanStack mutation/query behavior.
- Statement download buttons now respect statement readiness (`ready` or `sent`) and disable while a download is pending.

Logic chain audit:

- App Store / Play IAP remains out of scope; Admin Web giving actions call backend giving APIs only, and the backend remains source of truth for payment status, fees, refunds, disputes, payout, reconciliation, and annual statements.
- `GivingPage.vue` now composes UI over controller state. The controller builds typed API intents, validates finance permissions from the admin auth store before mutation, and still relies on backend permission middleware and service rules as final authority.
- Fund maintenance changes only fund configuration and never rewrites historical transaction state. Historical transactions keep backend-owned fund allocation and webhook-owned payment state.
- Annual statement generation and download remain backend-owned; Admin Web can request generation/download but does not calculate gross totals or generate trusted statements locally.

Verification:

- `bun run typecheck` from `apps/admin_web`
- `git diff --check`
- `rg "Mutation|\\.mutate\\(|transactionsQuery|statementsQuery|fundsQuery|providerEventsQuery|reconciliationQuery|generateMutation|exportMutation" apps/admin_web/src/features/giving/pages apps/admin_web/src/features/giving/components`

## Batch 59 - Backend Giving Finance

Scope reviewed line by line:

- `backend/package.json` - 37 lines reviewed for target test scripts.
- `backend/src/modules/giving/annual-statement-export.ts` - 124 lines reviewed.
- `backend/src/modules/giving/giving.repository.ts` - 168 lines reviewed.
- `backend/src/modules/giving/giving.service.ts` - 382 lines reviewed.
- `backend/src/modules/giving/giving_calculations.ts` - 153 lines reviewed.
- `backend/src/modules/giving/giving_errors.ts` - 25 lines reviewed.
- `backend/src/modules/giving/in-memory-giving.repository.ts` - 443 lines reviewed.
- `backend/src/modules/giving/in_memory_giving_filters.ts` - 120 lines reviewed.
- `backend/src/modules/giving/in_memory_giving_provider_events.ts` - 97 lines reviewed.
- `backend/src/modules/giving/in_memory_giving_seed_data.ts` - 167 lines reviewed.
- `backend/src/modules/giving/member-giving.routes.ts` - 160 lines reviewed.
- `backend/src/modules/giving/postgres-giving.repository.ts` - 464 lines reviewed after fix.
- `backend/src/modules/giving/postgres_giving_mappers.ts` - 127 lines reviewed.
- `backend/src/modules/giving/postgres_giving_provider_events.ts` - 85 lines reviewed.
- `backend/src/modules/giving/postgres_giving_queries.ts` - 127 lines reviewed.
- `backend/src/modules/giving/postgres_giving_updates.ts` - 32 lines reviewed.
- `backend/src/modules/giving/stripe-giving.provider.ts` - 438 lines reviewed.
- `backend/src/modules/giving/stripe_giving_webhook_handler.ts` - 214 lines reviewed.
- `backend/src/modules/admin/giving/admin-giving.routes.ts` - 348 lines reviewed.
- `backend/src/modules/admin/giving/admin_giving_route_schemas.ts` - 13 lines reviewed.
- `backend/tests/giving.routes.test.ts` - 310 lines reviewed.
- `backend/tests/giving-stripe.routes.test.ts` - 838 lines reviewed.
- `backend/tests/postgres-giving.repository.test.ts` - 37 lines reviewed after addition.
- `backend/tests/stripe-giving.provider.test.ts` - 96 lines reviewed.

Findings fixed:

- `PostgresGivingRepository.summarize()` and `summarizeForUser()` always rewrote status to `succeeded`, so a request filtered to `refunded`, `pending`, or `failed` could list non-succeeded rows while still showing a successful-gift summary. The in-memory repository already treated summaries as succeeded-only and returned zero for non-succeeded status filters. Postgres now matches that behavior.
- Added a repository-level regression using a throwing fake DB to prove non-succeeded summary requests return an empty summary without querying successful gifts.

Logic chain audit:

- Admin transaction list requests still flow through route schema parsing, permission middleware, `GivingService.listTransactions()`, repository list, and repository summary. The service remains orchestration only; summary ownership stays in repositories and shared calculations.
- Member transaction list requests still derive identity from the member token before repository access. `summarizeForUser()` now applies the same non-succeeded summary guard while preserving the user id boundary.
- Stripe checkout, webhook event handling, finance updates, refunds, disputes, payout reconciliation, annual statements, exports, and fund maintenance remain backend-owned. No App Store or Play IAP behavior was introduced.
- Statement generation still counts only confirmed successful gifts and keeps `statement_no_confirmed_gifts` as the feature-layer error when no confirmed gifts exist.

Verification:

- `bun run vitest run tests/postgres-giving.repository.test.ts tests/giving.routes.test.ts tests/giving-stripe.routes.test.ts tests/stripe-giving.provider.test.ts` from `backend`

## Batch 60 - Backend Core/Auth/AI/Public/Members Test Closure

Scope reviewed line by line:

- `backend/tests/admin-rbac.test.ts` - 50 lines reviewed.
- `backend/tests/ai-provider.test.ts` - 152 lines reviewed.
- `backend/tests/ai-rate-limiter.test.ts` - 35 lines reviewed.
- `backend/tests/ai.routes.test.ts` - 287 lines reviewed.
- `backend/tests/ai.service.test.ts` - 90 lines reviewed.
- `backend/tests/app.routes.test.ts` - 708 lines reviewed.
- `backend/tests/bible-knowledge-asset-importer.test.ts` - 111 lines reviewed.
- `backend/tests/bible_knowledge.routes.test.ts` - 197 lines reviewed.
- `backend/tests/bible_verse_notes.routes.test.ts` - 297 lines reviewed.
- `backend/tests/config-env.test.ts` - 237 lines reviewed.
- `backend/tests/contract_assertions.ts` - 24 lines reviewed.
- `backend/tests/member_profiles_settings.routes.test.ts` - 582 lines reviewed.
- `backend/tests/public_landing.routes.test.ts` - 230 lines reviewed.
- `backend/tests/route_test_harness.ts` - 147 lines reviewed.

Findings fixed:

- The audit summary table skipped batches 9-15 even though the detailed batch sections existed. Added the missing summary rows so batch status can be trusted without scanning the entire file.

Logic chain audit:

- Core route tests cover health, admin dashboard/auth/session refresh/logout/password/user management, public settings, member password registration/login/logout, debug member bypass scoping, and push device registration/revocation.
- AI tests cover provider disabled behavior, OpenAI-compatible/Gemini provider failures, timeout/network/error redaction, admin/member rate limiting, and prompt ownership through `AiService`.
- Member settings tests cover admin-controlled registration mode, optional email verification, optional admin approval, direct password login, member profile self-edit, admin member CRUD, setting audit logs, and closed registration errors.
- Public landing tests verify backend settings as the landing resource source of truth, multi-locale output, no sermon-content leakage into Web landing, and invalid landing setting rejection.
- Bible knowledge and verse-note tests cover public/admin knowledge flows, asset import expansion, guest external-user note ownership, moderation hide/restore, and audit redaction.

Verification:

- `bun run vitest run tests/admin-rbac.test.ts tests/ai-provider.test.ts tests/ai-rate-limiter.test.ts tests/ai.routes.test.ts tests/ai.service.test.ts tests/app.routes.test.ts tests/config-env.test.ts tests/member_profiles_settings.routes.test.ts tests/public_landing.routes.test.ts tests/bible-knowledge-asset-importer.test.ts tests/bible_knowledge.routes.test.ts tests/bible_verse_notes.routes.test.ts` from `backend`

## Batch 61 - Public Web Landing Surface

Scope reviewed line by line:

- `docs/agent-workflow/frontend_workflow.md` - 52 lines re-read.
- `docs/surfaces/public_web.md` - 138 lines re-read.
- `apps/public_web/env.d.ts` - 1 line reviewed.
- `apps/public_web/index.html` - 18 lines reviewed.
- `apps/public_web/package.json` - 28 lines reviewed.
- `apps/public_web/src/App.vue` - 122 lines reviewed.
- `apps/public_web/src/components/AppInvitationSection.vue` - 66 lines reviewed.
- `apps/public_web/src/components/ChurchEntranceSection.vue` - 41 lines reviewed.
- `apps/public_web/src/components/ContactFooter.vue` - 49 lines reviewed.
- `apps/public_web/src/components/HeroSection.vue` - 152 lines reviewed.
- `apps/public_web/src/components/MissionSection.vue` - 36 lines reviewed.
- `apps/public_web/src/components/OpeningIntro.vue` - 171 lines reviewed.
- `apps/public_web/src/components/ServiceInfoSection.vue` - 55 lines reviewed after fix.
- `apps/public_web/src/composables/use_landing_content.ts` - 39 lines reviewed.
- `apps/public_web/src/core/actions.ts` - 9 lines reviewed after fix.
- `apps/public_web/src/core/api/client.ts` - 29 lines reviewed.
- `apps/public_web/src/core/locale.ts` - 131 lines reviewed.
- `apps/public_web/src/main.ts` - 7 lines reviewed.
- `apps/public_web/src/plugins/vuetify.ts` - 38 lines reviewed.
- `apps/public_web/src/styles.css` - 1232 lines reviewed.
- `apps/public_web/tsconfig.json` - 16 lines reviewed.
- `apps/public_web/vite.config.ts` - 22 lines reviewed.

Binary/asset checks:

- `apps/public_web/public/mbc_web_logo.png` - PNG image, 134x130 RGBA, SHA-256 `9940c26eb7ab76076bcc163cf2a81ebcc32f194ff16516a5ea31087c2724ec33`.

Findings fixed:

- External actions opened in a new tab without `noopener`. `actionRel()` now returns `noopener noreferrer` for `target="new_tab"`.
- `ServiceInfoSection` used hardcoded Chinese alt text for the service image. The alt text now uses the localized service title returned by the backend landing API.

Logic chain audit:

- Public Web still reads all variable landing resources through `GET /v1/public/landing?locale=...`; it does not fetch sermon/life/giving business content directly.
- Locale selection follows browser language first, persists only the locale preference locally, and keeps visible page content sourced from the backend response.
- Opening intro and Hero share backend identity/logo/hero resources, preserving the no-page-flash animation rule documented for the public surface.
- Landing actions, contact links, app links, map links, and footer links remain backend-provided `PublicLandingAction` objects; the frontend only maps target/rel behavior.

Verification:

- `bun run typecheck` from `apps/public_web`

## Batch 62 - API Contracts Core, Life, Members, Public, Settings, and Route Registry

Scope reviewed line by line:

- `docs/agent-workflow/sdk_workflow.md` - 63 lines re-read.
- `docs/sdk.md` - 88 lines re-read.
- `packages/api_contracts/package.json` - 21 lines reviewed.
- `packages/api_contracts/tsconfig.json` - 9 lines reviewed.
- `packages/api_contracts/src/ai.ts` - 100 lines reviewed.
- `packages/api_contracts/src/audit.ts` - 30 lines reviewed.
- `packages/api_contracts/src/dashboard.ts` - 23 lines reviewed.
- `packages/api_contracts/src/envelope.ts` - 55 lines reviewed.
- `packages/api_contracts/src/health.ts` - 13 lines reviewed.
- `packages/api_contracts/src/index.ts` - 26 lines reviewed.
- `packages/api_contracts/src/life.ts` - 253 lines reviewed.
- `packages/api_contracts/src/members.ts` - 99 lines reviewed.
- `packages/api_contracts/src/public.ts` - 150 lines reviewed.
- `packages/api_contracts/src/route-registry.ts` - 651 lines reviewed.
- `packages/api_contracts/src/settings.ts` - 33 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Public landing contract matches the Public Web surface: backend supplies identity, hero, service, entrance, app, contact, and CTA actions; Public Web only renders and maps link behavior.
- Life contract includes post visibility/status, display weight, read state, registration summary, member/admin registration actions, QR/self check-in, image upload, and CSV export shapes.
- Members contract keeps admin-managed profile data separate from member self-editable fields and notification preference payloads.
- Route registry covers public, member, admin, provider, and diagnostic surfaces with owner, contract file, backend route files, client files, SDK docs, and route strings.

Verification:

- `bun run typecheck` from `packages/api_contracts`
- `bun run check:contracts`

## Batch 63 - Shared Packages and Repository Check Scripts

Scope reviewed line by line:

- `docs/agent-workflow/code_boundaries.md` - 50 lines re-read.
- `docs/agent-workflow/verification.md` - 69 lines re-read.
- `packages/shared_types/package.json` - 17 lines reviewed.
- `packages/shared_types/tsconfig.json` - 4 lines reviewed.
- `packages/shared_types/src/content.ts` - 46 lines reviewed.
- `packages/shared_types/src/index.ts` - 1 line reviewed.
- `packages/ui_tokens/package.json` - 17 lines reviewed.
- `packages/ui_tokens/tsconfig.json` - 4 lines reviewed.
- `packages/ui_tokens/src/index.ts` - 8 lines reviewed.
- `tools/scripts/check_api_contract_coverage.mjs` - 109 lines reviewed.
- `tools/scripts/check_capability_docs.mjs` - 62 lines reviewed.
- `tools/scripts/check_mobile_l10n_placeholders.mjs` - 96 lines reviewed.
- `tools/scripts/check_product_residue.mjs` - 145 lines reviewed.
- `tools/scripts/check_release_readiness.mjs` - 223 lines reviewed.
- `tools/scripts/check_sdk_boundaries.mjs` - 97 lines reviewed.
- `tools/scripts/check_surface_docs.mjs` - 72 lines reviewed.
- `tools/scripts/release/build_prebuilt.sh` - 110 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Shared content types remain the source for content statuses, Life post statuses, visibility, locales, Bible translation ids, admin roles, and admin user statuses.
- UI tokens remain a small design seed package and do not carry business logic.
- Contract, capability, l10n, product-residue, SDK-boundary, surface-doc, readiness, and prebuilt scripts are read-only validation/build helpers except the release script's deliberate staging output generation.
- `build_prebuilt.sh` keeps prebuilt output inside the configured release directory, builds backend/admin/public assets locally, and bundles a minimal Drizzle migration runtime.

Verification:

- `bun run typecheck` from `packages/shared_types`
- `bun run typecheck` from `packages/ui_tokens`
- `bun run check:capabilities`
- `bun run check:sdk-boundaries`
- `bun run check:surfaces`
- `bun run check:mobile-l10n`
- `bun run check:product-residue`
- `bun run release:readiness` (non-strict; reported expected missing local production secrets, Stripe, FCM, and database env)
- `bash -n tools/scripts/release/build_prebuilt.sh`

## Batch 64 - VPS Deployment Manager Script

Scope reviewed line by line:

- `docs/agent-workflow/backend_workflow.md` - 72 lines re-read.
- `docs/vps_deployment.md` - 305 lines re-read.
- `tools/scripts/vps/mbc_walkwith.sh` - 1783 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- The script manages backend API, Admin Web static files, Public Web static files, nginx, PostgreSQL, releases, rollback, logs, SSL, and uninstall.
- `deploy-prebuilt` validates the uploaded tarball path entries, release manifest target/runtime, backend bundle, Drizzle migration runtime, migrations, and both web dist folders before switching `current`.
- Source deploy validates backend env before build/migrate, can run workspace checks, builds web assets with the deployment API/base path, runs Drizzle Kit migrations, switches the release symlink, restarts API, runs health check, and rolls back on failure.
- The VPS script does not manage sermon transcription, outline generation, Scripture extraction, YouTube import, or backend worker services.

Verification:

- `bash -n tools/scripts/vps/mbc_walkwith.sh`
- `bash tools/scripts/vps/mbc_walkwith.sh help`
- `rg "worker|youtube|transcri|whisper|JOB_WORKER|mbcwalkwith-worker" tools/scripts/vps/mbc_walkwith.sh docs/vps_deployment.md`

## Batch 65 - Backend Jobs, Notifications, Newcomer, and Postgres Test Closure

Scope reviewed line by line:

- `backend/tsconfig.json` - 15 lines reviewed.
- `backend/vitest.config.ts` - 8 lines reviewed.
- `backend/tests/job.repository.test.ts` - 97 lines reviewed.
- `backend/tests/job.service.test.ts` - 81 lines reviewed.
- `backend/tests/jobs.routes.test.ts` - 88 lines reviewed.
- `backend/tests/member-notifications.routes.test.ts` - 282 lines reviewed.
- `backend/tests/notification-inbox.service.test.ts` - 114 lines reviewed.
- `backend/tests/notification_retry_scheduler.test.ts` - 61 lines reviewed.
- `backend/tests/notification_admin.routes.test.ts` - 238 lines reviewed.
- `backend/tests/notification.service.test.ts` - 723 lines reviewed.
- `backend/tests/postgres.integration.test.ts` - 53 lines reviewed.
- `backend/tests/newcomer_followup.routes.test.ts` - 160 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Backend test config keeps Vitest on the Node environment with the backend TypeScript project.
- Jobs tests cover in-memory ordering, cursor pagination, service cancellation guards, and admin route authorization.
- Notification tests cover guest and member device ownership, inbox read/archive state, preference updates, privacy-safe prayer push payloads, retryable delivery tasks, admin retry/cancel actions, and provider error normalization.
- Newcomer follow-up tests verify public submission, admin-only follow-up notes, redacted follow-up audit payloads, and redacted public interest audit payloads.
- Postgres integration remains gated by `TEST_DATABASE_URL`, runs Drizzle Kit migrations before the repository smoke path, and cleans up its created sermon record.

Verification:

- `bun run vitest run tests/job.repository.test.ts tests/job.service.test.ts tests/jobs.routes.test.ts tests/member-notifications.routes.test.ts tests/notification-inbox.service.test.ts tests/notification.service.test.ts tests/notification_admin.routes.test.ts tests/notification_retry_scheduler.test.ts tests/newcomer_followup.routes.test.ts tests/postgres.integration.test.ts` from `backend` (9 files passed, 1 env-gated Postgres file skipped without `TEST_DATABASE_URL`).

## Batch 66 - Backend Life, Prayer, Sermon Media, Event Registration, and Statement Test Closure

Scope reviewed line by line:

- `backend/tests/.gitkeep` - 1 empty placeholder line reviewed.
- `backend/tests/annual-statement-export.test.ts` - 64 lines reviewed.
- `backend/tests/event_registration.routes.test.ts` - 820 lines reviewed.
- `backend/tests/life-post-image-storage.service.test.ts` - 97 lines reviewed.
- `backend/tests/life_posts.routes.test.ts` - 592 lines reviewed.
- `backend/tests/prayer.routes.test.ts` - 552 lines reviewed.
- `backend/tests/sermon-audio-storage.service.test.ts` - 102 lines reviewed.
- `backend/tests/sermon.repository.test.ts` - 126 lines reviewed.
- `backend/tests/sermon_admin.routes.test.ts` - 525 lines reviewed.
- `backend/tests/sermon_media.routes.test.ts` - 442 lines reviewed.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Annual statement export tests verify CSV fields and minimal PDF content generated from donation records.
- Event registration tests cover member registration, duplicate registration, member update/cancel, admin list/export/edit/create, manual check-in, QR/short-code check-in, capacity conflicts, closed registration, hidden event access, and event registration audit actions.
- Life post tests cover image upload/read/missing-image errors, schedule validation, review/publish/unpublish/archive/delete, public/member visibility, display weight ordering, date-range filtering, backend-owned read state, and notification audit summaries.
- Prayer tests cover privacy-safe push notification delivery, moderation, group/member/public visibility, redacted moderation audit payloads, guest-friendly submission, member-owned request listing, and unauthenticated member route rejection.
- Sermon media tests cover church-uploaded manuscripts, audio upload/delete, public audio range streaming, local package import instead of server transcription jobs, review workflow transitions, publish readiness, editor permission denial, and public detail exposure only after publish.

Verification:

- `bun run vitest run tests/annual-statement-export.test.ts tests/event_registration.routes.test.ts tests/life-post-image-storage.service.test.ts tests/life_posts.routes.test.ts tests/prayer.routes.test.ts tests/sermon-audio-storage.service.test.ts tests/sermon.repository.test.ts tests/sermon_admin.routes.test.ts tests/sermon_media.routes.test.ts` from `backend` (9 files passed, 31 tests passed).

## Batch 67 - Backend Admin Routes, Placeholders, and Drizzle Snapshot Metadata

Scope reviewed line by line:

- `backend/src/modules/admin/audit/admin-audit.routes.ts` - 30 lines reviewed.
- `backend/src/modules/admin/dashboard/admin-dashboard.routes.ts` - 100 lines reviewed.
- `backend/src/modules/admin/settings/admin-settings.routes.ts` - 65 lines reviewed.
- `backend/migrations/.gitkeep` - 1 empty placeholder line reviewed.
- `backend/scripts/.gitkeep` - 1 empty placeholder line reviewed.
- `backend/src/.gitkeep` - 1 empty placeholder line reviewed.
- `packages/api_contracts/.gitkeep` - 1 empty placeholder line reviewed.
- `packages/shared_types/.gitkeep` - 1 empty placeholder line reviewed.
- `packages/ui_tokens/.gitkeep` - 1 empty placeholder line reviewed.
- `tools/scripts/.gitkeep` - 1 empty placeholder line reviewed.
- `infra/.gitkeep` - 1 empty placeholder line reviewed.
- `apps/user_web/.gitkeep` - 1 empty placeholder line reviewed.

Generated text structurally validated:

- `backend/migrations/meta/0031_snapshot.json` - 4832 generated lines, 35 tables, SHA-256 `5062245d4f637399e7d51610879bd7e220a400a85412532da7a75ad0514d8944`.
- `backend/migrations/meta/0032_snapshot.json` - 5216 generated lines, 37 tables, SHA-256 `5d15c1de00e8f841f7a94e69cfd96b80d758a90a1239c50674f211c78cc6bead`.
- `backend/migrations/meta/0033_snapshot.json` - 5273 generated lines, 37 tables, SHA-256 `f39d39044211f4857f9257e6038bac0c4708ee08a29edddef5d9327ef889d1c8`.
- `backend/migrations/meta/0034_snapshot.json` - 5289 generated lines, 37 tables, SHA-256 `151870e3522080925700c83b3e9b2d0cae4844043ca95e1d48e38f7bf63d44b8`.
- `backend/migrations/meta/0035_snapshot.json` - 5374 generated lines, 38 tables, SHA-256 `3b6c9da2242ffead65a4ac474acb31eb39e36f8567334a4cff83d880ed627a81`.
- `backend/migrations/meta/0036_snapshot.json` - 5410 generated lines, 38 tables, SHA-256 `f0b0b63ac786a93d8be1eefd43333f32c881ac3b0219386ba0005fd550657b24`.
- `backend/migrations/meta/0037_snapshot.json` - 5441 generated lines, 38 tables, SHA-256 `05d9681c5bdad9ecea796b90c8ee3857e96b82b0a17f6f1e4b3b95082d4469e3`.
- `backend/migrations/meta/0038_snapshot.json` - 5441 generated lines, 38 tables, SHA-256 `21c9488254a9b71f8e8aef024c0ff7904b1ee75d00045fb254525140dc27f26a`.
- `backend/migrations/meta/0039_snapshot.json` - 5656 generated lines, 39 tables, SHA-256 `5a053fa843919605e0f03e04327a0ad415d81d9b9526f75a2e986405d2b67dbc`.
- `backend/migrations/meta/0040_snapshot.json` - 5978 generated lines, 41 tables, SHA-256 `7a97f8b77b1170d425c043e1f6fe3ed9b55e875ecb937ca89494922ed5c80be2`.
- `backend/migrations/meta/0041_snapshot.json` - 6596 generated lines, 46 tables, SHA-256 `76c0590d05fc65f47d02ef8a77cc887634860d1466ba486bcd71efb268e653d2`.
- `backend/migrations/meta/0042_snapshot.json` - 7105 generated lines, 50 tables, SHA-256 `e63f20e66f6ef7ac7bebe32ddada908818b2999811b76612ffaba277c352f07a`.
- `backend/migrations/meta/0043_snapshot.json` - 7415 generated lines, 52 tables, SHA-256 `c6ba447822b43c7319109dc7becbdcfc5865e7506309154bc77ef67d505e0391`.
- `backend/migrations/meta/0044_snapshot.json` - 7703 generated lines, 54 tables, SHA-256 `24fd4419e9bf59f422a1da5efe55cdcb1869b8c1591f6b4fc0c931c4291b461b`.
- `backend/migrations/meta/0045_snapshot.json` - 7931 generated lines, 56 tables, SHA-256 `950cb16d80f5e34186fab56e7158aa0305ab08535b608f0451be36e6b31b819a`.
- `backend/migrations/meta/0046_snapshot.json` - 8104 generated lines, 57 tables, SHA-256 `2e1c078fbcd58466c22db231fd3d43459bc6cf02b72a4bdd21fabf9662a9633d`.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Admin audit, dashboard, and settings routes remain permission-gated at the route boundary and delegate query/update logic to services.
- Settings updates still check existence before and after update and write an audit record with the old and new setting values.
- Dashboard route only aggregates existing service summaries and does not own domain rules.
- Drizzle snapshots 0031-0046 are generated metadata; they were parsed as JSON, checked for version `7`, dialect `postgresql`, required ids, table objects, and a continuous `prevId` chain.

Verification:

- Node structural parser for `backend/migrations/meta/0031_snapshot.json` through `backend/migrations/meta/0046_snapshot.json`.
- `shasum -a 256 backend/migrations/meta/0031_snapshot.json ... backend/migrations/meta/0046_snapshot.json`.
- `bun run db:check` from `backend`.
- `bun run typecheck` from `backend`.

## Batch 68 - Mobile Android Platform, App Metadata, and Launcher Assets

Scope reviewed line by line:

- `apps/mobile/.metadata` - 33 lines reviewed.
- `apps/mobile/analysis_options.yaml` - 32 lines reviewed.
- `apps/mobile/l10n.yaml` - 4 lines reviewed.
- `apps/mobile/android/.gitignore` - 14 lines reviewed.
- `apps/mobile/android/app/build.gradle.kts` - 45 lines reviewed.
- `apps/mobile/android/app/src/debug/AndroidManifest.xml` - 7 lines reviewed.
- `apps/mobile/android/app/src/main/AndroidManifest.xml` - 72 lines reviewed.
- `apps/mobile/android/app/src/main/kotlin/org/mbcglendora/walkwith/MainActivity.kt` - 5 lines reviewed.
- `apps/mobile/android/app/src/main/res/drawable-v21/launch_background.xml` - 12 lines reviewed.
- `apps/mobile/android/app/src/main/res/drawable/launch_background.xml` - 12 lines reviewed.
- `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` - 6 lines reviewed.
- `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` - 6 lines reviewed.
- `apps/mobile/android/app/src/main/res/values-night/styles.xml` - 18 lines reviewed.
- `apps/mobile/android/app/src/main/res/values/colors.xml` - 4 lines reviewed.
- `apps/mobile/android/app/src/main/res/values/styles.xml` - 18 lines reviewed.
- `apps/mobile/android/app/src/profile/AndroidManifest.xml` - 7 lines reviewed.
- `apps/mobile/android/build.gradle.kts` - 24 lines reviewed.
- `apps/mobile/android/gradle.properties` - 6 lines reviewed.
- `apps/mobile/android/gradle/wrapper/gradle-wrapper.properties` - 5 lines reviewed.
- `apps/mobile/android/settings.gradle.kts` - 26 lines reviewed.

Binary resources structurally validated:

- `apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png` and `ic_launcher_round.png` - 48 x 48 PNG, SHA-256 `a21d3673b60f77203ddd0af821b83e762ccef63c95c69e189911bc5bfad8a3b0`.
- `apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png` and `ic_launcher_round.png` - 72 x 72 PNG, SHA-256 `2813a2f4a0288de8a8c02a1ec8f2c39756287776917a1f1be3f803af44adf527`.
- `apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` and `ic_launcher_round.png` - 96 x 96 PNG, SHA-256 `e2c7903de82015a480dc0213ed4de8a75ef4c5349b5e2c69d61e2960dd6490ca`.
- `apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` and `ic_launcher_round.png` - 144 x 144 PNG, SHA-256 `1c62be6f0ae4bf369750e90142219c5cd01ae6e9bc12378b70504e265dcbbb32`.
- `apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` and `ic_launcher_round.png` - 192 x 192 PNG, SHA-256 `241960bc9a095ff6beb78abf088553fa81b7a60a33be08ad1ae0d1e16d2e6450`.
- `apps/mobile/android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png` and `ic_launcher_monochrome.png` - 108 x 108 PNG, SHA-256 `5e90013b1b985517882d406595872de7b838a84c7f29940d5d10f6b41a1bc5fa`.
- `apps/mobile/android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png` and `ic_launcher_monochrome.png` - 162 x 162 PNG, SHA-256 `4117ad695f15825b4343fc0f9dc3b6be86fb69384148b1597e5e28152ab6ef31`.
- `apps/mobile/android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png` and `ic_launcher_monochrome.png` - 216 x 216 PNG, SHA-256 `1b03c57481a4505cf811568137df5d6b925c5f5b63281b4d0780ab2c15bf14ca`.
- `apps/mobile/android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png` and `ic_launcher_monochrome.png` - 324 x 324 PNG, SHA-256 `6b637af8978cce9c9900eab0159525d9b33cdd532a7e885b2c794a2513050d43`.
- `apps/mobile/android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png` and `ic_launcher_monochrome.png` - 432 x 432 PNG, SHA-256 `cf9e52e13c8aff8ed679d339da0c42d6208e532ddbb3c6bbb849d06fba3171e8`.

Findings:

- No source changes were required in this batch.

Logic chain audit:

- Android app identity uses package `org.mbcglendora.walkwith`, app label `MBCG`, and adaptive icon resources with foreground, background, and monochrome layers.
- `MainActivity` extends `AudioServiceActivity`, preserving native media-session integration for sermon playback.
- Notification, camera, wake lock, foreground service, and media playback foreground service permissions align with App features already implemented.
- Debug/profile manifests only add development Internet permission.

Deferred risk:

- `android:usesCleartextTraffic="true"` remains in the main manifest to support current HTTP IP-based VPS testing. This should be tightened before a formal HTTPS/domain production release.

Verification:

- `find apps/mobile/android/app/src/main/res -name '*.png' -type f -exec file {} +`.
- `find apps/mobile/android/app/src/main/res -name '*.png' -type f -exec shasum -a 256 {} +`.
- `flutter analyze` from `apps/mobile` (passed; reported the known `flutter_tts` iOS Swift Package Manager warning).

## Batch 69 - Mobile iOS Platform, Bundle Identity, and App Assets

Scope reviewed line by line:

- `apps/mobile/ios/.gitignore` - 34 lines reviewed.
- `apps/mobile/ios/Flutter/AppFrameworkInfo.plist` - 24 lines reviewed.
- `apps/mobile/ios/Flutter/Debug.xcconfig` - 2 lines reviewed.
- `apps/mobile/ios/Flutter/Release.xcconfig` - 2 lines reviewed.
- `apps/mobile/ios/Podfile` - 43 lines reviewed.
- `apps/mobile/ios/Runner.xcodeproj/project.pbxproj` - 647 lines reviewed before fix, then changed bundle identifier lines re-reviewed.
- `apps/mobile/ios/Runner.xcodeproj/project.xcworkspace/contents.xcworkspacedata` - 7 lines reviewed.
- `apps/mobile/ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist` - 8 lines reviewed.
- `apps/mobile/ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings` - 8 lines reviewed.
- `apps/mobile/ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` - 122 lines reviewed.
- `apps/mobile/ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme` - 119 lines reviewed.
- `apps/mobile/ios/Runner.xcworkspace/contents.xcworkspacedata` - 7 lines reviewed.
- `apps/mobile/ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist` - 8 lines reviewed.
- `apps/mobile/ios/Runner.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings` - 8 lines reviewed.
- `apps/mobile/ios/Runner.xcworkspace/xcshareddata/swiftpm/Package.resolved` - 122 lines reviewed.
- `apps/mobile/ios/Runner/AppDelegate.swift` - 16 lines reviewed.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json` - 122 lines reviewed.
- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json` - 23 lines reviewed.
- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/README.md` - 4 lines reviewed.
- `apps/mobile/ios/Runner/Base.lproj/LaunchScreen.storyboard` - 37 lines reviewed.
- `apps/mobile/ios/Runner/Base.lproj/Main.storyboard` - 26 lines reviewed.
- `apps/mobile/ios/Runner/Info.plist` - 84 lines reviewed.
- `apps/mobile/ios/Runner/Runner-Bridging-Header.h` - 1 line reviewed.
- `apps/mobile/ios/Runner/SceneDelegate.swift` - 6 lines reviewed.
- `apps/mobile/ios/RunnerTests/RunnerTests.swift` - 12 lines reviewed.

Binary resources structurally validated:

- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png`, `LaunchImage@2x.png`, and `LaunchImage@3x.png` - 1 x 1 PNG, SHA-256 `93ae7d494fad0fb30cbf3ae746a39c4bc7a0f8bbf87fbb587a3f3c01f3c5ce20`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png` - 20 x 20 PNG, SHA-256 `97811b28a70a17eeeca419cddbf0c73067ce932c5b9e16f3cbab180b4a5bab2a`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png` - 40 x 40 PNG, SHA-256 `c7ca84581b3c69e5f9bb410cc6530bd39165e2a19bb481ff5ad8f997a67d3db7`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png` - 60 x 60 PNG, SHA-256 `ef816e816b5a62556e8ebd73d9ed7fe83a98b48f65f3dfac5a57f1e9ba4e670d`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png` - 29 x 29 PNG, SHA-256 `0487dc91ccaf184e67da095451544026cadcb9b29721b16163e48b9dae496b21`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png` - 58 x 58 PNG, SHA-256 `643154955c86751913ad6cd7d1bf181a6fabaf6dd5f637bc237876a52afe485d`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png` - 87 x 87 PNG, SHA-256 `35b99c6b0778231f5797eb1f4d658fa54833668c809553d8f24e5ce6247f9056`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png` - 40 x 40 PNG, SHA-256 `c7ca84581b3c69e5f9bb410cc6530bd39165e2a19bb481ff5ad8f997a67d3db7`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png` - 80 x 80 PNG, SHA-256 `975b05a07edead36c43e556f56eead7679ca23df1007549ab011edb1fae77b61`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png` - 120 x 120 PNG, SHA-256 `589fbf7e2b03d7eb6870c66d01fcc05f2ef0c09766edc2cabbacf8b8efcbae92`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png` - 120 x 120 PNG, SHA-256 `589fbf7e2b03d7eb6870c66d01fcc05f2ef0c09766edc2cabbacf8b8efcbae92`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png` - 180 x 180 PNG, SHA-256 `d77691d25f3c8f7bef49087086d03480bb6d2a2f7a504afb80cfce4312bc1898`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png` - 76 x 76 PNG, SHA-256 `6ff52493811d121b60beaef59855151e1b9d13d49a35993f3759b80dbc1ec598`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png` - 152 x 152 PNG, SHA-256 `4b54b4fde2c017b66ba8f11a4537a36e89694a4d1ad6a362f455a76a99b082c0`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png` - 167 x 167 PNG, SHA-256 `be661c512b723af40891ff4a66adc4b1a788f3ac294d2de5420ec0830d1795a4`.
- `apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png` - 1024 x 1024 PNG, SHA-256 `15669dc980944720c3445461679b0aafc521394ec5e6a0462d2d475cfb8adf61`.

Findings fixed:

- Replaced the default iOS bundle identifiers `com.example.mbcWalkwith` and `com.example.mbcWalkwith.RunnerTests` with `org.mbcglendora.walkwith` and `org.mbcglendora.walkwith.RunnerTests`, aligning iOS identity with the Android package and church product name.

Logic chain audit:

- iOS display name is `MBCG`, and the bundle id now uses the same organization namespace as Android.
- `Info.plist` declares English, Spanish, Simplified Chinese, and Traditional Chinese localizations, camera usage for event QR scanning, background audio for sermon playback, and remote notifications for push delivery.
- `AppDelegate` registers plugins through `FlutterImplicitEngineDelegate`; `SceneDelegate` uses `FlutterSceneDelegate`.
- SPM package pins are generated Firebase/Google dependency locks and were reviewed as lock metadata.

Verification:

- `find apps/mobile/ios/Runner/Assets.xcassets -name '*.png' -type f -exec file {} +`.
- `find apps/mobile/ios/Runner/Assets.xcassets -name '*.png' -type f -exec shasum -a 256 {} +`.
- `plutil -lint` for iOS plist files.
- `plutil -lint apps/mobile/ios/Runner.xcodeproj/project.pbxproj`.
- `xmllint --noout` for the iOS scheme, storyboards, and workspace XML files.
- `flutter analyze` from `apps/mobile` (passed; reported the known `flutter_tts` iOS Swift Package Manager warning).

Verification note:

- `xcodebuild -list` was attempted but blocked by the local sandbox's CoreSimulator, Swift module cache, and SourcePackages write restrictions. It is not counted as a passing verification in this batch.

## Batch 70 - Mobile Firebase Stub and Localization Sources

Scope reviewed line by line:

- `apps/mobile/lib/firebase_options.dart` - 21 lines reviewed.
- `apps/mobile/lib/l10n/app_zh.arb` - 832 lines reviewed before fix, then changed annual-proof lines re-reviewed.
- `apps/mobile/lib/l10n/app_zh_Hans.arb` - 832 lines reviewed before fix, then changed annual-proof lines re-reviewed.
- `apps/mobile/lib/l10n/app_zh_Hant.arb` - 832 lines reviewed before fix, then changed annual-proof lines re-reviewed.
- `apps/mobile/lib/l10n/app_en.arb` - 832 lines reviewed.
- `apps/mobile/lib/l10n/app_es.arb` - 832 lines reviewed.

Generated text structurally validated:

- `apps/mobile/lib/l10n/app_localizations.dart` - 3236 generated lines validated after `flutter gen-l10n`.
- `apps/mobile/lib/l10n/app_localizations_en.dart` - 1784 generated lines validated after `flutter gen-l10n`.
- `apps/mobile/lib/l10n/app_localizations_es.dart` - 1777 generated lines validated after `flutter gen-l10n`.
- `apps/mobile/lib/l10n/app_localizations_zh.dart` - 4910 generated lines validated after `flutter gen-l10n`.

Findings fixed:

- Chinese localization used both `年度证明/年度證明` and `年度报表/年度報表` for the same giving annual statement feature. Standardized Simplified, Traditional, and base Chinese strings to `年度证明/年度證明`, including CSV/PDF/share/export messages.

Logic chain audit:

- Firebase options are intentionally a throwing placeholder until real `flutterfire configure` values are committed; this gives the App a clear setup failure instead of silently using fake credentials.
- ARB source files cover Simplified Chinese, Traditional Chinese, English, and Spanish, with base Chinese as the template locale.
- Language switching remains system-driven; App strings cover Bible reader, TTS, sermons, Life, event registration/check-in, giving, annual proof export/share, prayer, care, newcomer, notifications, and discipleship surfaces.
- Generated localization Dart is owned by Flutter gen-l10n and was regenerated from the ARB sources.

Verification:

- `flutter gen-l10n` from `apps/mobile`.
- Node ARB key parity check: 513 messages across 5 locales.
- `bun run check:mobile-l10n`.
- `rg "年度报表|年度報表|报表|報表" apps/mobile/lib/l10n/app_zh.arb apps/mobile/lib/l10n/app_zh_Hans.arb apps/mobile/lib/l10n/app_zh_Hant.arb` returned no matches.
- `flutter analyze` from `apps/mobile` (passed; reported the known `flutter_tts` iOS Swift Package Manager warning).

## Batch 71 - Mobile Bible Resource Assets and Normalizer

Scope reviewed line by line:

- `packages/bible_content/tools/normalize_web_usfm.dart` - 1217 lines reviewed.
- `apps/mobile/lib/features/study/data/bible_people_repository.dart` - 279 lines reviewed to confirm local knowledge fallback contracts.
- `apps/mobile/lib/features/study/data/bible_places_repository.dart` - 273 lines reviewed to confirm local knowledge fallback contracts.
- `apps/mobile/lib/features/study/domain/bible_person.dart` - 35 lines reviewed.
- `apps/mobile/lib/features/study/domain/bible_place.dart` - 33 lines reviewed.
- `apps/mobile/test/bible_knowledge_repository_test.dart` - 133 lines reviewed for remote/local knowledge behavior.

Resource and generated artifact validation:

- `apps/mobile/assets/bible/cuvs/books.json` - 1256 lines parsed, 66 books, SHA-256 `3f6a6129a07acbcdd4d1dfc5c803a3c8725ec6cde03fbc0def713e281b689da7`.
- `apps/mobile/assets/bible/cuvs/verses.jsonl` - 31021 JSONL lines parsed, 0 empty verses, `gen.1.1` to `rev.22.21`, SHA-256 `ea780e73d3005531078c7a17744fe3f65b9656d3d306b886c7818025df0c8688`.
- `apps/mobile/assets/bible/cuvt/books.json` - 1256 lines parsed, 66 books, SHA-256 `f4f23f9e27aebc04b0afe3f0595b2e70df55375297cb51759a9a475bb966b010`.
- `apps/mobile/assets/bible/cuvt/verses.jsonl` - 31021 JSONL lines parsed, 0 empty verses, `gen.1.1` to `rev.22.21`, SHA-256 `47e2ece32936983cf2f49ce6d3e4190a19f29cb55ff388396c1a3e9c3d721d15`.
- `apps/mobile/assets/bible/web/books.json` - 1256 lines parsed, 66 books, SHA-256 `6f2079839793166dc89a12980044fbd791b0bea7a736e3cd24f951c65c9c7d86`.
- `apps/mobile/assets/bible/web/verses.jsonl` - 31103 JSONL lines parsed, 5 empty verses, `gen.1.1` to `rev.22.21`, SHA-256 `ac58ae15d38903bcab0eeb1f298197733e1b8d1f099500e261320043404bbcd7`.
- `packages/bible_content/sources/*/normalized/books.json` and `verses.jsonl` were byte-compared against the matching app bundled assets; all matched.
- `apps/mobile/assets/bible_knowledge/people.json` - 2054 lines parsed, 91 people, 166 related-verse refs, 64 verse-alias refs, SHA-256 `dcc4f531a01b6270bd5acdd6e2ad1353f27350f3df2b458d6dbbb8c7ca9eb34d`.
- `apps/mobile/assets/bible_knowledge/places.json` - 516 lines parsed, 16 places, SHA-256 `8fc51aa0bf78a3f62efccb91f905452a67a41511dff35ffac0aefb4b6ecd47d2`.
- `apps/mobile/assets/sermons/default_sermon_artwork.png` - PNG 512x512 RGB, SHA-256 `7b3d7f19a30a19bcff11c96804d700dfcc8f34c1b27a3efb02198faa7595a6c0`.

Findings fixed:

- USFM non-verse marker lines were appended to the active verse when they appeared after a verse marker. This leaked section headings such as CUVS/CUVT narrative titles, WEB Psalm 119 acrostic labels, and WEB Song speaker labels into verse text. Added non-verse heading/metadata marker skipping before continuation text is appended.
- Regenerated normalized Bible resources and synced them into the mobile app assets. The diff preserved all verse ids, order, counts, and non-text fields; only verse text was shortened where headings had been removed.
- `apps/mobile/assets/bible/web/books.json` was stale relative to the normalized source and missed local name/title/abbreviation fields. Synced it from the normalized source so the app bundle and source artifact match.
- `apps/mobile/assets/bible_knowledge/people.json` used `mak.*` for four Mark references. Corrected them to canonical `mrk.*`.

Logic chain audit:

- `normalize_web_usfm.dart` owns extraction from zipped USFM source archives into normalized `books.json`, `chapters.jsonl`, `verses.jsonl`, and mapping/index files.
- The mobile app consumes the bundled `apps/mobile/assets/bible/*` files through the local Bible seed importer and catalog/repository chain; app assets must match normalized package outputs byte for byte.
- Bible knowledge assets are local fallback data for person/place lookup and may omit `summary*` and `sections`; repositories intentionally fall back to localized descriptions and generated Overview/简介 sections.
- Related verse ids and verse alias keys must use canonical dot-style ids such as `mrk.5.22`, matching the local Bible verse ids.

Verification:

- `dart run packages/bible_content/tools/normalize_web_usfm.dart` regenerated `web`, `cuvs`, and `cuvt` normalized Bible resources.
- Node resource validator parsed every bundled and normalized Bible JSONL line, checked book fields, version ids, verse ids, duplicate ids, `isEmpty` consistency, knowledge references, SHA-256 hashes, and app/source byte equality.
- HEAD/current resource diff validator confirmed Bible verse line counts and all non-text fields stayed unchanged; changed text rows were shorten-only heading cleanup rows: 1605 CUVS, 1605 CUVT, and 48 WEB rows per app/source copy.
- `rg "警戒增减|警戒增減|mak\\." apps/mobile/assets/bible apps/mobile/assets/bible_knowledge packages/bible_content/sources -g "*.json" -g "*.jsonl"` returned no matches.
- `flutter test test/bible_seed_importer_real_assets_test.dart test/bible_seed_importer_test.dart test/bible_book_display_test.dart test/bible_person_matcher_test.dart test/bible_place_matcher_test.dart test/bible_knowledge_repository_test.dart` from `apps/mobile` passed.
- `flutter analyze` from `apps/mobile` passed with the known `flutter_tts` iOS Swift Package Manager warning.

## Batch 72 - Local Sermon Studio Tool

Scope reviewed line by line:

- `apps/sermon_studio/.gitignore` - 4 lines reviewed.
- `apps/sermon_studio/README.md` - 95 lines reviewed.
- `apps/sermon_studio/config.example.yaml` - 29 lines reviewed.
- `apps/sermon_studio/config.fedora44.example.yaml` - 31 lines reviewed.
- `apps/sermon_studio/pyproject.toml` - 32 lines reviewed.
- `apps/sermon_studio/docs/fedora44_workstation.md` - 163 lines reviewed.
- `apps/sermon_studio/sermon_studio/__init__.py` - 5 lines reviewed.
- `apps/sermon_studio/sermon_studio/__main__.py` - 5 lines reviewed.
- `apps/sermon_studio/sermon_studio/audio.py` - 96 lines reviewed.
- `apps/sermon_studio/sermon_studio/cli.py` - 86 lines reviewed.
- `apps/sermon_studio/sermon_studio/config.py` - 77 lines reviewed.
- `apps/sermon_studio/sermon_studio/diagnostics.py` - 74 lines reviewed.
- `apps/sermon_studio/sermon_studio/downloader.py` - 13 lines reviewed.
- `apps/sermon_studio/sermon_studio/gui.py` - 159 lines reviewed.
- `apps/sermon_studio/sermon_studio/main.py` - 24 lines reviewed.
- `apps/sermon_studio/sermon_studio/markdown_writer.py` - 51 lines reviewed.
- `apps/sermon_studio/sermon_studio/models.py` - 204 lines reviewed.
- `apps/sermon_studio/sermon_studio/pipeline.py` - 212 lines reviewed.
- `apps/sermon_studio/sermon_studio/project_store.py` - 82 lines reviewed.
- `apps/sermon_studio/sermon_studio/scripture_refs.py` - 106 lines reviewed.
- `apps/sermon_studio/sermon_studio/summarizer.py` - 203 lines reviewed.
- `apps/sermon_studio/sermon_studio/transcriber.py` - 57 lines reviewed.
- `apps/sermon_studio/sermon_studio/uploader.py` - 110 lines reviewed.
- `apps/sermon_studio/tests/test_markdown_writer.py` - 46 lines reviewed.
- `apps/sermon_studio/tests/test_models.py` - 78 lines reviewed.
- `apps/sermon_studio/tests/test_pipeline.py` - 25 lines reviewed.
- `apps/sermon_studio/tests/test_project_store.py` - 24 lines reviewed.
- `apps/sermon_studio/tests/test_scripture_refs.py` - 24 lines reviewed.

Findings fixed:

- `README.md` linked `docs/local_sermon_processing.md` and `docs/api.md` as if they were inside `apps/sermon_studio/docs`. Updated them to repo-relative `../../docs/...` links while keeping the local Fedora guide link local.
- `sanitize_references()` accepted any shape-valid book id, so `mak.5.22` or `mark.5.22` could pass local AI summary cleanup even though the app/backend Bible ids use canonical `mrk`. Added a 66-book canonical id allowlist and regression coverage.
- `upload_project()` selected the first non-`normalized.wav` file in `source/`, which could upload a stale or accidental file when multiple source files existed. Upload now resolves the original audio file from `manifest.audio.fileName` through `project_store.resolve_original_audio_path()`.

Logic chain audit:

- Sermon Studio remains a local-only processing tool. It normalizes audio, transcribes locally with `faster-whisper`, summarizes with Ollama/OpenAI/Gemini-compatible providers, writes a review package, and uploads reviewed assets to the backend.
- The backend remains the source of truth for sermon metadata, transcript, outline, references, review markdown, audio storage, review workflow, publish state, audit, and app distribution.
- `submit_for_review` is read from config at upload time and overrides the manifest package default before the backend request is sent.
- GUI actions stay thin wrappers over the same process/upload functions and do not own separate sermon business rules.

Verification:

- `python3 -m unittest discover -s tests` from `apps/sermon_studio` passed.
- `env PYTHONPYCACHEPREFIX=/private/tmp/mbc_sermon_studio_pycache python3 -m compileall sermon_studio tests` from `apps/sermon_studio` passed.
- A plain `python3 -m compileall sermon_studio tests` attempted to write to macOS Python's user cache and was blocked by the sandbox; the rerun with `PYTHONPYCACHEPREFIX` is the counted compile verification.

## Batch 73 - Bible Content Source Package Metadata

Scope reviewed line by line:

- `packages/bible_content/README.md` - 145 lines reviewed.
- `packages/bible_content/sources/web/metadata.json` - 32 lines reviewed.
- `packages/bible_content/sources/cuvs/metadata.json` - 30 lines reviewed after adding it.
- `packages/bible_content/sources/cuvt/metadata.json` - 30 lines reviewed after adding it.
- `packages/bible_content/sources/web/licenses/license.md` - 18 lines reviewed.
- `packages/bible_content/sources/web/licenses/copyright.html` - 44 lines reviewed.
- `packages/bible_content/sources/cuvs/licenses/copyright.html` - 42 lines reviewed.
- `packages/bible_content/sources/cuvt/licenses/copyright.html` - 42 lines reviewed.

Generated and binary artifact validation:

- `packages/bible_content/sources/web/raw/engwebp_usfm.zip` - ZIP archive validated with 72 entries, SHA-256 `2c77e11f0d26863f7f4a507b40c58651d55399e6d760223b3550908331bc994f`.
- `packages/bible_content/sources/cuvs/raw/cmn-cu89s_usfm.zip` - ZIP archive validated with 70 entries, SHA-256 `56f8c5a0fd8b170ec4f668ef64735599c0ab9f3f16df9a4a65c8bb2fb1ee9e40`.
- `packages/bible_content/sources/cuvt/raw/cmn-cu89t_usfm.zip` - ZIP archive validated with 70 entries, SHA-256 `4757c8e7abbc78c8bc37e888b0e1faedc8d3f52f89a64be14a9b73445a27b268`.
- `packages/bible_content/sources/*/normalized/index.json` - parsed and matched expected source ids, output names, and counts.
- `packages/bible_content/sources/*/normalized/book_mappings.json` - parsed 66 mappings per version with known book ids, version ids, canonical order, and aliases.
- `packages/bible_content/sources/*/normalized/chapters.jsonl` - parsed 1189 JSONL chapter rows per version with canonical chapter ids and positive verse counts.
- `packages/bible_content/sources/web/normalized/verses.jsonl` empty marker list matched README exactly: `luk.17.36`, `act.8.37`, `act.15.34`, `act.24.7`, and `rom.16.25`.

Findings fixed:

- The package README required source URL, date, and checksum in each version's `metadata.json`, but CUVS/CUVT had no metadata files. Added metadata for both Chinese versions using local source archive hashes, archive entry counts, copyright URLs, download URLs, and source-file date evidence from the archived copyright pages.
- The README layout omitted `metadata.json` under CUVS/CUVT. Updated the layout so the documented package shape matches the repository.

Logic chain audit:

- Raw source archives remain immutable inputs under `sources/<version>/raw/`.
- Copyright/license evidence remains local under `sources/<version>/licenses/`.
- Normalized artifacts remain generated outputs from `normalize_web_usfm.dart`; source text itself is not manually edited.
- CUVS/CUVT metadata now provides the same traceability class as WEB for future source updates.

Verification:

- `shasum -a 256` for all three raw archives matched metadata.
- `unzip -l` / `unzip -Z -1` confirmed expected archive entry counts and expected USFM file naming.
- Node package validator checked metadata, raw archive hashes, archive file counts, index counts, book mappings, chapter JSONL rows, and WEB empty verse markers.
- `git diff --check`.

## Batch 74 - Mobile Root Config and Placeholder Files

Scope reviewed line by line:

- `apps/mobile/.metadata` - 33 lines reviewed.
- `apps/mobile/analysis_options.yaml` - 32 lines reviewed.
- `apps/mobile/l10n.yaml` - 4 lines reviewed.

Placeholder artifact validation:

- `apps/admin_web/.gitkeep`
- `apps/user_web/.gitkeep`
- `backend/migrations/.gitkeep`
- `backend/scripts/.gitkeep`
- `backend/src/.gitkeep`
- `backend/tests/.gitkeep`
- `infra/.gitkeep`
- `packages/api_contracts/.gitkeep`
- `packages/shared_types/.gitkeep`
- `packages/ui_tokens/.gitkeep`
- `tools/scripts/.gitkeep`

Each placeholder file is 1 byte and has SHA-256
`01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b`.
`od -An -tx1 apps/admin_web/.gitkeep` confirmed the shared byte content is
`0a`, a newline-only placeholder.

Findings:

- No defects found in this batch.

Logic chain audit:

- Flutter metadata stays generated Flutter project metadata and does not own app behavior.
- Analyzer config remains limited to Flutter lints plus `build/**` exclusion.
- Localization generation still points to `lib/l10n/app_zh.arb` and the generated `AppLocalizations` class.
- Placeholder files contain no hidden business rules, secrets, or deploy behavior.

Verification:

- `wc -l apps/mobile/.metadata apps/mobile/analysis_options.yaml apps/mobile/l10n.yaml`.
- `wc -c` for all placeholder `.gitkeep` files.
- `shasum -a 256` for all placeholder `.gitkeep` files.
- `od -An -tx1 apps/admin_web/.gitkeep`.
- `git diff --check`.

## Batch 75 - Mobile Pubspec and Dependency Lock

Scope reviewed line by line:

- `apps/mobile/pubspec.yaml` - 136 lines reviewed.
- `apps/mobile/pubspec.lock` - 1455 lines reviewed in chunks covering lines 1-200, 201-400, 401-600, 601-800, 801-1000, 1001-1200, and 1201-1455.

Findings fixed:

- `apps/mobile/pubspec.yaml` still used the default Flutter template description `A new Flutter project.`. Updated it to describe the MBCG church life, Bible reading, sermon, and giving app.

Logic chain audit:

- Direct App dependencies match current product capabilities: API transport, local Drift/Sqflite storage, Riverpod state, secure storage, routing, system settings, sermon audio playback/background metadata, Firebase push, local notifications, TTS, sharing, Markdown rendering, and QR scanning.
- No YouTube import, Whisper/transcription, worker, video conversion, or server-side processing dependency is present in the mobile App dependency graph.
- `sqlite3` remains explicitly overridden to the current local debug/build compatibility pin documented in the pubspec comment.
- The lockfile is generated dependency state only; no manual dependency version change was made in this batch.

Verification:

- `flutter pub get --offline` from `apps/mobile` passed.
- `git diff --check`.

## Batch 76 - Mobile Launcher and Launch Image Binary Remainders

Binary artifacts validated individually:

- `apps/mobile/android/app/src/main/res/drawable-hdpi/ic_launcher_monochrome.png` - PNG RGBA 162x162, SHA-256 `4117ad695f15825b4343fc0f9dc3b6be86fb69384148b1597e5e28152ab6ef31`.
- `apps/mobile/android/app/src/main/res/drawable-mdpi/ic_launcher_monochrome.png` - PNG RGBA 108x108, SHA-256 `5e90013b1b985517882d406595872de7b838a84c7f29940d5d10f6b41a1bc5fa`.
- `apps/mobile/android/app/src/main/res/drawable-xhdpi/ic_launcher_monochrome.png` - PNG RGBA 216x216, SHA-256 `1b03c57481a4505cf811568137df5d6b925c5f5b63281b4d0780ab2c15bf14ca`.
- `apps/mobile/android/app/src/main/res/drawable-xxhdpi/ic_launcher_monochrome.png` - PNG RGBA 324x324, SHA-256 `6b637af8978cce9c9900eab0159525d9b33cdd532a7e885b2c794a2513050d43`.
- `apps/mobile/android/app/src/main/res/drawable-xxxhdpi/ic_launcher_monochrome.png` - PNG RGBA 432x432, SHA-256 `cf9e52e13c8aff8ed679d339da0c42d6208e532ddbb3c6bbb849d06fba3171e8`.
- `apps/mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` - PNG RGBA 72x72, SHA-256 `2813a2f4a0288de8a8c02a1ec8f2c39756287776917a1f1be3f803af44adf527`.
- `apps/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` - PNG RGBA 48x48, SHA-256 `a21d3673b60f77203ddd0af821b83e762ccef63c95c69e189911bc5bfad8a3b0`.
- `apps/mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` - PNG RGBA 96x96, SHA-256 `e2c7903de82015a480dc0213ed4de8a75ef4c5349b5e2c69d61e2960dd6490ca`.
- `apps/mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` - PNG RGBA 144x144, SHA-256 `1c62be6f0ae4bf369750e90142219c5cd01ae6e9bc12378b70504e265dcbbb32`.
- `apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` - PNG RGBA 192x192, SHA-256 `241960bc9a095ff6beb78abf088553fa81b7a60a33be08ad1ae0d1e16d2e6450`.
- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png` - PNG gray+alpha 1x1, SHA-256 `93ae7d494fad0fb30cbf3ae746a39c4bc7a0f8bbf87fbb587a3f3c01f3c5ce20`.
- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png` - PNG gray+alpha 1x1, SHA-256 `93ae7d494fad0fb30cbf3ae746a39c4bc7a0f8bbf87fbb587a3f3c01f3c5ce20`.

Reference chain audit:

- `apps/mobile/android/app/src/main/AndroidManifest.xml` references `@mipmap/ic_launcher_round`.
- `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` reference `@drawable/ic_launcher_monochrome`.
- `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json` references `LaunchImage.png`, `LaunchImage@2x.png`, and `LaunchImage@3x.png`.

Findings:

- No defects found in this batch.

Verification:

- `file` for each listed binary artifact.
- `shasum -a 256` for each listed binary artifact.
- `rg -n "ic_launcher_monochrome|ic_launcher_round|LaunchImage@2x|LaunchImage@3x|LaunchImage" apps/mobile/android apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset`.
- Line-read `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`, `apps/mobile/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`, and `apps/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json` reference entries.
- `git diff --check`.

## Batch 77 - Bible Content Normalized Generated Outputs

Generated text artifacts validated:

- `packages/bible_content/sources/web/normalized/index.json` - 20 lines, SHA-256 `77bcae9e4b9780926add51855411bc7564dec45808643a1fdec94cc69e4da6a3`.
- `packages/bible_content/sources/web/normalized/books.json` - 1256 lines, SHA-256 `6f2079839793166dc89a12980044fbd791b0bea7a736e3cd24f951c65c9c7d86`.
- `packages/bible_content/sources/web/normalized/book_mappings.json` - 1165 lines, SHA-256 `c3e2e0456c5375334d7c346a54fe5f5bed1ed7eb85a2acb427847f4b34039e9b`.
- `packages/bible_content/sources/web/normalized/chapters.jsonl` - 1189 lines, SHA-256 `23f833e4fc4a6a678d20168077719a7a7f61604604ac2919e41dec623b6ff60e`.
- `packages/bible_content/sources/web/normalized/verses.jsonl` - 31103 lines, SHA-256 `ac58ae15d38903bcab0eeb1f298197733e1b8d1f099500e261320043404bbcd7`.
- `packages/bible_content/sources/cuvs/normalized/index.json` - 20 lines, SHA-256 `da1c5fb05b0ca4804bdc789945cb8b0cff47dbdafb3a9987e4d2a74b9ae61af0`.
- `packages/bible_content/sources/cuvs/normalized/books.json` - 1256 lines, SHA-256 `3f6a6129a07acbcdd4d1dfc5c803a3c8725ec6cde03fbc0def713e281b689da7`.
- `packages/bible_content/sources/cuvs/normalized/book_mappings.json` - 1165 lines, SHA-256 `936b867cac0765539d5468f21cf3edb5d097d45f4ef4acafabd0b92bbe4b935b`.
- `packages/bible_content/sources/cuvs/normalized/chapters.jsonl` - 1189 lines, SHA-256 `a356079353715fb647fc12544d34a73ed394616187b7ddb25660768553566508`.
- `packages/bible_content/sources/cuvs/normalized/verses.jsonl` - 31021 lines, SHA-256 `ea780e73d3005531078c7a17744fe3f65b9656d3d306b886c7818025df0c8688`.
- `packages/bible_content/sources/cuvt/normalized/index.json` - 20 lines, SHA-256 `23c7853a208e0ecd7ce7ed6fd4a28618ae5d4a7fb786331f364929e3f8bc3f71`.
- `packages/bible_content/sources/cuvt/normalized/books.json` - 1256 lines, SHA-256 `f4f23f9e27aebc04b0afe3f0595b2e70df55375297cb51759a9a475bb966b010`.
- `packages/bible_content/sources/cuvt/normalized/book_mappings.json` - 1165 lines, SHA-256 `72fb8d879bb7914aa2db681132cf65407f9d93d446a3ebe1f7e39b3a082b6cdd`.
- `packages/bible_content/sources/cuvt/normalized/chapters.jsonl` - 1189 lines, SHA-256 `b2f9ebedab4a81a0b5ba45a18058bf54bad79cef6bb66f72ba4e5c8e227a6006`.
- `packages/bible_content/sources/cuvt/normalized/verses.jsonl` - 31021 lines, SHA-256 `47e2ece32936983cf2f49ce6d3e4190a19f29cb55ff388396c1a3e9c3d721d15`.

Structural validation:

- Parsed every `index.json`, `books.json`, and `book_mappings.json`.
- Parsed every line of `chapters.jsonl` and `verses.jsonl` for WEB, CUVS, and CUVT.
- Confirmed each version has 66 books, 66 book mappings, 1189 chapters, and no duplicate book/chapter/verse ids.
- Confirmed chapter ids match book `chapterCount`, verse ids match `book.chapter.verse`, each verse `chapterId` exists, and chapter `verseCount` equals the number of verse rows in that chapter.
- Confirmed index verse counts: WEB 31103 with 5 empty verse markers; CUVS 31021 with 0 empty markers; CUVT 31021 with 0 empty markers.

Findings:

- No defects found in this batch.

Verification:

- `wc -l` for all normalized JSON/JSONL files listed above.
- `shasum -a 256` for all normalized JSON/JSONL files listed above.
- Node structural validator parsed all normalized JSON and every JSONL line across WEB, CUVS, and CUVT.
- `git diff --check`.

## Batch 78 - Audit Ledger Self-Review

Scope reviewed line by line:

- `docs/audits/line_by_line_audit_2026_07_08.md` - 3366 lines reviewed in chunks covering lines 1-250, 251-500, 501-750, 751-1000, 1001-1250, 1251-1500, 1501-1750, 1751-2000, 2001-2250, 2251-2500, 2501-2750, 2751-3000, 3001-3250, and 3251-3366.

Findings fixed:

- The audit ledger still reported `Status: in progress` after all tracked files had been covered. Updated the status to complete for this audit pass.
- Added the current tracked file count at completion pass and this self-review batch row/section. These closing additions were reviewed in the patch diff.

Logic chain audit:

- The audit ledger remains a tracking document only; it does not change product, app, backend, Web, SDK, database, deployment, or generated resource behavior.
- Earlier detailed batch sections are not perfectly sorted by batch number because later batches were appended near newer work while older backend detail sections already existed near the end. The summary table remains the ordered index and every detailed section is headed by batch number.
- The audit start count is retained as historical evidence, while the completion count records the current tracked-file set after audit-time additions.

Verification:

- `wc -l docs/audits/line_by_line_audit_2026_07_08.md`.
- Full-file chunk read of lines 1-3366 with no truncated output.
- `git ls-files` count check returned 1137 tracked files.
- Tracked-file coverage check against this audit ledger returned no missing files before adding this closing self-review section.
- `git diff --check`.

## Batch 13 - Backend Sermons, Audio Storage, Publishing, Recommendations, and Admin Workflow

Scope reviewed line by line:

- `backend/src/modules/sermons/in-memory-sermon.repository.ts` - 357 lines reviewed.
- `backend/src/modules/sermons/postgres-sermon.repository.ts` - 417 lines reviewed.
- `backend/src/modules/sermons/sermon-audio-storage.service.ts` - 456 lines reviewed.
- `backend/src/modules/sermons/sermon-errors.ts` - 71 lines reviewed.
- `backend/src/modules/sermons/sermon.repository.ts` - 39 lines reviewed.
- `backend/src/modules/sermons/sermon.routes.ts` - 98 lines reviewed.
- `backend/src/modules/sermons/sermon.service.ts` - 226 lines reviewed.
- `backend/src/modules/sermons/sermon_recommendation_ranker.ts` - 28 lines reviewed.
- `backend/src/modules/admin/sermons/admin-sermons.routes.ts` - 166 lines reviewed.
- `backend/src/modules/admin/sermons/admin_sermon_audio.routes.ts` - 155 lines reviewed.
- `backend/src/modules/admin/sermons/admin_sermon_workflow.routes.ts` - 217 lines reviewed.
- `packages/api_contracts/src/sermons.ts` - 155 lines reviewed.

Findings fixed:

- Aligned the in-memory sermon list cursor with the Postgres repository. Both now use sermon date cursor semantics instead of the mock repository returning a sermon id cursor.
- Added sermon publish notification delivery summaries to publish audit records, matching the Life publish audit pattern and making notification failure/success traceable outside logs.

Logic chain audit:

- Public sermon list and detail only expose `published` sermons.
- Public sermon audio checks the sermon is published before reading audio storage and supports byte ranges.
- Admin audio upload, delete, create draft, local package import, publish, archive, status transition, and delete are permission-gated and audited.
- Publish validation stays in `SermonService` and requires title, speaker, sermon date, ready audio, transcript text, outline, and Scripture references.
- Backend accepts local sermon package output but does not run transcription, outline generation, or Scripture extraction workers.
- Sermon publish push failure is logged and captured in audit summary without rolling back the sermon state.

Deferred note:

- The in-memory seed sermon remains a test/mock fixture that is published for recommendation tests even though its audio is missing until tests upload audio. This is not production data, but it should be revisited if mock backend data is expected to be fully playable.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/sermon.repository.test.ts tests/sermon_admin.routes.test.ts tests/sermon_media.routes.test.ts`

## Batch 14 - Backend Prayer Requests, Moderation, Shared Visibility, and Notifications

Scope reviewed line by line:

- `backend/src/modules/prayer/in-memory-prayer.repository.ts` - 293 lines reviewed.
- `backend/src/modules/prayer/postgres-prayer.repository.ts` - 266 lines reviewed.
- `backend/src/modules/prayer/prayer-errors.ts` - 15 lines reviewed.
- `backend/src/modules/prayer/prayer.repository.ts` - 40 lines reviewed.
- `backend/src/modules/prayer/prayer.routes.ts` - 100 lines reviewed.
- `backend/src/modules/prayer/prayer.service.ts` - 124 lines reviewed.
- `backend/src/modules/admin/prayer-requests/admin-prayer-requests.routes.ts` - 266 lines reviewed.
- `packages/api_contracts/src/prayer.ts` - 149 lines reviewed.

Findings fixed:

- Added an audit summary for public/member prayer request submission. The audit payload records identity, visibility, status, group id, body length, and whether an email exists, but does not store the prayer body or submitter email.
- Wired `AuditService` into the public prayer routes through `app_routes.ts`.

Logic chain audit:

- New prayer requests default to `private` and `pending`.
- Public list only exposes approved public requests.
- Member own-list only returns requests authored by the member.
- Member shared-list exposes approved public/member requests and approved group requests only when the member's group id matches.
- Admin list/moderate/approve/hide/archive/delete routes are permission-gated and audited.
- Approval may request App notification, and the push payload remains generic without prayer body content.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
- `bun --filter @mbc/backend test tests/prayer.routes.test.ts`

## Batch 15 - Backend Newcomer Follow-Up

Scope reviewed line by line:

- `backend/src/modules/newcomers/in-memory-newcomer.repository.ts` - 146 lines reviewed.
- `backend/src/modules/newcomers/newcomer-errors.ts` - 29 lines reviewed.
- `backend/src/modules/newcomers/newcomer.repository.ts` - 27 lines reviewed.
- `backend/src/modules/newcomers/newcomer.routes.ts` - 43 lines reviewed.
- `backend/src/modules/newcomers/newcomer.service.ts` - 63 lines reviewed.
- `backend/src/modules/newcomers/postgres-newcomer.repository.ts` - 195 lines reviewed.
- `backend/src/modules/admin/newcomers/admin-newcomers.routes.ts` - 114 lines reviewed.
- `packages/api_contracts/src/newcomers.ts` - 128 lines reviewed.

Findings:

- No code changes were required in this batch.

Logic chain audit:

- Public newcomer submission creates a canonical newcomer profile and writes an audit summary without storing the full interest text in audit.
- Admin newcomer list/detail routes are permission-gated.
- Admin update writes before/after audit snapshots without exposing full sensitive fields.
- Admin follow-up creation stores author metadata, writes a redacted follow-up audit snapshot, and automatically advances `new` or `assigned` profiles to `contacted` when a completed follow-up is recorded.
- In-memory and Postgres repositories agree on profile fields, follow-up ordering, and update semantics.

Deferred note:

- `newcomerTransitionInvalid` exists but status transition validation is not currently enforced. This may be intentional flexibility for admins, but if strict workflow transitions are required later, `NewcomerService` is the correct owner.

Verification:

- `git diff --check`

## Batch 12 - Backend Notification Delivery, Push Devices, Inbox, Retry, and Admin Operations

Scope reviewed line by line:

- `backend/src/modules/notifications/fcm-push.provider.ts` - 238 lines reviewed.
- `backend/src/modules/notifications/in-memory-notification-delivery.repository.ts` - 154 lines reviewed.
- `backend/src/modules/notifications/in-memory-notification-inbox.repository.ts` - 191 lines reviewed.
- `backend/src/modules/notifications/in-memory-push.repository.ts` - 214 lines reviewed.
- `backend/src/modules/notifications/member-notification.routes.ts` - 169 lines reviewed.
- `backend/src/modules/notifications/noop-push.provider.ts` - 17 lines reviewed.
- `backend/src/modules/notifications/notification-delivery.repository.ts` - 92 lines reviewed.
- `backend/src/modules/notifications/notification-errors.ts` - 46 lines reviewed.
- `backend/src/modules/notifications/notification-inbox.repository.ts` - 86 lines reviewed.
- `backend/src/modules/notifications/notification-inbox.service.ts` - 62 lines reviewed.
- `backend/src/modules/notifications/notification.service.ts` - 480 lines reviewed.
- `backend/src/modules/notifications/notification_retry_scheduler.ts` - 69 lines reviewed.
- `backend/src/modules/notifications/postgres-notification-delivery.repository.ts` - 223 lines reviewed.
- `backend/src/modules/notifications/postgres-notification-inbox.repository.ts` - 253 lines reviewed.
- `backend/src/modules/notifications/postgres-push.repository.ts` - 256 lines reviewed.
- `backend/src/modules/notifications/push-provider.factory.ts` - 41 lines reviewed.
- `backend/src/modules/notifications/push.provider.ts` - 23 lines reviewed.
- `backend/src/modules/notifications/push.repository.ts` - 47 lines reviewed.
- `backend/src/modules/admin/notifications/admin_notifications.routes.ts` - 123 lines reviewed.
- `backend/src/app_routes.ts` - 304 lines reviewed for notification route wiring.
- `packages/api_contracts/src/push.ts` - 234 lines reviewed.

Findings fixed:

- Removed the in-memory notification inbox fanout scan cap of 200 active members so mock delivery does not silently miss eligible members beyond the first page.
- Added admin audit records for due-task retry, single delivery retry, and delivery cancellation.
- Tightened `NotificationService.cancelDelivery` so repository-level `null` is converted back to `notification_task_not_found`, keeping route handlers free of repository detail.

Logic chain audit:

- Guest devices can register without login but only receive `public` audience push targets; guest devices do not create member inbox items.
- Member devices are tied to member identity, permission status, active member status, and notification preference.
- Business notification intent creates or reuses a canonical message, fans out member inbox items, creates or reuses a delivery task, calls the provider, and stores provider evidence.
- Prayer update push payload uses generic text and does not include prayer request body.
- Life publish and weekly bulletin notifications keep explicit dedupe keys and do not roll back the source content if push fails.
- Retry scheduler is process-local and only retries existing delivery tasks; it does not own future business reminders.
- Admin delivery retry/cancel remains permission-gated and now records audit summaries.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`

## Batch 11 - Backend Jobs, Admin Job Routes, Job Contract, and Postgres Smoke

Scope reviewed line by line:

- `backend/src/modules/jobs/in-memory-job.repository.ts` - 129 lines reviewed.
- `backend/src/modules/jobs/job-error-result.ts` - 46 lines reviewed.
- `backend/src/modules/jobs/job.repository.ts` - 19 lines reviewed.
- `backend/src/modules/jobs/job.service.ts` - 45 lines reviewed.
- `backend/src/modules/jobs/postgres-job.repository.ts` - 170 lines reviewed.
- `backend/src/modules/admin/jobs/admin-jobs.routes.ts` - 165 lines reviewed.
- `backend/src/scripts/postgres-smoke.ts` - 174 lines reviewed.
- `packages/api_contracts/src/jobs.ts` - 140 lines reviewed.

Findings fixed:

- Aligned `InMemoryJobRepository` pagination with the Postgres repository and API response contract. The cursor now uses the next row's `createdAt` timestamp instead of a job id, so mock and Postgres environments share the same list behavior.

Logic chain audit:

- Admin jobs list, detail, stats, status update, and cancel routes all remain permission-gated.
- Cancel validation stays in `JobService`; repositories only persist the status transition.
- Sermon production pipeline status reflects the current local-package workflow and does not reintroduce backend worker processing.
- Postgres smoke creates, uploads, packages, publishes, verifies, and then cleans up a sermon and related job/audit data.

Verification:

- `git diff --check`
- `bun --filter @mbc/backend typecheck`
