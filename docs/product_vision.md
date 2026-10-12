# MBC WalkWith Product Vision

Status: draft

This document defines the target product shape for MBC WalkWith. The roadmap
explains implementation order; this document explains what the product should
become when the major loops are complete.

## Product Identity

MBC WalkWith is a church life companion platform. It should help members read
Scripture, understand difficult passages with sourced help, connect Scripture to
church sermons, and follow weekly church life without becoming a social media
app.

The final product has four connected surfaces:

- Mobile app: the member-facing daily companion.
- Backend API: the trusted source of content, permissions, diagnostics,
  media storage, local package import, notifications, and sensitive workflows.
- Admin web: the staff and coworker console for content production, review,
  moderation, publishing, finance workflows, and audit review.
- Public web: the visitor-facing church landing site for mission, service
  information, maps, contact links, and App entry points.

## Final Product Shape

The finished product should feel quiet, readable, trustworthy, and practical.
Members should be able to open the app for daily Scripture and naturally move
between Bible study, sermons, weekly church life, prayer, and giving.

The core member loop is:

1. Open the app and continue reading Scripture.
2. Read or listen to the current Bible chapter through text-to-speech.
3. Select a verse for notes, highlights, bookmarks, original-language help, or
   a sourced explanation.
4. Open sermons connected to the same Scripture.
5. Listen to the sermon, view its outline, transcript, and cited Scripture.
6. Return from sermon references back to the Bible reader.
7. Check weekly church life, prayer needs, events, and giving information.

The core admin loop is:

1. Import or create church content.
2. Review metadata, privacy level, and theological or pastoral sensitivity.
3. Review local sermon packages and system diagnostics when needed.
4. Approve and publish content.
5. Monitor jobs, notifications, audit logs, prayer moderation, and finance
   records.

## Target Mobile Features

### Study

Study is the spiritual center of the app.

Target features:

- Bible translation selection for supported public-domain or licensed texts.
- Book, chapter, and verse navigation.
- Offline Bible reading with local cache.
- Text-to-speech Bible reading from local Scripture text.
- Reading progress, recently read chapters, and resume state.
- Verse notes, highlights, and bookmarks.
- Bible search.
- People and places study assists.
- Original-language word insights where data is available.
- Sourced AI explanations with clear source categories.
- Related sermons and church teaching resources by passage.
- Safe handling for difficult or controversial passages, including multiple
  mainstream views when appropriate.

Boundaries:

- The app must not present unsourced AI output as church doctrine.
- Raw AI question history should not be stored locally by default.
- Public Bible text can be cached locally; sensitive personal study data should
  sync through controlled backend paths.

### Sermons

Sermons should become a structured teaching archive, not only an audio list.

Target features:

- Sermon list by date, speaker, series, topic, and Scripture.
- Search across metadata, summary, Scripture references, and transcript.
- Sermon detail route with summary, outline, transcript, references, and audio.
- Audio playback with speed control, background playback, lock screen controls,
  and resume position.
- Playback progress persistence and sync.
- One-tap jump from cited Scripture to the Bible reader.
- Related sermons by Scripture, speaker, topic, and series.
- Offline cache for public sermon metadata and recently used sermon content.

Admin and backend features:

- Create local sermon drafts.
- Upload church-recorded sermon audio.
- Upload or paste prepared sermon manuscripts.
- Process audio locally and upload reviewed sermon packages.
- Upload locally reviewed outlines.
- Upload locally reviewed Scripture references.
- Store review notes and generated metadata.
- Require admin review before publishing generated content.
- Archive or delete sermons with audit records.

### Life

Life should make church life easier to follow without turning the app into a
feed for endless posts.

Target features:

- Weekly bulletin as structured cards instead of PDF-first content.
- Announcements, fellowship schedules, service opportunities, and event
  highlights.
- Event detail pages and registration where needed.
- Fellowship group visibility rules.
- Notification permission entry; the backend may keep delivery filters for
  weekly bulletin, sermon publication, prayer updates, and future event
  reminders.
- Public content available to guests.
- Member-specific content only after authentication.

Admin and backend features:

- Life post CMS with draft/private/public visibility.
- Publish and unpublish workflow.
- Optional scheduling fields for future events.
- Audit records for content changes.
- Future media support for images and attachments.

### Prayer

Prayer should be privacy-aware by default.

Target features:

- Submit prayer requests as guest or signed-in member.
- Visibility choices: private, members, group, public.
- Clear status display for pending, approved, hidden, and archived requests.
- Member view for personal requests.
- Shared view for approved member-visible requests.
- Pastoral/admin moderation before broad publication.

Boundaries:

- Prayer requests should default to private.
- Private prayer content must not be cached casually on device.
- Group visibility must depend on backend membership and permission checks.

### Giving

Giving is a high-sensitivity domain and should mature only after security,
policy, finance, and app store requirements are settled.

Target features:

- Giving entry point.
- Member giving history.
- Annual giving statements.
- Statement download/export.
- PDF giving statement download with CSV fallback for app compatibility.
- Notification or status feedback when statements are ready.

Backend and admin requirements:

- Payment provider confirmation before checkout implementation.
- Stripe Checkout session creation for member giving.
- Verified payment webhooks as the source of truth.
- Idempotent transaction recording.
- Asynchronous payment and refund event handling.
- Stripe fee, net deposit, payout, refund, and dispute tracking.
- Finance reconciliation dashboard for gross gifts, fees, net deposits, refunds,
  disputes, payout count, unreconciled records, and needs-review records.
- Finance roles and permissioned exports.
- Annual statement generation.
- PDF or document storage with signed access.
- Audit logs for finance workflows.

Boundaries:

- Transactions must not be recorded from client-side success screens alone.
- Annual donor statements should show gross succeeded gifts; provider fees and
  net deposits belong in finance reconciliation, not donor-facing totals.
- Giving data should be isolated from normal app engagement data.
- Giving transactions and statement PDFs should not be stored in general local
  app cache.

### Mine and Member Account

Mine is the place for identity and personal settings.

Target features:

- Optional member sign-in.
- Theme mode.
- App language and Bible translation behavior.
- Reader assist settings.
- Native notification permission entry and notification center access.
- Fellowship group and member profile display.
- Sign out and device token revocation.

## Target Admin Web Features

Admin web is the operational center for church coworkers and staff.

Target areas:

- Dashboard for content, jobs, prayer, giving, and system health.
- Sermon production pipeline.
- Life post CMS.
- Prayer moderation.
- Giving and annual statement workflows.
- Member management.
- Admin user and role management.
- Bible knowledge management.
- Historical job diagnostics and local package readiness monitoring.
- Settings management.
- Audit log review.

Admin web must call backend APIs only. It must not connect directly to
Postgres, object storage, payment providers, or AI providers from the browser.

## Target Backend Shape

The backend should remain a modular monolith until there is a strong operational
reason to split it.

Core backend responsibilities:

- REST JSON API under `/v1`.
- Shared response and error format.
- Public content APIs.
- Member authentication and member-only APIs.
- Admin authentication, RBAC, and audit logging.
- Postgres persistence with explicit migrations.
- Historical job diagnostics and system health.
- Sermon media storage and streaming.
- Local transcription, outline, and Scripture reference package import.
- Push notification registration and delivery.
- Settings and feature flags.
- Sensitive workflows for prayer and giving.

Repository implementations should keep the current pattern:

- In-memory repositories for development and fast tests.
- Postgres repositories for real environments.
- Services coordinating business rules above repositories.
- Routes validating API inputs through shared contracts where possible.

## Data and Offline Strategy

Public, low-sensitivity content can be cached locally:

- Bible books, chapters, and verse texts.
- Public sermon metadata, outlines, references, and transcripts.
- Public life posts.
- Reading progress.
- Study notes, highlights, and bookmarks with sync queue support.

High-sensitivity data should stay backend-controlled:

- Prayer requests beyond safe local display.
- Giving transactions.
- Annual statement PDFs.
- Payment provider state.
- Admin and finance records.
- Raw AI question history.

The mobile app should continue toward a local-first user experience for public
content, while the backend remains the source of truth for permissions,
publication, moderation, and sensitive data.

## Product Principles

- Scripture first: reading and study should be the center of the daily app.
- Sermons connected to Scripture: sermons should point back to Bible passages.
- Trust over novelty: generated content must be sourced, reviewed, and
  presented carefully.
- Church life without social noise: life content should be structured,
  practical, and easy to scan.
- Privacy by default: prayer and giving require careful permission boundaries.
- Admin review before publication: generated, pastoral, and sensitive content
  should go through review before broad visibility.
- API-first and offline-aware: mobile UI should talk to repositories, while
  repositories hide mock, local, and remote data sources.

## Non-Goals

The product should not become:

- A generic social network.
- A chat-first AI theology app.
- A payment app before finance and policy controls are ready.
- A PDF dumping ground for church documents.
- A mobile-only system without admin review and backend authority.

## Completion Definition

The product reaches its intended first complete shape when:

- Members can read, listen to, annotate, and search Scripture.
- Members can move naturally from Scripture to related sermons and back.
- Sermons can be imported, processed, reviewed, published, played, and connected
  to Scripture.
- Weekly church life can be published from admin web and consumed cleanly in
  mobile.
- Prayer requests support privacy, member identity, and admin moderation.
- Giving history and annual statements are permissioned and audit-aware.
- Admin users can manage content, jobs, members, settings, prayer, giving, and
  audit logs.
- Public content works with offline-aware mobile behavior.
- Sensitive workflows remain backend-controlled.
