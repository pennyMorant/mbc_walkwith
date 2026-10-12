# Push Notifications

This document describes the first push notification implementation for
MBC WalkWith.

## Scope

The current implementation includes:

- Member device push token registration.
- Guest device push token registration for public notifications.
- Mobile system notification permission request and settings handoff.
- Mobile FCM initialization and foreground notification display.
- Mobile notification center with backend inbox sync for signed-in members and
  local foreground/opened FCM fallback.
- Backend notification inbox data model for canonical messages and per-member
  items.
- Server-side inbox item creation and push fanout for newly published sermons.
- Server-side inbox item creation and push fanout for Life posts when an admin
  explicitly enables App notification during publish.
- Server-side fanout for weekly bulletin posts and generic prayer updates.
- Admin delivery operations for due retry, single-task retry, and cancellation.

The first release uses a single delivery path:

- Mobile clients register an `fcm` token.
- The backend sends through FCM HTTP v1.
- iOS delivery continues through FCM to APNs.

System notification permission is independent from this remote delivery path.
Android/iOS permission can be queried and requested without Firebase, an FCM
token, or a signed-in member. Firebase setup failure disables only remote push
registration; it does not disable local or media notifications.

Each device registration also includes its current App/system locale. The App
updates that locale at start, after system-language changes, sign-in, sign-out,
FCM token refresh, and resume. A later localized notification delivery stage
will group devices by this value; it is not a member-profile preference.

## Backend Setup

Provide a Firebase service account JSON through an environment variable:

```sh
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Optional:

```sh
FCM_HTTP_TIMEOUT_MS=10000
NOTIFICATION_RETRY_SCHEDULER_ENABLED=false
NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS=60000
NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE=20
```

When `FCM_SERVICE_ACCOUNT_JSON` is missing, the backend keeps the push routes
and token storage active. Delivery with no targets completes normally; delivery
with active targets records `notification_provider_unavailable` and remains
visible for retry.

The retry scheduler is an in-process timer, not a separate worker. Keep it
disabled for local mock runs unless you are testing retry behavior.

## Delivery Errors

Push delivery is a notification capability, not the owner of the business event
that triggered it. Sermon publication, event registration, and future annual
statement readiness must not be rolled back only because push delivery failed.

Stable backend errors:

- `notification_payload_invalid`: the backend attempted to send a malformed
  notification payload.
- `notification_provider_unavailable`: FCM token signing or provider access
  failed.
- `notification_delivery_failed`: reserved for future delivery failures that
  must escape the provider boundary.

Per-device FCM send failures are counted in the delivery result. Invalid or
revoked tokens may be revoked through the push repository. Provider setup or
access-token failures surface as structured errors with `sourceLayer:
capability`.

Delivery tasks snapshot target device IDs, atomically claim a time-limited
lease before calling FCM, and retain only failed device IDs for retry. This
prevents concurrent business events, scheduler runs, or Admin actions from
sending the same task twice and avoids resending to devices that already
succeeded. An expired lease is recoverable by the retry scheduler.

## Mobile Setup

The Flutter app now depends on:

- `firebase_core`
- `firebase_messaging`
- `flutter_local_notifications`

The canonical setup path for this repository is:

```sh
cd apps/mobile
flutterfire configure
```

This generates `lib/firebase_options.dart`. Commit that generated file to the
repository. The app initializes Firebase from Dart options for remote push and
reports a setup error until `firebase_options.dart` is replaced with generated
values. The native notification permission control remains available without
it.

### Android

Required manual steps:

1. Add the Firebase Android app in your Firebase project.
2. Run `flutterfire configure` from `apps/mobile`.
3. Make sure the Android application ID and Firebase app match.

The repo already includes the Android 13 notification permission in
`AndroidManifest.xml`.

### iOS

Required manual steps:

1. Add the Firebase iOS app in your Firebase project.
2. Run `flutterfire configure` from `apps/mobile`.
3. Enable `Push Notifications` capability in Xcode.
4. Enable `Background Modes -> Remote notifications`.
5. Upload an APNs auth key or certificate in Firebase Cloud Messaging.

The repo already includes `remote-notification` in `UIBackgroundModes`.

### FlutterFire CLI

Typical setup:

```sh
dart pub global activate flutterfire_cli
flutterfire configure
```

If your app uses multiple Firebase projects or flavors later, keep one
generated options file per environment strategy and make environment selection
explicit.

## API Surface

Member-authenticated routes:

- `PATCH /v1/member/preferences/notifications`
- `PUT /v1/member/devices/push-token`
- `POST /v1/member/devices/push-token/revoke`
- `GET /v1/member/notifications?limit=50`
- `PATCH /v1/member/notifications/:notificationId/read`
- `PATCH /v1/member/notifications/read-all`
- `PATCH /v1/member/notifications/archive-all`
- `PATCH /v1/member/notifications/:notificationId/archive`

Public App routes:

- `PUT /v1/app/devices/push-token`
- `POST /v1/app/devices/push-token/revoke`

Public App routes do not require authentication. They register a device token
for `public` audience push only and do not create a server-backed inbox.

The mobile App does not expose user-facing category switches. The member
preference endpoint remains a backend delivery filter for explicit preference
keys; user-facing notification permission and categories are managed by the
native Android/iOS notification settings.

Admin-authenticated routes:

- `GET /v1/admin/notifications/deliveries`
- `POST /v1/admin/notifications/deliveries/retry-due`
- `POST /v1/admin/notifications/deliveries/:taskId/retry`
- `POST /v1/admin/notifications/deliveries/:taskId/cancel`

The delivery list cursor is a stable composite cursor. Admin clients pass the
returned `nextCursor` back unchanged rather than treating it as a date.

## Delivery Trigger

Implemented business triggers:

- `POST /v1/admin/sermons/:sermonId/publish`
- `PATCH /v1/admin/sermons/:sermonId` when status transitions to `published`
- `POST /v1/admin/life-posts/:postId/publish` with `notifyApp: true`
- `POST /v1/admin/prayer-requests/:requestId/approve` with `notifyApp: true`

The backend resolves an explicit notification audience before it sends:

- `public` sends to active guest devices and opted-in active member devices.
- `members` sends only to opted-in active member devices.
- `member_specific` is reserved for targeted member notifications and requires
  explicit recipient user IDs.

Current trigger mapping:

- `sermon_published` uses `notificationSettings.sermonPublished` and `public`
  audience.
- `life_post_published` uses `notificationSettings.lifePostPublished` and an
  audience derived from the Life post visibility.
- `weekly_bulletin_published` uses `notificationSettings.weeklyBulletin` for
  Life post types `weekly_bulletin` and `sunday`; audience follows visibility.
- `prayer_update_published` uses `notificationSettings.prayerUpdates` and
  `members` audience.

Life publish notifications include `route: /life/posts/{postId}` and data keys
`lifePostId`, `targetType`, and `targetId`.

Prayer push payloads must remain generic. They may route members to `/life`, but
must not include private prayer text or pastoral moderation details.

The same business event also creates a canonical `notification_messages` row and
per-member `member_notification_items` rows for active members whose matching
preference is enabled. Push delivery tasks keep the same `messageId`, so App
inbox sync, delivery status, and future Admin operations can reference one
notification source of truth.

## Known Limits

- Guest devices receive only public push and do not have a backend inbox.
- `member_specific` audience is present in the contract but is not used by the
  current sermon, Life, weekly bulletin, or prayer triggers.
- The App notification center keeps local foreground/opened FCM messages as a
  fallback for guest mode, offline mode, or backend sync failures.
- Sermon deep linking currently routes to the high-level page path only.
- APNs credentials are still a manual setup step.
- The repository includes a placeholder `lib/firebase_options.dart`; it must be
  replaced by generated FlutterFire configuration before production push works.
