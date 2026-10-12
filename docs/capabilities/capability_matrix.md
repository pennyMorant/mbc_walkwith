# Capability Matrix

状态：当前外部能力和副作用边界矩阵

本文档把 capability 文档、真实 owner 文件、provider 配置和实现状态放在一张表里。
它不替代各 capability 细节文档，只用于防止外部副作用边界漂移。

## Matrix

| Capability | Status | Owner files | Provider/config boundary |
| --- | --- | --- | --- |
| [AI provider](ai_provider.md) | Implemented, provider-configured | `backend/src/modules/ai/ai-provider.factory.ts`, `backend/src/modules/ai/openai-compatible-ai.provider.ts`, `backend/src/modules/ai/gemini-ai.provider.ts`, `backend/src/modules/ai/disabled-ai.provider.ts` | `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_EXTRA_HEADERS_JSON` |
| [Payment gateway](payment_gateway.md) | Implemented for Stripe Checkout/webhook | `backend/src/modules/giving/stripe-giving.provider.ts`, `backend/src/modules/giving/stripe_giving_webhook_handler.ts`, `backend/src/modules/giving/giving.service.ts` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_BASE_URL`, checkout success/cancel URLs |
| [Object storage](object_storage.md) | Implemented for sermon audio and life images; statement object keys are prepared | `backend/src/modules/sermons/sermon-audio-storage.service.ts`, `backend/src/modules/life/life-post-image-storage.service.ts`, `backend/src/config/env.ts` | `MEDIA_STORAGE_DRIVER`, `MEDIA_UPLOAD_DIR`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` |
| [Notification delivery](notification_delivery.md) | Implemented with FCM/noop providers and retry/cancel | `backend/src/modules/notifications/notification.service.ts`, `backend/src/modules/notifications/fcm-push.provider.ts`, `backend/src/modules/notifications/noop-push.provider.ts`, `backend/src/modules/notifications/notification_retry_scheduler.ts` | `FCM_SERVICE_ACCOUNT_JSON`, `FCM_HTTP_TIMEOUT_MS`, retry scheduler env |
| [Email delivery](email_delivery.md) | Implemented for member verification with Resend; production rejects verification when unconfigured | `backend/src/modules/members/auth/member-email-verification.provider.ts`, `backend/src/modules/members/auth/member-auth.service.ts` | `MEMBER_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MEMBER_EMAIL_FROM`, optional reply-to/timeout env |
| [Firebase identity](firebase_identity.md) | Implemented for Google/Apple member sign-in; provider project setup required | `apps/mobile/lib/features/member_auth/data/member_federated_auth_service.dart`, `backend/src/modules/members/auth/firebase-identity.verifier.ts`, member auth repositories | FlutterFire client options, optional `GOOGLE_SERVER_CLIENT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` or shared `FCM_SERVICE_ACCOUNT_JSON` |
| [Scheduled notification](scheduled_notification.md) | Implemented as process-local notification retry scheduler; future reminder scheduling still planned | `backend/src/modules/notifications/notification_retry_scheduler.ts`, `backend/src/modules/notifications/notification.service.ts` | `NOTIFICATION_RETRY_SCHEDULER_ENABLED`, `NOTIFICATION_RETRY_SCHEDULER_INTERVAL_MS`, `NOTIFICATION_RETRY_SCHEDULER_BATCH_SIZE` |
| [Audio playback](audio_playback.md) | Implemented as the shared sermon/TTS native media session on mobile | `apps/mobile/lib/core/media/app_media_session.dart`, `apps/mobile/lib/features/sermons/data/player/sermon_audio_engine.dart`, `apps/mobile/lib/features/sermons/data/player/sermon_player_session.dart`, `apps/mobile/lib/main.dart`, `apps/mobile/android/app/src/main/AndroidManifest.xml`, `apps/mobile/ios/Runner/Info.plist` | One device media session via `audio_service`; sermon audio uses `just_audio` and shared focus uses `audio_session`; backend only provides published sermon audio URLs |
| [PDF generation](pdf_generation.md) | Implemented for annual statement export | `backend/src/modules/giving/annual-statement-export.ts`, `apps/mobile/lib/features/life/data/annual_statement_file_service.dart`, `apps/mobile/lib/features/life/data/annual_statement_export_service.dart` | Backend generates PDF payload; App writes temporary PDF and invokes system share/open |
| [TTS playback](tts_playback.md) | Implemented with device TTS and shared native media controls | `apps/mobile/lib/core/media/app_media_session.dart`, `apps/mobile/lib/features/study/data/bible_tts_engine.dart`, `apps/mobile/lib/features/study/data/bible_tts_controller.dart`, `apps/mobile/lib/features/study/presentation/bible_reader_tts_session.dart`, `apps/mobile/lib/features/study/presentation/bible_tts_media_bridge.dart` | Device TTS engine registered to the single `audio_service` session; no backend provider key |
| [Media processing](media_processing.md) | Implemented as local workstation tooling, not VPS worker | `apps/sermon_studio/sermon_studio/pipeline.py`, `apps/sermon_studio/sermon_studio/transcriber.py`, `apps/sermon_studio/sermon_studio/summarizer.py`, `apps/sermon_studio/sermon_studio/uploader.py` | Local machine config in `apps/sermon_studio/config.example.yaml`; backend receives reviewed package |
| [Data export](data_export.md) | Implemented for event registrations, giving CSV/PDF exports, and audit/list data | `backend/src/modules/life/event_registration_csv.ts`, `backend/src/modules/giving/annual-statement-export.ts`, `backend/src/modules/admin/giving/admin-giving.routes.ts`, `backend/src/modules/admin/life-posts/admin_life_post_registrations.routes.ts` | Export authorization belongs to admin routes/services; sensitive exports require audit |
| [QR check-in](qr_check_in.md) | Implemented for onsite event QR/short-code check-in | `backend/src/modules/life/life-post.service.ts`, `backend/src/modules/life/life.routes.ts`, `backend/src/modules/admin/life-posts/admin_life_post_registrations.routes.ts` | QR code validates the onsite check-in intent; source of truth remains `event_registrations` |

## Rules

- Capability docs must name real owner files when implementation exists.
- Planned capabilities must say they are planned and must not be documented as
  active provider behavior.
- Provider secrets must be listed only as environment/config keys, never as
  values.
- Feature docs may reference capabilities, but final business state stays with
  feature services and repositories.
