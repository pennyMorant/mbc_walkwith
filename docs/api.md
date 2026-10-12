# MBC WalkWith API Contract

Status: active contract
Audience: Flutter app, backend API, admin Web, shared SDK maintainers

This document defines the active API contract for MBC WalkWith. The backend,
admin Web, mobile repositories, and shared API contracts now live in this
repository. Backend services are the source of truth for authorization,
business rules, provider callbacks, payments, event registration, notification
delivery, and audit-sensitive state. Mock or offline data is allowed only behind
explicit local-development boundaries.

Cross-cutting API rules now live in [api_standards.md](api_standards.md).
Use that document as the canonical source for request/response envelopes,
authentication, signing, pagination, idempotency, and webhook verification.

## 1. API Principles

- Use HTTPS and JSON for all app-facing APIs.
- Version every route under `/v1`.
- Keep the Flutter app thin: no AI provider keys, payment secrets, or privileged object storage credentials in the client.
- Support guest access for public landing resources, public Bible reading, sermons, and public church life content.
- Require authentication for giving, receipts, member profile, and admin actions. Public verse notes may be submitted by a member session or by an App-generated `external_user_id`; private local study notes remain App-local unless a future sync feature explicitly changes that boundary.
- Treat prayer and giving as sensitive domains with stricter access control and audit logging.
- Generated AI content should be sourced and reviewable. Sermon AI processing output should remain unpublished until reviewed by an authorized admin.

## 1.1 Current API Scope

当前 API 遵守 `/v1`、统一 envelope、结构化错误、权限和审计规则。范围分为会友端、后台端和 provider callback / diagnostic 端：

```text
Member/Public API:
  public landing resources and CTA actions
  sermons search, series, scripture links
  sermon discussion guides
  life posts
  event registration and check-in
  groups and my groups
  courses and my courses
  serving assignments
  prayer requests
  giving funds
  member profile
  newcomer follow-up
  discipleship journey
  reading plans
  care requests
  notification permission, device tokens, and inbox

Admin API:
  sermon discovery metadata and facets
  sermon discussion guides
  life publishing
  event registration and check-in
  group ministry
  course learning
  serving schedule
  prayer moderation
  giving funds
  member profiles
  newcomer follow-up
  discipleship journey
  reading plans
  pastoral care
  notification jobs
  ministry analytics

Provider callback / diagnostic API:
  scheduled notifications
  notification delivery retries
  analytics snapshot rebuild
  data export generation
```

Routes must not treat App success pages, QR payloads, scheduled jobs, analytics
snapshots, or notification provider callbacks as source of truth. Sermon
discovery currently queries canonical sermon data directly and has no reindex
route or index lifecycle.
Public Web must not hardcode visitor resources such as new-friend actions,
contact links, map links, social media, or App download URLs. Those values are
admin-managed settings under the `public_landing` category and are exposed to
the website through `GET /v1/public/landing?locale=...`.

Supported locale values across public resources are `en`, `es`, `zh-Hans`, and
`zh-Hant`. Client surfaces should default to the browser or device system locale
and fall back to `zh-Hans` when the system locale is unsupported.

## 1.2 Route And Contract Coverage

Backend routes, shared contract modules, SDK docs, and client entry files are
tracked in code by:

```text
packages/api_contracts/src/route-registry.ts
```

Run the local static coverage check after adding, deleting, or moving an API
route:

```sh
bun run check:contracts
```

The check verifies:

- every backend route literal is registered in the contract registry
- registered route files exist
- shared contract files exist
- linked SDK docs exist
- linked App/Admin client files exist
- registered route literals are still present in their owner route files

The registry is the compact source for route ownership. This document explains
the API rules and high-risk behavior; feature payload schemas live in
`packages/api_contracts/src/*.ts` and SDK usage rules live in `docs/sdk/*.md`.

## 2. Monorepo Layout

Use this monorepo layout:

```text
mbc_walkwith/
  apps/
    mobile/                    # Flutter app
    admin_web/                 # Admin web console
    public_web/                # Public landing website
    sermon_studio/             # Local sermon processing workstation UI
    user_web/                  # Future member-facing web app
  docs/
    architecture.md
    api.md
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
        storage/
        security/
    migrations/
    scripts/
    tests/
  packages/
    api_contracts/
    shared_types/
    ui_tokens/
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

The first backend can be a modular monolith. Keep module boundaries strict so the service can be split later if scale or operational needs require it.

## 3. Common Conventions

### 3.1 Base URL

```text
Production: https://api.example.org/v1
Local:      http://localhost:3020/v1
```

The concrete production domain can be decided later.

### 3.2 Headers

Recommended request headers:

```text
Authorization: Bearer <access_token>
Accept-Language: zh-Hans
Content-Type: application/json
X-Client-Platform: ios | android | web | admin
X-Client-Version: 1.0.0
X-Request-Id: <uuid>
X-External-User-Id: ext_<stable_installation_id>
```

`Authorization` is optional for public endpoints and required for private endpoints.
`X-External-User-Id` is an App installation-level external identity used only
for low-sensitivity guest flows such as public verse notes. It must not
authorize giving, annual statements, member profile, admin actions, or private
pastoral data.

### 3.3 IDs

- Database entities should use UUIDs.
- Bible verse IDs can use a stable canonical ID such as `rom.8.28`.
- External provider IDs, such as payment provider transaction IDs, should be stored separately from internal IDs.

### 3.4 Date and Time

- API timestamps should use ISO 8601 UTC strings.
- Display timezone should be handled by the app or user profile.

Example:

```json
{
  "createdAt": "2026-05-10T18:30:00Z"
}
```

### 3.5 Money

Money should be represented in minor units.

```json
{
  "amountCents": 5000,
  "currency": "USD"
}
```

Do not use floating-point numbers for giving amounts.

### 3.6 Success Response Shape

Use a consistent envelope:

```json
{
  "data": {},
  "meta": {}
}
```

For list responses:

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "limit": 20,
      "nextCursor": "eyJpZCI6..."
    }
  }
}
```

### 3.7 Error Response Shape

```json
{
  "error": {
    "code": "auth_required",
    "category": "authentication_required",
    "sourceLayer": "surface",
    "message": "Authentication is required.",
    "recoverable": true,
    "retryable": false,
    "evidence": {
      "requestId": "8e9426d7-1b74-4988-a62e-2f58720f5d31"
    },
    "nextAction": "sign_in",
    "details": {}
  },
  "requestId": "8e9426d7-1b74-4988-a62e-2f58720f5d31"
}
```

Common error codes are stable product contracts, not temporary messages. Shared
rules live in [api_standards.md](api_standards.md). Important examples:

```text
bad_request
auth_required
forbidden
not_found
validation_failed
rate_limited
event_capacity_full
statement_not_ready
checkout_session_failed
sermon_not_found
media_missing
notification_provider_unavailable
internal_error
```

### 3.8 Pagination

Cursor pagination should be the default for growing lists.

Request:

```text
GET /v1/sermons?limit=20&cursor=<cursor>
```

Response:

```json
{
  "data": {
    "items": [],
    "nextCursor": null
  },
  "meta": {
    "pagination": {
      "limit": 20,
      "nextCursor": null
    }
  }
}
```

### 3.9 Status Enums

Common content status values:

```text
draft
processing
needs_review
published
archived
failed
```

Common visibility values:

```text
public
members
group
private
```

### 3.10 Public App Settings

```text
GET /v1/settings/public
```

This endpoint returns admin-managed public settings used by App and Web
surfaces. The App About card consumes these keys when present:

```text
church.name
church.about
church.address
church.mapUrl
church.contactPhone
church.contactEmail
legal.privacyPolicyUrl
legal.termsOfUseUrl
```

Missing optional values are hidden by the App instead of being replaced with
promotional or hard-coded content.

## 4. Auth API

The first version should support simple member login without making public content depend on login.

### 4.1 Member Registration Settings

```text
GET /v1/member/auth/registration-settings
```

Response:

```json
{
  "data": {
    "mode": "open",
    "requireEmailVerification": true,
    "requireAdminApproval": false,
    "helpText": ""
  },
  "meta": {}
}
```

The backend/admin settings own these values. App surfaces must not hard-code
whether registration requires email verification.

### 4.2 Register Member

```text
POST /v1/member/auth/register
```

Request:

```json
{
  "email": "member@example.com",
  "password": "MemberPass123!"
}
```

Response when email verification is required:

```json
{
  "data": {
    "status": "pending_email_verification",
    "codeRequest": {
      "accepted": true,
      "challengeId": "7b56a159-0b47-40f2-8149-f4df89af3026",
      "delivery": "email",
      "maskedEmail": "m***@example.com",
      "expiresInSeconds": 600,
      "resendAfterSeconds": 60
    },
    "registrationSettings": {
      "mode": "open",
      "requireEmailVerification": true,
      "requireAdminApproval": false,
      "helpText": ""
    }
  },
  "meta": {}
}
```

Response when email verification is disabled may be `signed_in` with a member
session, or `pending_approval` when admin review is required.

Direct registration creates `users`, `member_profiles`, and the password
credential in one transaction. An existing email returns
`member_registration_unavailable` without email evidence; public clients must
not infer account existence from a specialized conflict payload.

### 4.3 Login Member

```text
POST /v1/member/auth/login
```

Request:

```json
{
  "email": "member@example.com",
  "password": "MemberPass123!"
}
```

Response:

```json
{
  "data": {
    "accessToken": "eyJ...",
    "expiresInSeconds": 2592000,
    "member": {
      "id": "4d53f9e8-875b-43c8-996e-5a905623bb15",
      "email": "member@example.com",
      "displayName": "Grace Lee",
      "roles": ["member"],
      "appLocale": "en",
      "fellowshipGroupId": null,
      "notificationSettings": {
        "weeklyBulletin": true,
        "sermonPublished": true,
        "lifePostPublished": true,
        "prayerUpdates": false
      }
    }
  },
  "meta": {}
}
```

Unknown emails and member records without a password both return
`member_credentials_invalid` with no email evidence.

### 4.4 Verify Email Code

```text
POST /v1/member/auth/verify-code
```

Request:

```json
{
  "challengeId": "7b56a159-0b47-40f2-8149-f4df89af3026",
  "code": "123456"
}
```

Response:

```json
{
  "data": {
    "accessToken": "eyJ...",
    "expiresInSeconds": 2592000,
    "member": {
      "id": "4d53f9e8-875b-43c8-996e-5a905623bb15",
      "email": "member@example.com",
      "displayName": "Grace Lee",
      "roles": ["member"],
      "appLocale": "en",
      "fellowshipGroupId": null,
      "notificationSettings": {
        "weeklyBulletin": true,
        "sermonPublished": true,
        "lifePostPublished": true,
        "prayerUpdates": false
      }
    }
  },
  "meta": {}
}
```

When the code belongs to a new registration and admin approval is required,
the response can be:

```json
{
  "data": {
    "status": "pending_approval",
    "member": {
      "id": "4d53f9e8-875b-43c8-996e-5a905623bb15",
      "email": "member@example.com",
      "displayName": "Grace Lee",
      "status": "pending",
      "roles": ["member"],
      "appLocale": "en",
      "fellowshipGroupId": null,
      "notificationSettings": {
        "weeklyBulletin": true,
        "sermonPublished": true,
        "lifePostPublished": true,
        "prayerUpdates": false
      }
    },
    "registrationSettings": {
      "mode": "open",
      "requireEmailVerification": true,
      "requireAdminApproval": true,
      "helpText": ""
    }
  },
  "meta": {}
}
```

Verification locks the challenge and consumes it in the same transaction that
creates the member and password credential. Concurrent submissions can complete
only once. A registration-mode rejection does not consume the challenge, and a
verification email delivery failure invalidates its undelivered challenge.

### 4.5 Current Member

```text
GET /v1/member/auth/me
```

Response:

```json
{
  "data": {
    "member": {
      "id": "4d53f9e8-875b-43c8-996e-5a905623bb15",
      "email": "member@example.com",
      "displayName": "Grace Lee",
      "appLocale": "en",
      "roles": ["member"],
      "fellowshipGroupId": null,
      "notificationSettings": {
        "weeklyBulletin": true,
        "sermonPublished": true,
        "lifePostPublished": true,
        "prayerUpdates": false
      }
    }
  },
  "meta": {}
}
```

### 4.6 Update Current Member Profile

```text
PATCH /v1/member/profile
```

Auth: member required.

Writable fields are limited to self-editable profile data:

```json
{
  "displayName": "Grace Lee",
  "phone": "+1 555 0144",
  "address": "Example member address",
  "faithStartYear": 2008,
  "baptizedYear": 2011,
  "joinedChurchAt": "2022-09-04",
  "emergencyContactName": "Care Lead",
  "emergencyContactPhone": "+1 555 0155",
  "appLocale": "zh-Hans"
}
```

The endpoint never accepts roles, status, finance permissions, group ownership,
or admin-only notes. Successful updates are audited.

### 4.7 Logout

```text
POST /v1/member/auth/logout
```

Response:

```json
{
  "data": {
    "accepted": true
  },
  "meta": {}
}
```

### 4.8 Member Notifications

Member notification routes require member authentication and return the
server-backed notification inbox. Push delivery remains a side effect; these
routes read and update the canonical per-member inbox item state.

Public App device routes do not require authentication. They register or revoke
a device token for public push only and do not create server-backed inbox items:

```text
PUT  /v1/app/devices/push-token
POST /v1/app/devices/push-token/revoke
```

```text
GET   /v1/member/notifications?limit=50
PATCH /v1/member/notifications/:notificationId/read
PATCH /v1/member/notifications/read-all
PATCH /v1/member/notifications/archive-all
PATCH /v1/member/notifications/:notificationId/archive
```

List response:

```json
{
  "data": {
    "items": [
      {
        "id": "member-notification-1",
        "messageId": "notification-message-1",
        "type": "life_post_published",
        "title": "Members meal",
        "body": "Dinner details for church members.",
        "route": "/life/posts/life-post-1",
        "data": {
          "lifePostId": "life-post-1",
          "targetType": "life_post",
          "targetId": "life-post-1"
        },
        "readAt": null,
        "archivedAt": null,
        "createdAt": "2026-06-24T16:00:00.000Z"
      }
    ],
    "unreadCount": 1
  },
  "meta": {}
}
```

Single item mutations return `{ "item": ... }`. `read-all` returns
`{ "updatedCount": 1 }`. The response never includes another member's `userId`.

### 4.9 Admin Member Profiles

```text
GET   /v1/admin/members
GET   /v1/admin/members/:memberId
POST  /v1/admin/members
PATCH /v1/admin/members/:memberId
```

Auth: admin `users:read` for list/detail and `users:manage` for mutations.

The list response is intentionally minimal: it contains member identity,
status, roles, locale, fellowship group, and timestamps. It does not contain
phone, address, faith/baptism years, joined-church date, emergency contacts, or
notification preferences. Those fields are returned only by the UUID-addressed
detail route. List and detail reads are audited without storing raw search text
or personal field values.

There is no ordinary admin member delete route. Operators retain records and
disable access by setting status to `inactive` or `blocked`, preserving giving,
audit, notification, Bible-note, and ministry history.

## 5. Bible and Study API

Public Bible reading endpoints should work without login. Personal notes and highlights require login.

Use `translationId` for Bible text selection. `Accept-Language` and `language` are still useful for UI copy, AI response language, and translated church content, but Bible verse text should come from an explicit translation.

Current public-domain seed translations:

```text
web   World English Bible, en
cuvs  Chinese Union Version, Simplified, zh-Hans
cuvt  Chinese Union Version, Traditional, zh-Hant
```

### 5.1 List Bible Books

```text
GET /v1/bible/books?translationId=cuvs
```

Response:

```json
{
  "data": [
    {
      "id": "rom",
      "name": "罗马书",
      "englishName": "Romans",
      "abbreviation": "罗",
      "testament": "new",
      "category": "pauline_letters",
      "chapterCount": 16,
      "sortOrder": 45
    }
  ],
  "meta": {}
}
```

### 5.2 Get Chapter

```text
GET /v1/bible/books/:bookId/chapters/:chapter?translationId=cuvs
```

Response:

```json
{
  "data": {
    "book": {
      "id": "rom",
      "name": "罗马书",
      "englishName": "Romans"
    },
    "translation": {
      "id": "cuvs",
      "name": "新标点和合本",
      "abbreviation": "和合本"
    },
    "chapter": 8,
    "verses": [
      {
        "id": "rom.8.28",
        "verse": 28,
        "text": "我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。",
        "hasLexicon": true,
        "hasRelatedSermons": true
      }
    ]
  },
  "meta": {}
}
```

### 5.3 Get Verse

```text
GET /v1/bible/verses/:verseId?translationId=cuvs
```

### 5.4 Member AI Study Help

```text
POST /v1/member/ai/study
```

Auth: member required. The app sends only the selected reference, question, and explicit context. Do not include private notes, prayer requests, giving records, care records, or payment data. Both member tasks require a non-empty question. `bible_study_help` additionally requires a non-empty reference and `resourceType=bible_passage`; `sermon_qa` requires `resourceType=sermon`; both require a stable `resourceId`.

Request:

```json
{
  "task": "bible_study_help",
  "locale": "zh-Hans",
  "input": {
    "reference": "Romans 8:28",
    "question": "这里的万事互相效力是什么意思？"
  },
  "resource": {
    "resourceType": "bible_passage",
    "resourceId": "rom.8.28"
  }
}
```

Response:

```json
{
  "data": {
    "task": "bible_study_help",
    "markdown": "## 学习辅助\n\n...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "safetyNotice": "AI 学习辅助仅供反思，不取代牧养关怀或教会教导。",
    "usage": {
      "inputTokens": 100,
      "outputTokens": 80,
      "totalTokens": 180
    },
    "latencyMs": 1200
  }
}
```

### 5.5 Original-Language Word Insight

```text
GET /v1/study/words/:wordId?language=zh-Hans
```

Response:

```json
{
  "data": {
    "id": "agape",
    "sourceLanguage": "greek",
    "lemma": "ἀγάπη",
    "transliteration": "agape",
    "gloss": "爱",
    "shortExplanation": "常用于表达出于意志、盟约和舍己性质的爱。",
    "examples": [
      {
        "verseId": "john.3.16",
        "reference": "约翰福音 3:16"
      }
    ]
  },
  "meta": {}
}
```

### 5.6 Related Sermons for Verse

```text
GET /v1/study/verses/:verseId/related-sermons?limit=10
```

### 5.7 Notes, Highlights, and Bookmarks

```text
GET    /v1/study/annotations?bookId=rom&chapter=8
PUT    /v1/study/notes/:verseId
DELETE /v1/study/notes/:verseId
PUT    /v1/study/bookmarks/:verseId
DELETE /v1/study/bookmarks/:verseId
```

Auth: required.

The mobile app stores notes, highlights, and bookmarks locally first, then syncs
dirty rows through the sync queue. The backend contract should be idempotent by
`verseId` so repeated mobile retries do not create duplicates.

Get annotations response:

```json
{
  "data": [
    {
      "verseId": "rom.8.28",
      "noteText": "这里可以和创世记 50:20 一起读。",
      "highlightColor": "yellow",
      "isBookmarked": true,
      "updatedAt": "2026-05-11T16:20:00Z"
    }
  ],
  "meta": {}
}
```

Upsert note/highlight request:

```json
{
  "verseId": "rom.8.28",
  "noteText": "这里可以和创世记 50:20 一起读。",
  "highlightColor": "yellow"
}
```

`highlightColor` may be `null` to remove a highlight. If both `noteText` is
empty and `highlightColor` is `null`, the backend may treat it as a delete.

### 5.8 Bible Knowledge Entities

The first mobile version ships people and places as local multilingual JSON.
Backend APIs should use the same conceptual model so the app can later move this
content into the admin CMS without changing the reader UI.

```text
GET /v1/study/entities/people?translationId=cuvs&locale=zh-Hans
GET /v1/study/entities/places?translationId=cuvs&locale=zh-Hans
GET /v1/study/entities/people/:entityId?locale=zh-Hans
GET /v1/study/entities/places/:entityId?locale=zh-Hans
```

List response:

```json
{
  "data": [
    {
      "id": "bethlehem",
      "type": "place",
      "name": "伯利恒",
      "category": "犹太地区的城镇",
      "summary": "伯利恒把耶稣的降生与大卫之约的盼望连在一起。",
      "sections": [
        {
          "type": "context",
          "title": "经文脉络",
          "body": "伯利恒出现在耶稣降生叙事中时，重点不只是地理位置。"
        }
      ],
      "aliases": ["犹太的伯利恒", "伯利恒"],
      "verseAliases": {
        "mat.2.1": ["伯利恒"]
      }
    }
  ],
  "meta": {
    "translationId": "cuvs",
    "locale": "zh-Hans"
  }
}
```

The client detects chapter-level people and places locally by matching
translation-specific aliases against the current chapter. Repeated names are
deduplicated to one chapter-level entry to avoid disrupting reading.

### 5.9 Bible Verse Notes

Bible verse notes are public reflections attached to a local Bible verse ID.
The backend stores only the reference and reflection, not the Bible text.

```http
GET /v1/bible/verse-notes?verseId=rom.8.28
POST /v1/bible/verse-notes
PATCH /v1/bible/verse-notes/:noteId
DELETE /v1/bible/verse-notes/:noteId
```

Auth:

- `Authorization: Bearer <member_token>` publishes as a member.
- `X-External-User-Id: ext_...` publishes as an external App installation.
- If neither identity is present, write requests fail.

Create payload:

```json
{
  "verseId": "rom.8.28",
  "bookId": "rom",
  "chapter": 8,
  "verse": 28,
  "content": "This verse reminds me to trust God.",
  "externalDisplayName": "Guest"
}
```

Public list response returns only `published` notes and marks `isMine` when the
request identity owns a note.

Admin moderation:

```http
GET   /v1/admin/bible/verse-notes
PATCH /v1/admin/bible/verse-notes/:noteId/hide
PATCH /v1/admin/bible/verse-notes/:noteId/restore
```

Admin hide/restore requires `bible_notes:moderate` and writes audit logs.

### 5.10 Reading Plans

Reading plans are backend-owned plan templates, day references, assignments,
and completion progress. The backend returns scripture references only:
`bookId`, `chapter`, `startVerse`, `endVerse`, and optional `referenceLabel`.
It must not return canonical Bible verse text.

Public/member routes:

```http
GET   /v1/reading-plans
GET   /v1/reading-plans/:planId/days
POST  /v1/reading-plans/:planId/assignments
GET   /v1/me/reading-plans
GET   /v1/me/reading-plans/:assignmentId
PATCH /v1/reading-plans/assignments/:assignmentId/status
PATCH /v1/reading-plans/assignments/:assignmentId/days/:dayId
```

Auth:

- Published public plans can be browsed without login.
- `X-External-User-Id: ext_...` may self-assign and store low-sensitivity
  progress for guest App installations.
- Member-only plans require a member token.
- `GET /v1/me/reading-plans` accepts `scope=active|history|all`, `limit`, and
  cursor offset; the response returns `nextCursor` when another page exists.
- `GET /v1/me/reading-plans/:assignmentId` returns `canRestart`; it is true only
  while the template is published and the user has no open attempt for it.
- Day progress updates accept only `status` and optional `note`. The backend
  owns `completedAt` and assignment `endedAt`.
- Completed and abandoned assignments are immutable history. Rejoining the
  same plan creates the next attempt; an existing open attempt remains
  idempotent under duplicate or concurrent requests.

Admin routes:

```http
GET   /v1/admin/reading-plans
POST  /v1/admin/reading-plans
PATCH /v1/admin/reading-plans/:planId
GET   /v1/admin/reading-plans/:planId/days
POST  /v1/admin/reading-plans/:planId/days
GET   /v1/admin/reading-plans/assignments
POST  /v1/admin/reading-plans/assignments
```

Admin management requires `reading_plans:read` or `reading_plans:manage`.
Plan creation, day upsert, and admin assignment write audit logs.
New plans must start as `draft`. Publishing requires one configured day for
every number in `1..durationDays`; otherwise the API returns
`409 reading_plan_publish_incomplete`. A day beyond the configured duration
returns `400 reading_plan_day_out_of_range`. Published plans must move to
`paused` before content or day edits, while archived plans must return to
`draft`; invalid transitions or locked edits return
`409 reading_plan_transition_invalid`.
After the first assignment, days, duration, visibility, and locale are locked;
attempted changes return `409 reading_plan_structure_locked`. Day progress is
accepted only while the plan is published and the assignment is not paused,
completed, or abandoned; otherwise it returns
`409 reading_plan_progress_closed`.
Admin member assignments require an existing member id; a missing target
returns `404 reading_plan_assignment_user_not_found`. Assignment creation is
idempotent by `(planId, userType, userId)` and concurrent duplicate requests
return the same canonical assignment.

## 6. Sermons API

Public sermon browsing and playback should usually work without login unless the church chooses to restrict some files.

### 6.1 List Sermons

```text
GET /v1/sermons?limit=20&cursor=&speaker=&series=&topic=&bookId=&query=&from=&to=
```

The mobile app expects this endpoint through `ApiClient` and caches the returned
rows into local Drift tables. If the backend is unavailable, the app falls back
to the cached `local_sermons`, `local_sermon_outlines`, and
`local_sermon_references` rows.

Public sermon list, recommendation, and detail endpoints return only published
records using the public sermon projection. Admin-only `reviewMarkdown` and
`processingMetadata`, and the Admin concurrency field `revision`, are never
included. `sermonDate` is a strict
`YYYY-MM-DD` calendar date.

`from` and `to` are optional ISO 8601 UTC timestamps. The mobile Sermons tab
uses them to browse one selected month at a time while keeping `query` as an
optional search filter inside that period.

`query` searches title, speaker, series, topics, primary reference, summary,
transcript, and structured Scripture reference text. `speaker`, `series`, and
`topic` are exact discovery filters. Public queries always force published
visibility at the backend repository boundary.

`GET /v1/sermons/recommendations` accepts `bookId`, optional `chapter`, optional
`verseId`, and `limit`. When `chapter` is present, results must contain a
structured reference from that chapter; an exact `verseId` ranks first. A
different chapter from the same book is not a match. Book-wide matching is
allowed only when `chapter` is omitted.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "c17d7bc4-35ec-41fa-a7ff-08103fe1f722",
        "title": "在苦难中的盼望",
        "speaker": "Pastor Name",
        "sermonDate": "2026-05-03",
        "series": "罗马书系列",
        "topics": ["盼望", "苦难"],
        "primaryReference": "罗马书 8:18-30",
        "durationSeconds": 2380,
        "summary": "本篇讲道讨论信徒在苦难中如何理解神的保守与盼望。",
        "thumbnailUrl": null,
        "outline": [],
        "references": []
      }
    ],
    "nextCursor": null
  },
  "meta": {
    "pagination": {
      "limit": 20,
      "nextCursor": null
    }
  }
}
```

### 6.2 Sermon Discovery Facets

```text
GET /v1/sermons/facets
```

Returns distinct speakers, series, and topics from published sermons only.
Draft-only metadata must not appear in the public filter catalog.

```json
{
  "data": {
    "speakers": ["Pastor Name"],
    "series": ["罗马书系列"],
    "topics": ["盼望", "苦难"]
  },
  "meta": {}
}
```

### 6.3 Get Sermon

```text
GET /v1/sermons/:sermonId
```

Response:

```json
{
  "data": {
    "id": "c17d7bc4-35ec-41fa-a7ff-08103fe1f722",
    "title": "在苦难中的盼望",
    "speaker": "Pastor Name",
    "sermonDate": "2026-05-03",
    "series": "罗马书系列",
    "primaryReference": "罗马书 8:18-30",
    "durationSeconds": 2380,
    "summary": "本篇讲道讨论信徒在苦难中如何理解神的保守与盼望。",
    "thumbnailUrl": null,
    "outline": [
      {
        "title": "现在的苦楚",
        "startSeconds": 120
      },
      {
        "title": "将来的荣耀",
        "startSeconds": 760
      }
    ],
    "references": [
      {
        "verseId": "rom.8.28",
        "reference": "罗马书 8:28",
        "startSeconds": 1320
      }
    ],
    "status": "published"
  },
  "meta": {}
}
```

### 6.4 Stream Sermon Audio

```text
GET /v1/sermons/:sermonId/audio
```

This endpoint streams church-uploaded sermon audio. Clients may pass an HTTP
`Range` header for playback seeking.

Response:

```text
200 OK or 206 Partial Content
```

For public MP3 files, `expiresAt` can be null. For private files, use short-lived signed URLs.

### 6.5 Get Transcript

```text
GET /v1/sermons/:sermonId/transcript
```

Response:

```json
{
  "data": {
    "sermonId": "c17d7bc4-35ec-41fa-a7ff-08103fe1f722",
    "language": "zh-Hans",
    "segments": [
      {
        "startSeconds": 120,
        "endSeconds": 180,
        "text": "今天我们继续看罗马书第八章。"
      }
    ]
  },
  "meta": {}
}
```

### 6.6 Playback Progress

```text
GET  /v1/sermons/:sermonId/progress
POST /v1/sermons/:sermonId/progress
```

Identity is required through either a member bearer token or
`X-External-User-Id`. When both are present and the token is valid, the member
identity owns the record. External installation IDs provide same-install sync;
member identity provides cross-device sync after sign-in. Missing identity
returns `sermon_progress_identity_required`.

`GET` returns the current viewer's record or `null`. `POST` performs an
idempotent upsert keyed by sermon and viewer. Only published sermons are
accepted. The backend bounds position to the canonical sermon duration and
derives completion when playback reaches the final 15 seconds, so clients do
not own completion truth.

Request:

```json
{
  "positionSeconds": 420,
  "completed": false
}
```

Response:

```json
{
  "data": {
    "sermonId": "c17d7bc4-35ec-41fa-a7ff-08103fe1f722",
    "positionSeconds": 420,
    "completed": false,
    "completedAt": null,
    "updatedAt": "2026-07-12T18:00:00.000Z"
  },
  "meta": {}
}
```

### 6.7 Sermon Discussion Guides

Discussion guides are sermon-linked application material for groups, courses,
discipleship paths, or personal reflection. They do not copy sermon transcript,
audio, outline, or sermon source content.

Public/App routes:

```http
GET  /v1/sermons/:sermonId/discussion-guide
POST /v1/sermon-discussion-guides/:guideId/responses
```

Published public guides are returned only when the sermon itself is published.
The public GET response uses the public guide projection and does not include
Admin-only `generatedMetadata`. Projection happens in the Backend service before
the response envelope is created; the Admin routes continue to use the complete
guide schema. The public projection fixes `status` to `published`,
`audienceType` to `public`, and `audienceId` to null.
Responses default to `private` and can be created by a member session or by
`X-External-User-Id` for guest App installations. The current App response
route accepts only published `public` guides and private responses; knowing a
non-public guide UUID does not grant access.

Admin routes:

```http
GET   /v1/admin/sermon-discussion-guides
POST  /v1/admin/sermon-discussion-guides
PATCH /v1/admin/sermon-discussion-guides/:guideId
GET   /v1/admin/sermon-discussion-guides/:guideId/responses
PATCH /v1/admin/sermon-discussion-guides/responses/:responseId/hide
```

Admin management requires `sermon_guides:read` or `sermon_guides:manage`.
The Admin response list is server-forced to `shared_with_group`; query
parameters cannot widen it to private responses. Only a shared response can be
hidden. Private response content is not returned or mutated through Admin
moderation routes. Publish and valid hide operations write audit logs; hide
audit payloads store `hasContent`, not the raw response body.

Guide lifecycle is backend-owned: create accepts only `draft` or `review`;
first publication requires `review`, at least one question/action/prayer item,
and a published sermon. Published content must return to `review` before
editing, while archived content must return to `draft`. Public audiences must
have a null `audienceId`; scoped audiences require a non-empty target id. Empty
prayer prompt strings are rejected at the shared contract boundary.
On create, audience change, or publication, scoped group, course, and
discipleship targets must exist. A missing target returns
`404 sermon_discussion_audience_target_not_found`. This reference check does
not expose a scoped App route or grant a member permission to read the guide.
If a previously assigned target is removed, the guide may still move to review
or archived so administrators can recover the lifecycle.
Only one public guide may be published for a sermon. A second publication
returns `409 sermon_discussion_public_guide_conflict`; moving the current guide
to review or archived releases the public slot.
Guide questions, action steps, and prayer prompts are each limited to 50 items.
Question ids and action-step ids must be unique within their respective lists;
a provided response `questionId` must be non-empty and belong to the guide.
App clients treat a malformed public guide or response `data` envelope as a
contract failure and show a retry state; only the documented not-found response
means that no public guide is available.

## 7. Church Life API

### 7.1 List Life Posts

```text
GET /v1/life/posts?limit=20&visibility=&type=&query=&from=&to=
```

Member-aware lists use the same query contract:

```text
GET /v1/member/life/posts?limit=20&type=&query=&from=&to=
```

`from` and `to` are optional ISO 8601 UTC timestamps. Public and member life
lists return posts that touch the requested half-open range `[from, to)`.
The mobile Life tab uses the selected week for the weekly tab and the selected
month for the other life tabs. The weekly bulletin hero is loaded separately
from the latest visible life posts, so changing a tab period does not hide the
latest Sunday bulletin.

Response:

```json
{
  "data": [
    {
      "id": "d027d3e8-44d4-4566-8cd4-bc7c30a5cc9e",
      "type": "announcement",
      "title": "本周主日崇拜安排",
      "body": "主日崇拜上午 10:00 开始。",
      "meta": "周日 10:00 AM",
      "iconName": "church",
      "startsAt": "2026-05-10T17:00:00Z",
      "endsAt": null,
      "visibility": "public",
      "imageUrl": null,
      "displayWeight": 50,
      "updatedAt": "2026-05-09T17:00:00Z"
    }
  ]
}
```

Life post lists are ordered by backend display strategy: higher
`displayWeight` first, then scheduled time, then update time. `displayWeight`
is an admin-owned ordering field, not a user-facing App label.

Post types:

```text
announcement
event
fellowship
service_opportunity
bulletin_item
```

### 7.2 Get Life Post

```text
GET /v1/life/posts/:postId
```

Only public posts are returned. Private, member-only, group-only, or unpublished
posts return 404 from the public endpoint.

### 7.3 Get Life Image

```text
GET /v1/life/images/:fileName
```

Returns an uploaded public life post image. The `imageUrl` field on a life post
points to this endpoint when the church uploads an image through the admin
console.

### 7.4 Current Bulletin

```text
GET /v1/life/bulletins/current
```

Response:

```json
{
  "data": {
    "weekOf": "2026-05-10",
    "sections": [
      {
        "title": "本周聚会",
        "items": [
          {
            "type": "event",
            "title": "主日崇拜",
            "timeText": "周日 10:00 AM",
            "location": "Main Sanctuary"
          }
        ]
      }
    ]
  },
  "meta": {}
}
```

### 7.5 Member Life, Events, Groups, Courses, and Serving

```text
GET   /v1/life/posts
GET   /v1/life/posts/:postId
GET   /v1/member/life/posts
GET   /v1/member/life/posts/:postId
POST  /v1/member/life/posts/:postId/read
POST  /v1/member/life/posts/:postId/register
PATCH /v1/member/life/posts/:postId/registration
POST  /v1/member/life/posts/:postId/registration/cancel
POST  /v1/member/life/posts/:postId/registration/check-in
GET   /v1/groups
GET   /v1/groups/:groupId
GET   /v1/me/groups
POST  /v1/groups/:groupId/applications
PATCH /v1/groups/:groupId/applications/:applicationId
GET   /v1/courses
GET   /v1/courses/:courseId
POST  /v1/courses/:courseId/enrollments
GET   /v1/me/courses
GET   /v1/me/serving-assignments
POST  /v1/serving-assignments/:assignmentId/confirm
POST  /v1/serving-assignments/:assignmentId/leave-request
GET   /v1/me/serving-availability
POST  /v1/me/serving-availability
POST  /v1/serving-assignments/:assignmentId/check-in
```

Member life post list/detail responses include backend-owned `isRead` and
`readAt`. `POST /v1/member/life/posts/:postId/read` marks the current content
revision as read for the signed-in member. The backend compares `readAt` with
the post `updatedAt`; admin edits make the item unread again until the member
opens it.

Event registration, cancellation, update, and check-in require member login.
Check-in writes canonical attendance fields on the backend and returns the
fresh life post with `registrationSummary`.
Group list/detail routes accept optional member identity: guests only receive
active `public` groups, while members also receive allowed member/group scopes
and their application/membership state. `/v1/me/groups` is the canonical Mine
membership read. Apply/withdraw routes require member login. Submission and
approval serialize capacity decisions, and only the applicant can withdraw a
submitted application.
Group material assignments and attendance are currently Admin API routes; they
store references and attendance state only, not copied reading-plan, sermon, or
course content. Non-manual material references are validated through the source
feature repository. Attendance writes submit `memberUserId` without a display
name; the backend derives the current member display name and rechecks active or
leader membership before persisting the record.
Course list/detail may include signed-in member state. Enrollment requires
member login and returns canonical enrollment/progress state.
Serving assignment reads and actions require member login. The backend verifies
that the assignment belongs to the signed-in member before status changes.
Serving availability and check-in records are backend-owned state; audit
payloads store `hasNote`, not raw notes.

## 8. Prayer API

Prayer is sensitive. Default visibility should be `private`.

### 8.1 List Prayer Requests

```text
GET /v1/prayer-requests?limit=20&cursor=&visibility=
```

Auth: public. This route returns approved public prayer requests only. Private,
member-only, and group prayer requests are read through member or admin routes.

### 8.2 Create Prayer Request

```text
POST /v1/prayer-requests
```

Request:

```json
{
  "title": "为家人健康代祷",
  "body": "请小组为我的家人健康祷告。",
  "visibility": "group",
  "groupId": "0aeb93fe-8a03-4d9a-9832-0ccca478f2af"
}
```

Response:

```json
{
  "data": {
    "id": "a5bc6a6d-fec5-4c9e-9ccb-ec4190fd4970",
    "title": "为家人健康代祷",
    "body": "请小组为我的家人健康祷告。",
    "visibility": "group",
    "status": "active",
    "createdAt": "2026-05-10T18:30:00Z"
  },
  "meta": {}
}
```

### 8.3 Update or Delete Prayer Request

```text
PATCH  /v1/prayer-requests/:requestId
DELETE /v1/prayer-requests/:requestId
```

Only the author or an authorized pastoral/admin role should update visibility or remove a prayer request.

## 9. Pastoral Care API

Care requests are member-private and pastoral-sensitive. Member routes return
only summary fields. Internal notes and follow-up records are admin-only.

### 9.1 List My Care Requests

```text
GET /v1/me/care-requests
```

Auth: member required.

Response:

```json
{
  "data": {
    "items": [
      {
        "id": "3acb6d50-0d2b-4b28-99e0-4aa9d457a7c1",
        "userId": "member-1",
        "memberDisplayName": "Grace Lee",
        "memberEmail": "grace@example.com",
        "title": "Pastoral visit",
        "body": "Please ask a pastor to call me this week.",
        "status": "assigned",
        "privacyLevel": "pastoral_only",
        "assigneeName": "Pastor Lee",
        "nextFollowUpAt": "2026-07-10T18:00:00.000Z",
        "createdAt": "2026-06-20T18:00:00.000Z",
        "updatedAt": "2026-06-21T18:00:00.000Z"
      }
    ]
  },
  "meta": {}
}
```

### 9.2 Create Care Request

```text
POST /v1/me/care-requests
```

Auth: member required.

Request:

```json
{
  "title": "Pastoral visit",
  "body": "Please ask a pastor to call me this week.",
  "privacyLevel": "pastoral_only"
}
```

The backend records `care.request.submit` audit metadata with `hasBody`; it
must not write the raw body into audit payloads.

### 9.3 Get My Care Request

```text
GET /v1/me/care-requests/:careRequestId
```

Auth: member required. The backend verifies ownership and returns
`care_privacy_denied` if a member tries to access another member's request.

## 9.4 Newcomer Follow-up API

Newcomer follow-up is guest/public at submission time and admin-only after
submission. It does not create a member account and does not expose admin
follow-up notes to normal App member profile APIs.

### 9.4.1 Submit Newcomer Profile

```text
POST /v1/newcomers
```

Auth: public.

Request:

```json
{
  "externalUserId": "ext_installation_123",
  "displayName": "New Friend",
  "email": "friend@example.com",
  "phone": "626-555-0100",
  "preferredLanguage": "zh-Hans",
  "source": "app",
  "interest": "I would like someone to contact me about Sunday service."
}
```

The backend records only safe audit metadata, such as contact presence and
source. It must not write the raw interest text into audit payloads.

The response uses the public `newcomerSubmission` projection and contains only
`id`, `displayName`, `status`, and `createdAt`. Contact details, interest,
installation identity, assignment, member links, and conversion fields remain
Admin-only.

Provide at least one of `externalUserId`, `email`, or `phone`. App clients
send installation identity through `X-External-User-Id`; when a body value is
also supplied, it must match the `ext_` header value.

### 9.4.2 Admin Newcomer Queue

```text
GET    /v1/admin/newcomers
GET    /v1/admin/newcomers/:newcomerId
PATCH  /v1/admin/newcomers/:newcomerId
GET    /v1/admin/newcomers/:newcomerId/follow-ups
POST   /v1/admin/newcomers/:newcomerId/follow-ups
```

Auth: admin with `newcomers:read` or `newcomers:manage`.

Admin can assign a follow-up owner, update status, link a member user id, set
the next follow-up time, and create follow-up notes. Follow-up note bodies are
admin-only and audit payloads store only `hasNote`.

Newcomer PATCH requests must contain at least one field. Non-completed follow-up
records require `plannedAt` and reject `completedAt`; completed records receive
their canonical completion time from the backend when one is omitted.

## 9.5 Discipleship Journey API

Discipleship journey is an orchestration layer. It stores paths, stages, task
references, assignments, and task progress. It does not copy Bible text,
sermon content, course materials, group membership, or serving schedules.

### 9.5.1 List My Journey Assignments

```text
GET /v1/me/discipleship
```

Auth: member required.

Response items use the member discipleship assignment projection. It excludes
internal source links, admin assignee IDs, and progress notes. The backend includes
`taskTotalCount` and `completedTaskCount` so clients do not derive journey task
totals from progress rows.

### 9.5.2 Admin Journey Management

```text
GET    /v1/admin/discipleship/journeys
POST   /v1/admin/discipleship/journeys
PATCH  /v1/admin/discipleship/journeys/:journeyId
GET    /v1/admin/discipleship/journeys/:journeyId/stages
POST   /v1/admin/discipleship/journeys/:journeyId/stages
GET    /v1/admin/discipleship/journeys/:journeyId/tasks
POST   /v1/admin/discipleship/journeys/:journeyId/tasks
GET    /v1/admin/discipleship/assignments
POST   /v1/admin/discipleship/assignments
PATCH  /v1/admin/discipleship/assignments/:assignmentId/tasks/:taskId
```

Auth: admin with `discipleship:read` or `discipleship:manage`.

Task progress writes contain status and note only. `completedAt` is generated or
cleared by the backend from the submitted status and is never client-owned.

Task references are validated through the owning feature repository. Group
application references use `groupId:applicationId`; event registrations use
`lifePostId:registrationId`. Member assignments require
an existing member user id and no source id; newcomer assignments require an
existing newcomer source id.

Task references are stored as `referenceType` and `referenceId`; the owner
feature remains responsible for the canonical target state.

Stage and task list responses are ordered by `sortOrder`, then creation time,
so Admin Web can safely rebuild the journey structure after reload.

Assignment list and create responses use the same summary fields as the member
read side: `taskTotalCount`, `completedTaskCount`, and canonical `progress`
rows.

Task progress updates accept a task status and optional note. The backend owns
`completedAt`: it sets a completion time for `completed` and clears the default
completion time when the task moves back to another status.

## 10. Giving API

Giving is high-sensitivity. The app should never handle raw card details. Transactions should be finalized only from verified payment provider webhooks.
Annual statement downloads use the statement's exact donor identity and all
confirmed gifts for that year. They fail with `statement_stale` after relevant
giving records change and with `statement_currency_mismatch` for mixed currency;
the backend never silently truncates statement details to an admin list limit.

### 10.1 Create Checkout

```text
POST /v1/member/giving/checkout-sessions
```

Auth: required.

Request:

```json
{
  "amountCents": 5000,
  "currency": "USD",
  "category": "offering",
  "donorName": "Grace Lee",
  "donorEmail": "grace@example.com"
}
```

Response:

```json
{
  "data": {
    "provider": "stripe",
    "checkoutSessionId": "cs_...",
    "checkoutUrl": "https://checkout.stripe.com/...",
    "transactionId": "9ec38b39-828e-49c6-a421-05cf9596ddec"
  },
  "meta": {}
}
```

The client opens `checkoutUrl` externally. Final transaction state is recorded only after the verified Stripe webhook.

```text
POST /v1/webhooks/giving/stripe
```

The webhook route verifies the Stripe signature when live Stripe secrets are configured.
It also requires stable provider event/session identities, checks checkout amount
and currency against the canonical transaction, retries `received`/`failed`
events idempotently, and prevents late events from reversing terminal state.
It records provider events idempotently and handles:

- `checkout.session.completed`: marks a transaction succeeded only when `payment_status` is `paid`; otherwise it remains pending.
- `checkout.session.async_payment_succeeded`: marks ACH or other asynchronous payments succeeded.
- `checkout.session.async_payment_failed` and `checkout.session.expired`: marks the pending transaction failed.
- `charge.succeeded` and `charge.updated`: records Stripe fees, net amount, payout id, available date, and reconciliation status when balance transaction data is available.
- `charge.refunded`: marks the matched transaction refunded.
- `charge.dispute.created`, `charge.dispute.updated`, and `charge.dispute.closed`: records dispute id, dispute status, disputed amount, and moves the transaction into finance review when needed.

### 10.2 Giving History

```text
GET /v1/member/giving/transactions?year=2026&limit=50&cursor=
```

Response:

```json
{
  "data": [
    {
      "id": "790d3070-c78f-4c7d-9f35-1408fb87edc4",
      "amountCents": 5000,
      "currency": "USD",
      "category": "offering",
      "status": "succeeded",
      "givenAt": "2026-05-10T18:30:00Z"
    }
  ],
  "meta": {
    "yearTotalCents": 5000,
    "currency": "USD",
    "pagination": {
      "limit": 50,
      "nextCursor": null
    }
  }
}
```

### 10.3 Transaction Detail

```text
GET /v1/member/giving/transactions
```

Member transaction detail is intentionally not exposed as a separate route in the
current contract. Use the paginated transaction list for member history. Admin
transaction detail lives under `/v1/admin/giving/transactions/:transactionId`.

### 10.4 Annual Statements

```text
GET /v1/member/giving/statements
GET /v1/member/giving/statements/:year
GET /v1/member/giving/statements/:year/download
```

`GET /v1/member/giving/statements/:year` response:

```json
{
  "data": {
    "year": 2026,
    "status": "ready",
    "totalAmountCents": 125000,
    "currency": "USD",
    "downloadUrl": "https://signed-storage.example.org/statement.pdf",
    "expiresAt": "2026-05-10T19:30:00Z"
  },
  "meta": {}
}
```

Annual statement PDFs should be generated and served from private object storage through signed URLs.

### 10.5 Payment Webhooks

Payment webhooks are backend-only and should not be called by the app.

```text
POST /v1/webhooks/giving/stripe
```

Rules:

- Verify provider signatures.
- Make webhook processing idempotent.
- Record provider event payloads for audit/debugging.
- Do not mark a transaction as succeeded from app-side callbacks alone.

## 11. Admin API

Admin routes require admin authentication and role-based authorization. All
admin requests except login must include:

```text
Authorization: Bearer <admin_access_token>
```

Admin roles:

```text
content_editor
pastor
finance
admin
owner
```

Finance permission should be separate from content publishing permission.

### 11.1 Admin Auth

First implementation status: development login backed by environment
variables. Production should replace this with database-backed admin users,
password hashing, MFA or managed identity, session revocation, and audit logs.
Keep the endpoint shape stable for the admin web.

```text
POST /v1/admin/auth/login
GET  /v1/admin/auth/me
```

Login request:

```json
{
  "email": "admin@mbc.local",
  "password": "password123"
}
```

Login response:

```json
{
  "data": {
    "accessToken": "<jwt>",
    "expiresInSeconds": 28800,
    "user": {
      "id": "dev-admin",
      "email": "admin@mbc.local",
      "name": "Development Admin",
      "role": "owner"
    }
  },
  "meta": {}
}
```

Current session response:

```json
{
  "data": {
    "user": {
      "id": "dev-admin",
      "email": "admin@mbc.local",
      "name": "Development Admin",
      "role": "owner"
    }
  },
  "meta": {}
}
```

### 11.2 Dashboard Analytics

```text
GET /v1/admin/dashboard
```

Requires `dashboard:read`. The backend uses the authenticated admin role to decide which
canonical feature services may be queried. A finance role receives giving metrics only;
metrics, job health, and drill-down paths for unauthorized features are omitted.

Response data is validated by `adminDashboardResponseSchema` and includes:

- `snapshot`: `fresh` or `stale`, successful generation time, latest attempt time, and
  optional structured error code.
- `metrics`: exact repository count/summary values with a stable localization key,
  display format, tone, and permitted drill-down path.
- `jobs`: queue health when the role has `jobs:read`, otherwise `null`.

Counts must not be derived from paginated list lengths. If a live refresh fails, the
backend returns the last successful in-process snapshot for that role as `stale`. If no
successful snapshot exists, it returns `analytics_build_failed` with HTTP 503.

### 11.3 Sermon Admin

```text
GET    /v1/admin/sermons
POST   /v1/admin/sermons/local-drafts
GET    /v1/admin/sermons/:sermonId
PATCH  /v1/admin/sermons/:sermonId
POST   /v1/admin/sermons/:sermonId/local-package
POST   /v1/admin/sermons/:sermonId/audio
DELETE /v1/admin/sermons/:sermonId/audio
POST   /v1/admin/sermons/:sermonId/publish
POST   /v1/admin/sermons/:sermonId/submit-review
POST   /v1/admin/sermons/:sermonId/return-draft
POST   /v1/admin/sermons/:sermonId/mark-failed
POST   /v1/admin/sermons/:sermonId/archive
DELETE /v1/admin/sermons/:sermonId
GET    /v1/admin/sermons/audio-cleanups?status=&limit=50
POST   /v1/admin/sermons/audio-cleanups/:cleanupTaskId/retry
```

`POST /v1/admin/sermons/local-drafts` creates the complete initial manual draft
in one command. Its payload includes required `title`, `speaker`, and
`sermonDate`, plus optional `series`, `topics`, `primaryReference`, `summary`,
`transcript`, and `reviewMarkdown`. The backend persists the parent sermon,
topics, and initial transcript in one transaction; clients must not emulate
creation with a follow-up PATCH.

Admin sermon responses include a non-negative integer `revision`, starting at
`0`. Every sermon mutation listed above except local-draft creation and cleanup
task retry must send the latest value as `x-sermon-revision`. Successful
metadata, status, local-package, and audio writes increment the value. Missing
or malformed headers fail request validation; stale values return
`sermon_state_changed` (409). Clients must refresh instead of automatically
retrying stale content.

`POST /v1/admin/sermons/:sermonId/audio` accepts raw audio bytes with
`Content-Type: audio/mpeg | audio/mp4 | audio/aac | audio/wav | audio/x-m4a |
audio/x-wav`. Maximum upload size is 250 MB.

All mutations of an already published sermon require `sermons:publish`,
including generic PATCH, local package import, return-to-draft, archive, delete,
audio upload, and audio removal. Published sermons must retain ready audio;
return the sermon to draft before deleting that asset. Concurrent aggregate
changes return `sermon_state_changed` (409), and direct removal of required
published audio returns `sermon_published_asset_locked` (409).

Audio replacement, removal, and sermon deletion atomically register old-object
cleanup with the canonical database mutation. A provider deletion failure does
not reverse or falsify the committed sermon response. The cleanup list is the
recovery projection: listing requires `sermons:read`, retry requires
`sermons:update`, and every retry writes `sermon.audio_cleanup.retry` audit
evidence. Retrying an already succeeded task is idempotent.

Cleanup list response:

```json
{
  "data": {
    "items": [
      {
        "id": "8dff6983-cf88-4cc2-b47e-34210cddc3ad",
        "sermonId": "c17d7bc4-35ec-41fa-a7ff-08103fe1f722",
        "reason": "audio_replaced",
        "status": "failed",
        "attempts": 1,
        "lastError": "object_delete_failed: Audio object deletion failed.",
        "completedAt": null,
        "createdAt": "2026-07-12T18:00:00.000Z",
        "updatedAt": "2026-07-12T18:00:01.000Z"
      }
    ]
  },
  "meta": {}
}
```

The private object `storagePath` is never returned by list, retry, or audit
responses. Missing retry targets return `sermon_audio_cleanup_not_found` (404).

Local draft request:

```json
{
  "title": "在苦难中的盼望",
  "speaker": "Pastor David Chen",
  "sermonDate": "2026-05-24",
  "series": "罗马书系列",
  "primaryReference": "罗马书 8:18-30",
  "summary": "本地初始草稿摘要。"
}
```

Local package request:

```json
{
  "summary": "Reviewed local summary",
  "transcript": {
    "text": "Reviewed transcript body.",
    "source": "local_whisper:ggml-large-v3.bin",
    "updatedAt": null
  },
  "outline": [
    {
      "title": "现在的苦楚",
      "summary": "保罗把今生苦楚放在将来荣耀里衡量。",
      "startSeconds": 120
    }
  ],
  "references": [
    {
      "reference": "罗马书 8:28",
      "verseId": "rom.8.28",
      "note": "核心经文"
    }
  ],
  "reviewMarkdown": "# 在苦难中的盼望\n\n## 摘要\nReviewed local summary",
  "processingMetadata": {
    "pipeline": "local-sermon-studio",
    "transcriptionProvider": "local-whisper",
    "summaryProvider": "local-ai"
  },
  "submitForReview": true
}
```

Sermon records may also store:

```json
{
  "reviewMarkdown": "# 在苦难中的盼望\n\n...",
  "processingMetadata": {
    "pipeline": "local-sermon-studio",
    "transcriptionProvider": "local-whisper"
  }
}
```

Admins can use `PATCH /v1/admin/sermons/:sermonId` to save prepared manuscript
text directly:

```json
{
  "transcript": {
    "text": "Prepared sermon manuscript uploaded by church staff.",
    "source": "church-recorded-sermon.md",
    "updatedAt": null
  },
  "reviewMarkdown": "# 审核备注\n\n同工已核对讲章文案和经文引用。"
}
```

Recommended local processing flow:

```text
create local draft
  -> paste or import prepared sermon manuscript
  -> upload original audio
  -> upload local reviewed package
  -> needs_review
  -> publish
  -> published
```

### 11.4 Life Post Admin

```text
GET    /v1/admin/life-posts
POST   /v1/admin/life-posts/images
POST   /v1/admin/life-posts
POST   /v1/admin/life-posts/:postId/notification-translation
PATCH  /v1/admin/life-posts/:postId
POST   /v1/admin/life-posts/:postId/publish
POST   /v1/admin/life-posts/:postId/submit-review
POST   /v1/admin/life-posts/:postId/return-draft
POST   /v1/admin/life-posts/:postId/unpublish
POST   /v1/admin/life-posts/:postId/archive
GET    /v1/admin/life-posts/:postId/registrations
POST   /v1/admin/life-posts/:postId/registrations
PATCH  /v1/admin/life-posts/:postId/registrations/:registrationId
GET    /v1/admin/life-posts/:postId/registrations/export
GET    /v1/admin/groups
POST   /v1/admin/groups
PATCH  /v1/admin/groups/:groupId
GET    /v1/admin/groups/:groupId/applications
PATCH  /v1/admin/groups/:groupId/applications/:applicationId
GET    /v1/admin/groups/:groupId/memberships
PATCH  /v1/admin/groups/:groupId/memberships/:userId
GET    /v1/admin/groups/:groupId/materials
POST   /v1/admin/groups/:groupId/materials
PATCH  /v1/admin/groups/:groupId/materials/:assignmentId
GET    /v1/admin/groups/:groupId/attendance
POST   /v1/admin/groups/:groupId/attendance
GET    /v1/admin/courses
POST   /v1/admin/courses
PATCH  /v1/admin/courses/:courseId
GET    /v1/admin/courses/:courseId/lessons
POST   /v1/admin/courses/:courseId/lessons
PATCH  /v1/admin/courses/:courseId/lessons/:lessonId
GET    /v1/admin/courses/:courseId/enrollments
PATCH  /v1/admin/courses/:courseId/enrollments/:enrollmentId
GET    /v1/admin/serving/members
GET    /v1/admin/serving/teams
POST   /v1/admin/serving/teams
PATCH  /v1/admin/serving/teams/:teamId
GET    /v1/admin/serving/roles
POST   /v1/admin/serving/roles
PATCH  /v1/admin/serving/roles/:roleId
GET    /v1/admin/serving/assignments
POST   /v1/admin/serving/assignments
PATCH  /v1/admin/serving/assignments/:assignmentId
GET    /v1/admin/serving/availability
POST   /v1/admin/serving/availability
GET    /v1/admin/serving/check-ins
POST   /v1/admin/serving/assignments/:assignmentId/check-in
DELETE /v1/admin/life-posts/:postId
```

The admin event registration list accepts `status`, `query`, `limit`, and
`offset`. Its response contains `items`, `total`, `limit`, and `offset`. The CSV
export endpoint always returns the complete canonical registration set and is
not paginated.

Serving assignment create/update requests submit a canonical member `userId`;
the backend resolves `memberDisplayName` and `memberEmail` from the member
repository. `GET /v1/admin/serving/members` exposes the minimal member directory
under `serving:read` so serving coordinators do not need general member-management
permission or duplicate member profile fields in the scheduling UI.

Group membership routes return canonical membership rows enriched with the
current member display name and email. The update route accepts `active`,
`inactive`, or `leader`; backend service/repository rules own capacity checks,
member profile projection synchronization, idempotency, and audit.

`POST /v1/admin/life-posts/images` accepts raw image bytes with
`Content-Type: image/jpeg | image/png | image/webp | image/gif` and returns an
`imageUrl` that can be stored on a life post. Local development stores files
under the configured media upload directory; production should use S3/R2 or
another S3-compatible object store.

`POST /v1/admin/life-posts/:postId/publish` may ask the backend to notify the
App after the post reaches `published`. Push delivery is a side effect and must
not roll back the publish state if FCM is unavailable.

`POST /v1/admin/life-posts/:postId/notification-translation` generates one
localized notification-copy draft for a Life post before publication. It
requires both Life content edit and AI-use permissions, follows the shared AI
Token limit and audit contract, and rejects published or archived posts.

Admin life-post responses include a non-negative integer `revision`, starting
at `0`. PATCH, publish, review transitions, unpublish, archive, and delete must
send the latest value as `x-life-post-revision`. Successful aggregate writes
increment it. Missing or malformed headers fail validation; stale values return
`life_post_state_changed` (409). Public and member Life responses omit revision,
and event registration/check-in mutations do not change it.

Publishing is a single aggregate command. The optional `content` object carries
the current editor snapshot; the backend validates and saves that content,
visibility, and `published` state in one revision-guarded write. A client must
not emulate publishing with PATCH followed by publish. Published content can be
changed, unpublished, archived, or deleted only by an actor with
`life_posts:publish`.

Admin create/update payloads accept `displayWeight` as an integer display
priority. Current UI presets are `0` normal, `50` important, and `100` very
important. The backend stores this as `public_posts.display_weight` and uses it
for list ordering.

```json
{
  "visibility": "members",
  "content": {
    "title": "Members meal",
    "body": "Dinner details for church members.",
    "ctaLabel": "Open details",
    "ctaUrl": "https://example.com/members-meal"
  },
  "notifyApp": true,
  "notification": {
    "title": "Members meal",
    "body": "Dinner details for church members."
  }
}
```

Admin notification operations:

```text
GET  /v1/admin/notifications/deliveries?limit=50&status=retrying&type=life_post_published
POST /v1/admin/notifications/deliveries/retry-due
POST /v1/admin/notifications/deliveries/:taskId/retry
POST /v1/admin/notifications/deliveries/:taskId/cancel
```

`GET /v1/admin/notifications/deliveries` returns delivery tasks with payload,
audience, preference key, recipient count, attempts, provider evidence, and retry
timestamps. `retry-due` retries only currently due retryable delivery tasks and
returns the processed push results. Single-task retry is limited to failed or
retrying tasks. Cancel is limited to queued or retrying tasks.

### 11.5 Prayer Admin

```text
GET   /v1/admin/prayer-requests
PATCH /v1/admin/prayer-requests/:requestId
POST  /v1/admin/prayer-requests/:requestId/approve
```

`POST /v1/admin/prayer-requests/:requestId/approve` accepts the final optional
`visibility`, `groupId`, `moderationNote`, and `notifyApp` intent. The backend
atomically applies the moderation fields with `status=approved`, then uses the
updated canonical visibility to decide whether a generic prayer update push is
broadcastable. The notification payload must not include private prayer text.

Generic Admin prayer PATCH requests must include at least one moderation field.
Status, visibility, group scope, and moderation-note changes all refresh the
canonical moderator metadata.

Pastoral/admin access to prayer content should be limited and logged.

### 11.6 Pastoral Care Admin

```text
GET   /v1/admin/care-requests
PATCH /v1/admin/care-requests/:careRequestId
GET   /v1/admin/care-requests/:careRequestId/follow-ups
POST  /v1/admin/care-requests/:careRequestId/follow-ups
```

Required permissions:

- `care:read` for list/detail/follow-up reads.
- `care:manage` for assignment, status, privacy, internal note, and follow-up
  creation.

Admin responses may include `internalNote` and `followUps`. Audit payloads
must record only metadata such as status, privacy level, assignee id,
`hasInternalNote`, and `hasNote`, never raw pastoral body text or follow-up
notes.

### 11.7 Giving Admin

```text
GET  /v1/admin/giving/transactions
GET  /v1/admin/giving/reconciliation
GET  /v1/admin/giving/provider-events
GET  /v1/admin/giving/statements/:statementId
GET  /v1/admin/giving/statements/:statementId/download
POST /v1/admin/giving/statements/:year/generate
GET  /v1/admin/giving/export?year=2026
```

`/v1/admin/giving/reconciliation` supports `year`, `provider`, and
`status=unreconciled|reconciled|needs_review`. It returns gross amount,
fees, net deposits, refunded amount, disputed amount, transaction count,
unreconciled count, finance-review count, dispute count, and payout count.

`/v1/admin/giving/provider-events` supports `provider`, `status`, `query`, and
`limit` filters so finance/admin users can inspect Stripe webhook delivery and
processing state.

Annual statement downloads still include CSV for app compatibility and now also
include `pdfBase64`, a generated PDF giving statement. Gift totals are based on
the donor's gross succeeded gifts; Stripe fees and net deposits are shown in
finance reconciliation rather than deducted from donor statements.

Finance role required.

### 11.8 Audit Logs

```text
GET /v1/admin/audit-logs?actorUserId=&entityType=&limit=50&cursor=
```

Audit log should include:

- Admin login events.
- Publishing and archiving content.
- Viewing or exporting giving data.
- Generating annual statements.
- Prayer visibility changes.
- Care request updates and care follow-up creation.
- AI-generated content approval or rejection.

## 12. AI Contract

AI is a backend-owned capability. Flutter and Admin Web call MBC WalkWith
endpoints only; they never call OpenAI, Gemini, or third-party relay APIs
directly.

Routes:

```text
GET  /v1/admin/ai/status
POST /v1/admin/ai/drafts
POST /v1/member/ai/study
```

AI runtime management routes require `ai:read` or `ai:manage` as appropriate:

```text
GET  /v1/admin/ai/management
PUT  /v1/admin/ai/providers/:providerId
POST /v1/admin/ai/providers/:providerId/test
PUT  /v1/admin/ai/policies/:capability
PUT  /v1/admin/ai/budget
```

Provider keys are write-only. Management responses expose only whether a key is
configured and its last four characters. AI management records input, output,
and total Token usage; it does not calculate or expose monetary cost.

## 12.1 Content Localization

```text
GET  /v1/admin/content-localizations/:resourceType/:resourceId
PUT  /v1/admin/content-localizations/:resourceType/:resourceId/:locale
POST /v1/admin/content-localizations/:resourceType/:resourceId/:locale/auto-translate
```

The write and auto-translate requests include `sourceVersion`. The backend
rejects missing resources, stale source versions, and fields not allowed for
that resource type. Public Life and sermon endpoints select a current
translation from `Accept-Language`; they fall back to the approved source text.

`GET /v1/admin/ai/status` requires `ai:use` and returns provider status:

```json
{
  "data": {
    "enabled": false,
    "provider": "disabled",
    "model": null,
    "auditEnabled": true,
    "supportedAdminTasks": [
      "sermon_summary",
      "sermon_outline",
      "life_post_draft",
      "notification_draft"
    ],
    "supportedMemberTasks": ["bible_study_help", "sermon_qa"]
  }
}
```

`POST /v1/admin/ai/drafts` requires `ai:use`:

Admin task owns its audit resource attribution:

- `sermon_summary` and `sermon_outline` accept only `sermon`.
- `life_post_draft` accepts only `life_post`.
- `notification_draft` accepts `notification`, or the `life_post` whose publish
  action is being drafted.
- A new unsaved object may omit `resourceId`, but it cannot use an unrelated
  `resourceType`.

```json
{
  "task": "sermon_summary",
  "locale": "zh-Hans",
  "input": {
    "title": "主日讲道",
    "body": "讲道稿或整理内容",
    "reference": "Romans 8:28",
    "audience": "主日会众",
    "context": [
      {
        "label": "Speaker",
        "value": "Pastor John"
      }
    ]
  },
  "resource": {
    "resourceType": "sermon",
    "resourceId": "sermon-id"
  }
}
```

`POST /v1/member/ai/study` requires member authentication:

The task owns its resource attribution: `bible_study_help` must use a
`bible_passage` resource and `sermon_qa` must use a `sermon` resource. A stable
`resourceId` is required so audit records cannot be attributed to an unrelated
feature. Both tasks require a non-empty question, and `bible_study_help` also
requires a non-empty passage reference at the shared API contract boundary.

```json
{
  "task": "bible_study_help",
  "locale": "zh-Hans",
  "input": {
    "reference": "Romans 8:28",
    "question": "这节经文是什么意思？"
  },
  "resource": {
    "resourceType": "bible_passage",
    "resourceId": "rom.8.28"
  }
}
```

AI response:

```json
{
  "data": {
    "task": "bible_study_help",
    "markdown": "## 学习辅助\n\n...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "safetyNotice": "AI 学习辅助仅供反思，不取代牧养关怀或教会教导。",
    "usage": {
      "inputTokens": 100,
      "outputTokens": 80,
      "totalTokens": 180
    },
    "latencyMs": 1200
  }
}
```

AI safety rules:

- No provider keys or relay secrets in App, Admin Web, SDK, logs, or docs.
- No unsourced theological certainty.
- Admin AI output is a draft only and must be reviewed before publishing.
- Member AI output is study help only and must not replace pastoral care.
- Do not send giving records, payment disputes, annual statements, private care notes, or other high-sensitivity data as AI context.
- Audit logs record task/provider/usage/input summary, not complete prompt or output.
- Provider upstream error bodies are not returned to clients.
- Repeated generation requests return `429 ai_rate_limited` with
  `retry-after`, `x-ratelimit-limit`, `x-ratelimit-remaining`, and
  `x-ratelimit-reset` headers.

## 12. Privacy Requirements by Endpoint

```text
Public without login:
  Local packaged Bible text in the App
  GET /v1/public/landing?locale=en|es|zh-Hans|zh-Hant
  GET /v1/settings/public
  GET /v1/bible-knowledge
  GET /v1/sermons
  GET /v1/sermons/facets
  GET /v1/sermons/:sermonId
  GET /v1/sermons/:sermonId/audio
  GET /v1/sermons/recommendations
  GET /v1/life/posts
  GET /v1/life/posts/:postId
  GET /v1/life/images/:fileName
  GET /v1/prayer-requests
  POST /v1/prayer-requests
  GET /v1/courses
  GET /v1/courses/:courseId
  GET /v1/groups
  GET /v1/groups/:groupId
  POST /v1/sermons/:sermonId/progress
  GET /v1/bible/verse-notes

Login required:
  /v1/member/auth/*
  /v1/member/ai/study
  /v1/member/life/posts/*
  GET /v1/me/groups
  POST/PATCH /v1/groups/:groupId/applications/*
  /v1/me/courses
  /v1/me/care-requests/*
  /v1/me/serving-assignments
  /v1/member/notifications/*
  /v1/member/preferences/notifications
  /v1/member/devices/push-token
  /v1/bible/verse-notes write routes without X-External-User-Id
  /v1/member/prayer-requests
  /v1/member/giving/*

Admin required:
  /v1/admin/auth/*
  /v1/admin/ai/*
  /v1/admin/*

Provider callback:
  /v1/webhooks/*
```

AI routes use backend-owned provider configuration and rate limiting.

## 13. Backend Implementation Notes

Current implementation rules:

1. Backend routes live under `backend/src/modules/**`.
2. Shared request/response schemas live under `packages/api_contracts/src`.
3. The route/contract/client/doc matrix lives in
   `packages/api_contracts/src/route-registry.ts`.
4. Add or remove a route only with the matching shared schema, SDK doc, and
   nearest client/repository update.
5. Run `bun run check:contracts` after route changes.
6. Run `bun run typecheck` for TypeScript contract/backend/admin changes.
7. Mock or offline behavior must remain behind explicit local-development
   switches and must not become a second source of truth.

Health endpoint:

```text
GET /v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "mbc-walkwith-api",
  "time": "2026-05-10T18:30:00Z"
}
```

## 14. Production Hardening Decisions

These decisions remain before production launch:

- Whether additional licensed Bible translations should be added beyond the current public-domain seed set.
- Which sermon audio files are public versus member-only.
- Whether production admin auth should add MFA, managed identity, or both.
- Final production object-storage bucket, CDN, and retention rules.
- Final App Store / Google Play review wording for donation and privacy flows.
