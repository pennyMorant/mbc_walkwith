# Ministry SDK

状态：二阶段第一版已接入，三阶段 v2 可用性、到岗和小组材料基础链路已接入

This document covers event attendance, group ministry, course learning, and serving schedule client boundaries.

## Mobile Areas

- Life tab entry cards for events, groups, courses, and serving.
- Mine pages for my registrations, my groups, my courses, and my serving assignments.
- Repositories must call typed API clients and return canonical backend state.
- Group SDK lives under `apps/mobile/lib/features/life/data/group_repository.dart`
  and maps `MinistryGroup` DTOs into App domain objects.
- Group catalog/detail use optional member identity through `/v1/groups` and
  `/v1/groups/:groupId`; `/v1/me/groups` is the only Mine membership source.
- Group DTO mapping is strict: malformed envelopes, unknown enums, invalid
  timestamps, negative counts, and capacity overflow fail visibly.
- Group apply and withdraw actions use `/v1/groups/:groupId/applications` and
  return backend-owned application state; `myApplicationId` identifies the
  current canonical application for safe withdrawal.
- `GroupDetailPage` reads `ministryGroupByIdProvider`; `MyGroupsPage` reads
  `myMinistryGroupsProvider`. Apply/withdraw invalidates catalog, detail, and
  Mine providers together.
- Course SDK lives under `apps/mobile/lib/features/life/data/course_repository.dart`
  and maps course DTOs into App domain objects with enrollment progress.
- Course catalog and detail use optional member identity through `/v1/courses`
  and `/v1/courses/:courseId`; `/v1/me/courses` always requires the member
  bearer and is the only source for Mine enrollment history.
- Course DTO mapping is strict: malformed envelopes, invalid enums, mismatched
  lesson counts, impossible progress, and capacity overflow must fail visibly.
- Serving SDK lives under `apps/mobile/lib/features/life/data/serving_repository.dart`
  and exposes assignment, availability, and check-in providers. The API, mock,
  and repository contract live in separate focused files behind that entry.
- Serving DTOs strictly validate envelopes, required identifiers, supported
  statuses, ISO timestamps, time ordering, and check-in timestamp invariants.
  Malformed backend state fails visibly instead of creating empty ids or local
  fallback timestamps.
- Shared Admin/Backend serving response schemas enforce the same required-field,
  time-ordering, email, and check-in timestamp invariants as the App DTO layer.
- Serving v2 member routes include `/v1/me/serving-availability` and
  `/v1/me/serving-check-ins` plus
  `/v1/serving-assignments/:assignmentId/check-in`.
- `servingAssignmentsProvider`, `servingAssignmentByIdProvider`,
  `servingAvailabilityProvider`, and `servingCheckInsProvider` are the App read
  boundaries. Life and Mine pages invalidate the affected provider after a
  mutation and render the canonical repository response on refresh.
- Mine routes `/mine/serving` and `/mine/serving/:assignmentId` own the member
  schedule, availability, detail, and check-in surfaces. UI presenters localize
  backend enums but do not reinterpret conflict or permission decisions.

## Admin Areas

- Admin Ministry API helper should own groups, courses, serving, and attendance requests.
- Serving Admin assignment intents submit `userId` without duplicating member
  name/email. The backend serving-scoped member directory supplies picker data,
  and the service derives assignment projection fields from member state.
- Admin Serving transport lives in `apps/admin_web/src/core/api/serving.ts` and
  parses member, team, role, assignment, availability, and check-in responses
  with shared contract schemas. Vue components do not call `fetch` directly.
- Admin creation commands snapshot normalized intents before transport; late
  results refresh canonical queries without clearing newer form edits, and
  mutation feedback is isolated by serving command type.
- The Admin workspace keeps an unfiltered assignment directory for selectors and
  an unfiltered check-in directory for correction decisions. Table filters only
  change presentation queries and cannot redefine whether an existing check-in
  requires a correction reason.
- Pages must submit typed intent and refresh canonical state after mutations.
- Bulk exports use the backend data export capability.
- Group Admin Web helpers live at `apps/admin_web/src/core/api/groups.ts` for
  group/application/membership state and `group_activity.ts` for material and
  attendance subresources.
- The helper parses group, application, membership, material, and attendance
  responses with shared schemas; Vue components never call `fetch` directly.
- Group v2 Admin routes include material assignments and attendance records:
  `/v1/admin/groups/:groupId/materials` and
  `/v1/admin/groups/:groupId/attendance`.
- Canonical Admin membership routes are
  `/v1/admin/groups/:groupId/memberships` and
  `/v1/admin/groups/:groupId/memberships/:userId`; status mutations are
  backend-owned and return the complete membership projection.
- Admin attendance member options come from the unfiltered canonical membership
  directory. Membership tab filters are presentation-only and cannot narrow the
  attendance command source.
- Group Admin mutations carry the selected group id and a monotonic operation id
  in controller context. Late results may invalidate canonical queries but must
  not change the active group's feedback or command forms; switching groups
  resets material and attendance intents.
- Admin attendance writes send `meetingDate`, `memberUserId`, `status`, and an
  optional note only. The backend resolves `memberDisplayName` from the member
  repository and rechecks active/leader membership at write time.

## Rules

- App does not write final attendance, membership, enrollment, or serving assignment state.
- App group apply action submits an application intent only; backend approval writes
  membership and member `fellowshipGroupId`.
- App group withdrawal submits only a `withdrawn` intent for the signed-in
  member's own submitted application.
- Group material assignments store `materialType` and `materialId` only; they do
  not copy reading plan, sermon discussion guide, or course source content.
- Non-manual material creation and source changes must resolve the referenced
  reading plan, sermon discussion guide, or course through its repository owner.
  Source changes submit `materialType` and `materialId` together so concurrent
  edits cannot create an unvalidated mixed reference.
- Group attendance records are backend-owned and audited; audit payloads should
  store `hasNote`, not raw attendance notes.
- App course enroll action submits an enrollment intent only; backend returns
  canonical `enrolled` / `waitlisted` / `completed` state and progress.
- Retrying an existing active course enrollment returns the same canonical
  enrollment even if the course has since closed; a closed course rejects only
  a new enrollment intent.
- Course projections reject progress on non-learning enrollment states; when an
  enrollment leaves `enrolled` / `completed`, backend progress is reset to zero.
- After enrollment, App invalidates catalog, detail, and Mine course providers;
  Admin mutations refetch the selected canonical course and child collections.
- Admin course mutation results are scoped by selected course and command type;
  late results may invalidate their own cache but cannot overwrite another
  course's editor, lesson draft, filters, or mutation feedback.
- App serving confirm / leave actions submit intents only; backend writes
  canonical assignment status and the repository maps the returned assignment.
- QR check-in results must be confirmed by backend response.
- Course materials require signed URLs and visibility checks.
- Serving notifications and confirmations are separate from the assignment source of truth.
- Serving availability and check-in records are backend-owned. Member App only
  submits intent; Admin can correct check-in state through backend routes.
- Member check-in requests only submit `status=checked_in` and an optional note;
  clients must not provide `checkedInAt`, `pending`, or `missed`.
- Member check-in reads use `/v1/me/serving-check-ins`; the backend derives the
  member filter from the bearer session, never from a client-supplied user id.
- Admin may correct check-in state, but backend normalizes timestamps: checked-in
  records retain or receive a server timestamp, while pending/missed clear it.
- Admin corrections to an existing status or timestamp require a non-empty note;
  members cannot overwrite an admin-owned `missed` state.
- Assignment and availability conflict responses are canonical backend errors;
  clients surface the error and refresh instead of reproducing overlap rules.
- Availability mutation timestamps are serialized as UTC ISO values; check-in
  mutation sends only `checked_in` and a trimmed optional note.
- App display converts canonical UTC timestamps to the device timezone. The
  availability editor uses local system date/time pickers and the repository
  performs the UTC serialization at the transport boundary.
- Check-in audit payloads must store `hasNote`, not raw correction notes.

## Related Features

- [../features/event_attendance.md](../features/event_attendance.md)
- [../features/group_ministry.md](../features/group_ministry.md)
- [../features/course_learning.md](../features/course_learning.md)
- [../features/serving_schedule.md](../features/serving_schedule.md)
