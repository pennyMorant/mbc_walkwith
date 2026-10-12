# Notifications SDK

This document covers system notification permission, device token registration, notification delivery keys, scheduled reminders, delivery jobs, inbox sync, and retry state.

## Mobile Files

- Device permission controller: `apps/mobile/lib/features/life/presentation/push_notifications_controller.dart`
- Native system permission adapter: `apps/mobile/lib/features/life/data/system_notification_permission_service.dart`
- Firebase push adapter: `apps/mobile/lib/features/life/data/push_notification_platform_service.dart`
- Notification center page: `apps/mobile/lib/features/life/presentation/notification_center_page.dart`
- Local inbox repository: `apps/mobile/lib/features/life/data/push_notification_inbox_repository.dart`
- Local inbox provider: `apps/mobile/lib/features/life/presentation/notification_inbox_provider.dart`
- Member session: `apps/mobile/lib/features/member_auth/data/member_session_repository.dart`

## Backend and Contracts

- Contracts: `packages/api_contracts/src/push.ts`
- Member notification settings: `packages/api_contracts/src/members.ts`
- Backend module: `backend/src/modules/notifications/`
- Push provider: `backend/src/modules/notifications/fcm-push.provider.ts`
- Backend inbox service: `backend/src/modules/notifications/notification-inbox.service.ts`
- Backend retry scheduler: `backend/src/modules/notifications/notification_retry_scheduler.ts`
- Public App device API: `PUT /v1/app/devices/push-token`, `POST /v1/app/devices/push-token/revoke`
- Member device API: `PUT /v1/member/devices/push-token`, `POST /v1/member/devices/push-token/revoke`
- Member inbox API: `GET /v1/member/notifications`, `PATCH /v1/member/notifications/:notificationId/read`, `PATCH /v1/member/notifications/read-all`, `PATCH /v1/member/notifications/archive-all`, `PATCH /v1/member/notifications/:notificationId/archive`
- Admin delivery API: `GET /v1/admin/notifications/deliveries`, `POST /v1/admin/notifications/deliveries/retry-due`, `POST /v1/admin/notifications/deliveries/:taskId/retry`, `POST /v1/admin/notifications/deliveries/:taskId/cancel`
- Admin Web page: `apps/admin_web/src/features/notifications/pages/NotificationsPage.vue`

## SDK Rules

- System notification permission is owned by Android/iOS settings. App UI must not persist a separate permission boolean.
- System permission queries and requests must not initialize Firebase or require an FCM token. Firebase availability affects only remote push registration and delivery.
- Local notifications and sermon/TTS media notifications are separate capabilities from remote push and must remain usable when Firebase is unavailable.
- The App requests notification permission once on first launch when native system notifications are supported.
- Device locale is re-synced on App start, system locale changes, sign-in,
  sign-out, FCM token refresh, and resume. The backend must treat it as the
  delivery-language preference for that installation, not as a member profile
  language.
- The Mine preference Switch reflects system permission. If permission is missing it requests permission; if permission is already granted it opens the native app notification settings so the user can turn it off there.
- Guest push registration does not require a member session and may only be used
  for `public` audience push.
- Member-linked push registration requires a member session and is the only path
  that can create server-backed inbox items.
- User-facing notification categories are managed by native system notification settings, not by App-local category switches.
- Backend delivery preference keys must remain explicit for routing, audit, and delivery filtering.
- Firebase configuration must not be assumed in local builds.
- If push is unavailable, device registration remains false and the push error may be surfaced, but the system permission control must remain usable.
- Backend push provider errors use the core structured error envelope. SDK/API
  clients should preserve `notification_payload_invalid`,
  `notification_provider_unavailable`, and future `notification_delivery_failed`
  codes instead of reducing them to generic request errors.
- Supported member preference keys are `weeklyBulletin`, `sermonPublished`,
  `lifePostPublished`, and `prayerUpdates`.
- Business triggers currently implemented by the backend are
  `sermon_published`, `life_post_published`, `weekly_bulletin_published`, and
  `prayer_update_published`. They create canonical backend messages,
  per-member inbox items when the audience includes members, and push delivery
  tasks linked by `messageId`.
- Notification delivery tasks carry `audience`, `preferenceKey`, and optional
  `recipientUserIds`. SDK and Admin clients should preserve these fields instead
  of deriving audience from route or title text.
- Delivery target snapshots, pending device ids, and lease ids are backend-only.
  Clients receive task summaries and must not attempt to claim or reconstruct a
  retry target set.
- Delivery list pagination uses a stable `createdAt + taskId` cursor. Admin
  clients must pass `nextCursor` through unchanged and must not parse it as a
  standalone timestamp.
- Device-token upsert is idempotent across concurrent startup/token-refresh
  calls. Partial provider success retries only failed devices, while a task
  lease prevents business triggers, the scheduler, and Admin retry from sending
  the same task concurrently.
- App notification center uses the backend member inbox API when a member
  session exists. It keeps local-device storage for foreground messages and
  messages opened from FCM as a guest/offline/error fallback, and uses push
  `route` or data keys for deep linking.
- Signed-in clear-all uses the backend atomic archive-all endpoint rather than
  looping over the currently loaded page. A failed remote mutation preserves
  the current remote inbox projection and surfaces an error; it must not switch
  an already-synced member inbox to unrelated local fallback items.
- Backend notification inbox source of truth is split between
  `notification_messages` and `member_notification_items`. Mobile sync should
  consume the member inbox API and keep local FCM-opened messages only as a
  device fallback.
- Scheduled notification jobs must expose cancellation, stale, and retry states to admin surfaces.
- Mobile SDKs manage system permission feedback and device tokens only; they do not create delivery jobs directly.
- Admin Web may list delivery tasks, request retry of due tasks, retry one
  retryable task, and cancel queued/retrying tasks. It must not mutate
  notification source-of-truth rows or bypass backend retry rules.
- Admin delivery query and retry-due request shapes are shared contracts:
  `adminNotificationDeliveryListQuerySchema` and
  `adminNotificationRetryDueRequestSchema`. Do not keep separate route-local
  schemas for these admin notification operations.
- The retry scheduler is process-local and env-controlled. Do not reintroduce a
  worker for notification retries unless the deployment model changes.

## Documentation Linkage

If notification SDK behavior changes, update:

- `docs/sdk/notifications.md`
- `docs/push_notifications.md`
- `docs/api.md`
- `docs/privacy_security.md` when device or member data handling changes
