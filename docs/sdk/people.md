# People SDK

状态：第一版已落地

This document covers member profile, notification preference linkage, and pastoral care client boundaries.

## Mobile Areas

- Mine profile page.
- Mine profile and preference cards.
- System notification permission entry.
- Life/Mine care request section.
- Device token registration and logout cleanup.

## Admin Areas

- Member list, member detail, role/status management, Care page request queue, care follow-up drawer, and privacy-gated access.

## Implemented SDK Boundaries

- Admin member list parses the minimal `MemberListItem` contract. Phone,
  address, emergency contact, and notification preferences are fetched only
  through `GET /v1/admin/members/:memberId` after an operator opens a member.
- Admin member create and update use shared contracts; member retention uses
  `inactive` or `blocked`, and the SDK exposes no member hard-delete helper.
- Concurrent Admin create or email update collisions return the stable
  `member_email_conflict` feature error; the API helper does not parse provider or SQL errors.
- Notification recipient eligibility uses a dedicated member repository query
  rather than reusing the admin member list payload.
- Mobile `CareRepository` uses `GET /v1/me/care-requests` and `POST /v1/me/care-requests` with `MemberSession`.
- Member care list query supports backend-validated `status` and `limit` only; member identity always comes from the bearer session.
- Mobile `CareRequestDto` maps only member-safe summary fields and ignores admin-only fields.
- Admin Web `core/api/care.ts` uses shared contract schemas for care list, update, follow-up list, and follow-up create.
- Admin care list returns an empty `followUps` collection; follow-up text is fetched only from the audited subresource endpoint.
- Care assignee selection uses the minimal `/v1/admin/care-assignees` directory and never relies on free-text names.
- Care assignee IDs use Admin UUIDs. Planned follow-ups require `plannedAt`, and only completed follow-ups may send `completedAt`.
- Admin pages must not call raw `fetch` for care routes.

## Rules

- Member role and permission changes are admin/backend only.
- Member list/detail reads remain backend-authorized and audit-logged; clients
  must not reconstruct a full profile from list rows.
- Care follow-up notes must not be returned to normal mobile profile APIs.
- Device token failures should not block member login.
- Sensitive exports and care access must preserve audit evidence.

## Related Features

- [../features/member_profile.md](../features/member_profile.md)
- [../features/pastoral_care.md](../features/pastoral_care.md)
- [../features/notification_delivery.md](../features/notification_delivery.md)
