# Sermons SDK

This document covers sermon listing, details, audio playback, transcripts, progress reporting, search, series, speakers, topics, and Scripture-linked discovery.

## Mobile Files

- Domain: `apps/mobile/lib/features/sermons/domain/sermon.dart`
- Discussion guide domain: `apps/mobile/lib/features/sermons/domain/sermon_discussion_guide.dart`
- DTO: `apps/mobile/lib/features/sermons/data/dto/sermon_dto.dart`
- Discussion guide DTO: `apps/mobile/lib/features/sermons/data/dto/sermon_discussion_guide_dto.dart`
- Repository: `apps/mobile/lib/features/sermons/data/sermons_repository.dart`
- Discussion guide repository: `apps/mobile/lib/features/sermons/data/sermon_discussion_guide_repository.dart`
- Progress repository: `apps/mobile/lib/features/sermons/data/sermon_progress_repository.dart`
- Audio engine: `apps/mobile/lib/features/sermons/data/player/sermon_audio_engine.dart`
- Playback session: `apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart`
- Remote API: `apps/mobile/lib/features/sermons/data/remote/api_sermons_remote_data_source.dart`
- UI: `apps/mobile/lib/features/sermons/presentation/`

## Backend and Contracts

- Contracts: `packages/api_contracts/src/sermons.ts`
- Discussion guide contract: `packages/api_contracts/src/sermon-discussion-guides.ts`
- Public routes: `backend/src/modules/sermons/sermon.routes.ts`
- Discussion guide routes: `backend/src/modules/sermon-discussion-guides/`
- Admin routes: `backend/src/modules/admin/sermons/`
- Admin discussion guide routes: `backend/src/modules/admin/sermon-discussion-guides/`
- Service: `backend/src/modules/sermons/sermon.service.ts`
- Audio storage: `backend/src/modules/sermons/sermon-audio-storage.service.ts`

## SDK Rules

- Published sermons should have ready audio according to backend publish rules.
- Public sermon list, recommendation, and detail responses use the public sermon
  projection. They never include admin-only `reviewMarkdown` or
  `processingMetadata` fields.
- `sermonDate` is a strict `YYYY-MM-DD` calendar date in create, update, import,
  admin, and public contracts.
- Backend audio streaming must support HTTP byte ranges used by native Android
  and iOS players, including `bytes=N-M`, `bytes=N-`, and `bytes=-N`; invalid
  ranges must fall back safely instead of crashing the stream.
- UI must still show a clear unavailable state for legacy cache, partial data, or media failures.
- Transcript and outline are admin-uploaded or admin-generated content.
- Audio URLs may be relative to API base URL and must be normalized by DTO parsing.
- Sermon playback must go through `SermonPlayerSession`, not directly through widgets.
- `SermonPlayerSession` must use the audio playback capability so Android notification controls, iOS Control Center / lock screen controls, headset buttons, interruption handling, completion state, and App UI share one playback state.
- Detail fetches must treat backend `sermon_not_found` or 404 as authoritative: delete local cached detail and return empty rather than exposing stale unpublished content.
- Network-only detail failures may fall back to cached published sermon data.
- Successful sermon list/recommendation responses use the shared collection
  envelope `data: { items: [...] }`; sermon lists also include `nextCursor`.
  Successful detail responses use `data: {}`. Missing or malformed
  `data.items` is a contract failure, not an empty sermon result, and the
  removed array-shaped `data: []` envelope must not be restored.
- Cached sermon fallback is limited to transport/backend `ApiError` failures.
  DTO or envelope `FormatException` failures must remain visible so contract
  drift cannot be hidden by stale local data.
- Progress is saved locally with an update timestamp and synchronized through
  `GET/POST /sermons/:sermonId/progress`. The App sends both the valid member
  token when available and its installation `X-External-User-Id`; the backend
  gives member identity precedence.
- Progress restore compares local and server `updatedAt`. A newer server record
  is applied locally, while network failure or an older server record cannot
  replace newer offline progress.
- The backend owns duration bounding and completion derivation. Clients report
  position and completion evidence but do not own canonical completion state.
- System pause or playback completion must save/report progress the same way as App UI pause.
- Before switching audio sources, the player saves the previous sermon's local
  position under the previous sermon id, then reports it remotely in the
  background. Native pause events emitted by source replacement must not write
  the previous position under the next sermon.
- Scripture references may link into the Bible reader.
- Scripture recommendations with a chapter context return only sermons whose
  structured references match that chapter; exact verse matches rank first.
  Book-wide fallback is allowed only when the request omits `chapter`. Remote,
  in-memory, and cached recommendation implementations must keep this rule.
- Sermon AI Q&A must use the backend member AI API and treat responses as
  temporary study help, not sermon source content.
- Sermon discussion guides are separate feature-owned material linked by
  `sermonId`; they must not copy sermon transcript, audio metadata, or sermon
  source content.
- Admin discussion guide routes use the complete guide schema. The public App
  route uses `publicSermonDiscussionGuideSchema`, projected at the Backend
  service boundary, requires `published/public/null audienceId`, and never
  returns Admin-only `generatedMetadata`.
- App sermon detail may show a published discussion guide after the sermon
  player controls. Missing guide responses are treated as "no guide" rather
  than as a sermon detail failure.
- App discussion guide DTOs strictly require the public envelope, required
  fields, nested item types, supported enums, and ISO timestamps. Malformed
  payloads throw `FormatException` and render a retry state; they must not be
  converted to an empty object, empty guide, or missing-guide state.
- Discussion responses default to private and may use member auth or
  `X-External-User-Id` for low-sensitivity guest ownership.
- The current App response route accepts only a published public guide and a
  private response. Admin response listing is server-forced to
  `shared_with_group`; clients cannot request private response content, and the
  hide action rejects private response ids.
- Discussion guide create/update clients submit status intent only. Backend
  enforces `new -> draft/review`, review-before-publish, published content lock,
  archived restoration through draft, publishable material, published sermon,
  non-empty prayer prompts, audience target shape, and scoped group/course/
  discipleship target existence on create, target change, and publication.
  Admin status options and locked fields are UX affordances, not transition
  authority. A removed target does not prevent moving an old guide to review or
  archived.
- The current App API exposes only published public guides. A valid scoped
  target reference does not grant App access; scoped member authorization and
  read routes are not implemented yet.
- Discussion guide questions, action steps, and prayer prompts are capped at 50
  items. Question ids and action-step ids are unique within their own lists.
  Backend persisted JSON parsing and App public DTO parsing both fail visibly on
  duplicate, oversized, or malformed structures; neither layer filters bad
  items into an apparently valid empty result.
- Search and discovery results must only include published sermons visible to the current actor.
- `GET /sermons/facets` returns published-only speaker, series, and topic
  catalogs. `GET /sermons` accepts exact `speaker`, `series`, and `topic`
  filters in addition to text and Scripture queries.
- The App reads facets through `SermonsRepository`, shows one exact selection
  per facet, and includes active filters in `SermonListRequest`. A transport
  failure may derive facet suggestions from cached sermons; malformed facet
  payloads remain visible contract failures.
- Canonical sermon search covers title, speaker, series, topics, primary
  reference, summary, transcript, and structured Scripture reference text.
  Offline search must preserve the same field semantics.
- Successful unfiltered pages are upserted into the local Drift cache. A
  bounded month may remove stale cached rows only when the returned page is
  provably complete; paginated or search results must never replace unrelated
  cached months. Detail lookup and offline Scripture recommendations query all
  matching cached rows rather than the default list limit.
- Cached sermon topics are normalized in `local_sermon_topics`. Offline list
  fallback applies the same case-insensitive exact speaker, series, and topic
  semantics. Search or filtered responses are never allowed to reconcile a
  complete cached month.
- Discovery reads canonical sermon data directly. There is no current search
  index, reindex operation, or index-specific SDK error. Public status filtering
  remains backend-owned, while SDKs distinguish transport fallback from malformed
  contract failures.

## Admin Sermons SDK

Admin Web API helper:

- `apps/admin_web/src/core/api/sermons.ts`
- Discussion guide helper:
  `apps/admin_web/src/core/api/sermon_discussion_guides.ts`

Admin capabilities:

- Create and edit sermons.
- Upload audio.
- Upload or paste prepared manuscript text.
- Upload reviewed local sermon packages containing transcript, outline, and
  Scripture references.
- Publish/unpublish sermons.
- Maintain series, topics, and Scripture reference mapping through the canonical
  sermon aggregate.
- Topic suggestions come from the backend-owned published sermon facets. Admin
  forms keep only temporary `string[]` edit state and submit topics through the
  canonical sermon create/update contracts; the browser does not persist a
  second topic catalog.
- Admin library filtering snapshots normalized criteria only when the operator
  submits them. Infinite-query page cursors belong to the query lifecycle;
  refreshes and filter changes cannot append responses by reading mutable form
  or cursor state after a request completes.
- Manual draft creation submits metadata, optional initial transcript, and
  optional review Markdown through one `POST /v1/admin/sermons/local-drafts`
  command. The Admin client must not create a partial draft and follow it with a
  second PATCH for the initial editor contents.
- Create, edit, publish, archive, assign by an existing target id, and moderate
  sermon discussion guides. A target selector and feature-specific AI draft
  action are not connected yet.

Admin sermon projections include a persisted non-negative integer `revision`.
Creation starts at revision zero. Every later metadata, status, local-package,
audio, archive, or delete mutation sends the latest value in
`x-sermon-revision`; a successful mutation increments it. A missing or malformed
header is a contract failure. A stale editor or concurrent media operation
receives `sermon_state_changed` and must refresh; clients must not automatically
retry a stale write. Public App sermon projections omit `revision`.
Changing any already published sermon requires `sermons:publish`; ready audio
cannot be removed until the sermon is returned to draft.
Admin mutation composables snapshot sermon ids, payloads, and upload files at
submission time. Late results refresh the canonical library but cannot reopen a
different sermon, clear newer form input, or replace unsaved editor content
after a status-only or media-only command.

The backend admin cleanup contract exposes
`GET /v1/admin/sermons/audio-cleanups` and
`POST /v1/admin/sermons/audio-cleanups/:cleanupTaskId/retry`. Its responses
expose task id, sermon id, reason, status,
attempt count, safe error summary, and timestamps. They never expose the
private object `storagePath`. Listing requires `sermons:read`; retry requires
`sermons:update`, is idempotent for a succeeded task, and writes an audit log.
An audio replace/remove/delete response reflects the canonical sermon mutation;
a later object deletion failure is represented by the cleanup task instead of
turning that committed mutation into a false API failure.
The Sermons page consumes these endpoints through the typed helper and renders
the cleanup list as an operational card. It defaults to failed tasks, supports
status filtering and refresh, and invalidates only the cleanup query after a
retry so local sermon editor state is not replaced accidentally.

## Documentation Linkage

If sermon SDK behavior changes, update:

- `docs/sdk/sermons.md`
- `docs/api.md`
- `docs/local_sermon_processing.md` when local workflow changes
