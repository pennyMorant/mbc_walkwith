# MBC WalkWith Privacy and Security

Status: draft

This app handles spiritual, personal, and financial data. Privacy must be enforced through product design, local storage rules, backend permissions, and audit logs.

## 1. Data Classification

```text
Public:
  Bible text, public sermons, public bulletins, public events.

Personal:
  profile, reading progress, sermon playback progress, bookmarks, highlights,
  device tokens.

Spiritual sensitive:
  prayer requests, private study notes, AI questions, pastoral context.

Financial:
  giving transactions, receipts, annual statements, payment provider IDs.

Admin/security:
  roles, audit logs, webhook events, moderation actions.
```

Public sermon responses exclude internal review notes and local processing
metadata. `reviewMarkdown` and `processingMetadata` are admin-only even after a
sermon is published.

## 2. Access Rules

Public without login:

- Bible reading.
- Public sermons.
- Public announcements.
- Current public bulletin.

Login required:

- Study notes.
- Highlights.
- Cross-device reading and sermon playback sync.
- Prayer requests.
- Giving.
- Statements.
- Notification settings.

Low-sensitivity reading and sermon playback progress may use an installation
`X-External-User-Id` without login. Valid member identity takes precedence when
both identities are present. Progress records are isolated by owner and must
not expose another member or installation's activity.

Role-gated:

- Content publishing.
- Prayer moderation.
- Finance data.
- Admin user management.
- Audit logs.

## 3. Local Storage Rules

Use local database for:

- Public content cache.
- Reading progress.
- Notes and highlights.

Use secure storage for:

- Access token.
- Refresh token.
- Session expiration.
- Cached member profile used only for transient offline recovery.

Use preferences for:

- Font size.
- Theme mode.
- Language.
- Playback speed.

Do not store locally by default:

- Giving history.
- Statement PDFs.
- Private prayer requests.
- Payment payloads.
- Raw AI questions.

## 4. Logging Rules

Never log:

- Auth tokens.
- Payment secrets.
- Giving details.
- Prayer bodies.
- Private note content.
- Full raw AI prompts.

Safe to log:

- Request ID.
- Endpoint path.
- Status code.
- Latency.
- Error code.
- Non-sensitive entity ID where needed.

## 5. Admin and Audit

Audit-log these actions:

- Admin login.
- Content publish/archive/delete.
- Prayer visibility changes.
- Viewing/exporting giving data.
- Generating annual statements.
- Payment webhook processing failures.
- AI-generated sermon content approval/rejection.

Audit log fields:

```text
id
actor_user_id
action
entity_type
entity_id
metadata_json
created_at
```

## 6. Giving Security

Rules:

- The app never handles raw card numbers.
- The backend creates checkout/payment intents.
- Payment provider webhook is the source of truth.
- Webhook signatures must be verified.
- Webhook processing must be idempotent.
- Financial data requires finance role.
- Statement PDFs use private storage and signed URLs.

## 7. Prayer Security

Rules:

- New prayer requests default to private.
- Visibility must be explicit: private, public, group, members.
- Public prayer requests require admin approval and must never be the default.
- Pastoral/admin access should be limited and audit-logged.
- Deleting or changing visibility should be logged.
- Prayer audit metadata must not contain raw bodies, moderation notes,
  submitter names, email addresses, or admin search text.

## 8. Member Profile Security

Rules:

- Admin member lists return operational summaries, not complete personal
  profiles.
- Phone, address, emergency contacts, and notification preferences require an
  explicit UUID-addressed detail read with `users:read`.
- Member list and detail reads are audit-logged without raw search text or
  personal field values.
- Normal administration uses `inactive` or `blocked`; it must not hard-delete a
  member and cascade away identity, notification, study, ministry, or audit
  history.
- Notification audience resolution uses a dedicated eligibility query and must
  not obtain private profile fields through an admin list response.
- Self-profile audit records field presence only; it does not retain address,
  emergency contact, faith/baptism years, or joined-church date values.
- Public register/login errors do not include the submitted email and do not
  distinguish unknown accounts from accounts without credentials.
- App session restoration clears secure state after terminal auth or member
  status failures. Cached identity is allowed only during transient network or
  provider failures.

## 9. Authentication

First version:

- Guest access for public content.
- Email/password member login.
- Optional registration email verification controlled by backend settings.
- Stronger admin sessions.

Later:

- Passkeys.
- Managed identity provider.
- Device-based session management.

Auth rules:

- Short-lived access token.
- Refresh/session token in secure storage.
- Backend validates all permissions.
- Client-side hiding is not security.

## 10. Retention and Deletion

Retention needs church leadership decisions before production.

Defaults:

- Public sermons and bulletins: retained unless archived.
- Study notes: user controlled.
- Prayer requests: expire/archive policy recommended.
- Giving records: follow finance/legal requirements.
- AI logs: minimize and retain briefly unless needed for safety/debugging.
