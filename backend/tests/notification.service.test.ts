import { describe, expect, it } from "vitest";
import type { LifePost, PrayerRequest, Sermon } from "@mbc/api-contracts";

import { InMemoryMemberRepository } from "../src/modules/members/in-memory-member.repository.js";
import { MemberService } from "../src/modules/members/member.service.js";
import { ContentLocalizationService } from "../src/modules/content-localization/content-localization.service.js";
import { InMemoryContentLocalizationRepository } from "../src/modules/content-localization/in-memory-content-localization.repository.js";
import { FcmPushProvider } from "../src/modules/notifications/fcm-push.provider.js";
import { InMemoryNotificationDeliveryRepository } from "../src/modules/notifications/in-memory-notification-delivery.repository.js";
import { InMemoryNotificationInboxRepository } from "../src/modules/notifications/in-memory-notification-inbox.repository.js";
import { InMemoryPushRepository } from "../src/modules/notifications/in-memory-push.repository.js";
import { NotificationInboxService } from "../src/modules/notifications/notification-inbox.service.js";
import { NotificationService } from "../src/modules/notifications/notification.service.js";
import type {
  PushMessage,
  PushProvider,
  PushSendResult
} from "../src/modules/notifications/push.provider.js";

describe("notification service", () => {
  it("sends sermon published notifications only to opted-in active devices", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    await memberRepository.update("member-chan", {
      notificationSettings: {
        weeklyBulletin: true,
        sermonPublished: false,
        lifePostPublished: true,
        prayerUpdates: false
      }
    });

    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-1",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-chan",
      installationId: "android-1",
      platform: "android",
      provider: "fcm",
      pushToken: "token-member-chan-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "zh-Hans",
      appVersion: "1.0.0"
    });

    const deliveryRepository = new InMemoryNotificationDeliveryRepository();
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      deliveryRepository,
      inboxService,
      provider,
      memberService
    );

    const result = await service.sendSermonPublished(sermonFixture);

    expect(result).toEqual({
      attempted: 1,
      sent: 1,
      failed: 0,
      revokedTokens: 0
    });
    expect(provider.devices.map((device) => device.installationId)).toEqual([
      "ios-1"
    ]);
    expect(provider.message?.type).toBe("sermon_published");
    expect(provider.message?.route).toBe("/sermons");
    await expect(inboxService.listForMember("member-lee")).resolves.toMatchObject({
      unreadCount: 1,
      items: [
        {
          type: "sermon_published",
          route: "/sermons",
          data: {
            sermonId: "sermon-1"
          }
        }
      ]
    });
    await expect(inboxService.listForMember("member-chan")).resolves.toMatchObject({
      unreadCount: 0,
      items: []
    });

    const duplicateResult = await service.sendSermonPublished({
      ...sermonFixture,
      id: "sermon-1"
    });
    expect(duplicateResult).toEqual(result);
    expect(provider.calls).toBe(1);
    const repeatedInbox = await inboxService.listForMember("member-lee");
    expect(repeatedInbox.items).toHaveLength(1);
  });

  it("sends life post published notifications with per-member preferences", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    await memberRepository.update("member-chan", {
      notificationSettings: {
        weeklyBulletin: true,
        sermonPublished: true,
        lifePostPublished: false,
        prayerUpdates: false
      }
    });

    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-1",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-chan",
      installationId: "android-1",
      platform: "android",
      provider: "fcm",
      pushToken: "token-member-chan-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "zh-Hans",
      appVersion: "1.0.0"
    });

    const provider = new RecordingPushProvider();
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      inboxService,
      provider,
      memberService
    );

    const result = await service.sendLifePostPublished(lifePostFixture, {
      body: "Join this week's fellowship meal."
    });

    expect(result).toEqual({
      attempted: 1,
      sent: 1,
      failed: 0,
      revokedTokens: 0
    });
    expect(provider.devices.map((device) => device.installationId)).toEqual([
      "ios-1"
    ]);
    expect(provider.message).toMatchObject({
      type: "life_post_published",
      route: "/life/posts/life-post-1",
      data: {
        lifePostId: "life-post-1",
        targetType: "life_post",
        targetId: "life-post-1"
      }
    });
    await expect(inboxService.listForMember("member-lee")).resolves.toMatchObject({
      unreadCount: 1,
      items: [
        {
          type: "life_post_published",
          route: "/life/posts/life-post-1",
          data: {
            lifePostId: "life-post-1",
            targetType: "life_post",
            targetId: "life-post-1"
          }
        }
      ]
    });
    await expect(inboxService.listForMember("member-chan")).resolves.toMatchObject({
      unreadCount: 0,
      items: []
    });

    const duplicateResult = await service.sendLifePostPublished(lifePostFixture);
    expect(duplicateResult).toEqual(result);
    expect(provider.calls).toBe(1);
    const repeatedInbox = await inboxService.listForMember("member-lee");
    expect(repeatedInbox.items).toHaveLength(1);
  });

  it("snapshots localized church-life notifications by device locale", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-es",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-es-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "es-MX",
      appVersion: "1.0.0"
    });
    const localizations = new ContentLocalizationService(
      new InMemoryContentLocalizationRepository()
    );
    await localizations.upsert("life_post", lifePostFixture.id, {
      locale: "es",
      sourceVersion: lifePostFixture.revision!,
      source: "admin",
      fields: {
        title: "Cena de compañerismo del viernes",
        body: "Reúnase para cenar, orar y compartir testimonios después del trabajo.",
        meta: "Viernes, 7 PM"
      }
    });
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      inboxService,
      provider,
      memberService,
      localizations
    );

    await service.sendLifePostPublished(lifePostFixture);

    expect(provider.message).toMatchObject({
      title: "Vida de la iglesia: Cena de compañerismo del viernes",
      body: "Reúnase para cenar, orar y compartir testimonios después del trabajo."
    });
    await expect(inboxService.listForMember("member-lee")).resolves.toMatchObject({
      items: [
        {
          title: "Vida de la iglesia: Cena de compañerismo del viernes",
          body: "Reúnase para cenar, orar y compartir testimonios después del trabajo."
        }
      ]
    });
  });

  it("uses the member app locale for inbox copy when no push device is active", async () => {
    const memberRepository = new InMemoryMemberRepository();
    await memberRepository.update("member-lee", { appLocale: "es" });
    const memberService = new MemberService(memberRepository);
    const localizations = new ContentLocalizationService(
      new InMemoryContentLocalizationRepository()
    );
    await localizations.upsert("life_post", lifePostFixture.id, {
      locale: "es",
      sourceVersion: lifePostFixture.revision!,
      source: "admin",
      fields: {
        title: "Cena de compañerismo del viernes",
        body: "Reúnase para cenar, orar y compartir testimonios después del trabajo.",
        meta: "Viernes, 7 PM"
      }
    });
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const service = new NotificationService(
      new InMemoryPushRepository(memberRepository),
      new InMemoryNotificationDeliveryRepository(),
      inboxService,
      new RecordingPushProvider(),
      memberService,
      localizations
    );

    await service.sendLifePostPublished(lifePostFixture);

    await expect(inboxService.listForMember("member-lee")).resolves.toMatchObject({
      items: [
        {
          title: "Vida de la iglesia: Cena de compañerismo del viernes",
          body: "Reúnase para cenar, orar y compartir testimonios después del trabajo."
        }
      ]
    });
  });

  it("keeps administrator-written notification copy ahead of post translations", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-es-custom-copy",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-es-custom-copy-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "es",
      appVersion: "1.0.0"
    });
    const localizations = new ContentLocalizationService(
      new InMemoryContentLocalizationRepository()
    );
    await localizations.upsert("life_post", lifePostFixture.id, {
      locale: "es",
      sourceVersion: lifePostFixture.revision!,
      source: "admin",
      fields: { title: "Título del artículo", body: "Texto del artículo", meta: "Viernes" }
    });
    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      provider,
      memberService,
      localizations
    );

    await service.sendLifePostPublished(lifePostFixture, {
      sourceLocale: "en",
      translations: {
        es: {
          title: "Inscripción cierra mañana",
          body: "Reserve su lugar antes de las 5 PM."
        }
      }
    });

    expect(provider.message).toMatchObject({
      title: "Inscripción cierra mañana",
      body: "Reserve su lugar antes de las 5 PM."
    });
  });

  it("includes guest devices for public notifications only", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertGuestDevice({
      installationId: "guest-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-guest-ios-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "member-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-ios-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });

    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      provider,
      memberService
    );

    await service.sendLifePostPublished(lifePostFixture);
    expect(provider.devices.map((device) => device.installationId).sort()).toEqual([
      "guest-ios",
      "member-ios"
    ]);

    await service.sendLifePostPublished({
      ...lifePostFixture,
      id: "members-post",
      visibility: "members"
    });
    expect(provider.devices.map((device) => device.installationId)).toEqual([
      "member-ios"
    ]);
  });

  it("sends weekly bulletin notifications through the weekly preference", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    await memberRepository.update("member-lee", {
      notificationSettings: {
        weeklyBulletin: false,
        sermonPublished: true,
        lifePostPublished: true,
        prayerUpdates: false
      }
    });

    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertGuestDevice({
      installationId: "guest-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-guest-weekly-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "member-lee-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-weekly-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-chan",
      installationId: "member-chan-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-chan-weekly-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });

    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      provider,
      memberService
    );

    const result = await service.sendWeeklyBulletinPublished({
      ...lifePostFixture,
      id: "weekly-1",
      type: "weekly_bulletin"
    });

    expect(result.attempted).toBe(2);
    expect(provider.message).toMatchObject({
      type: "weekly_bulletin_published",
      route: "/life/posts/weekly-1"
    });
    expect(provider.devices.map((device) => device.installationId).sort()).toEqual([
      "guest-ios",
      "member-chan-ios"
    ]);
  });

  it("uses prayer visibility for broadcast audience without prayer text", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    await memberRepository.update("member-lee", {
      notificationSettings: {
        weeklyBulletin: true,
        sermonPublished: true,
        lifePostPublished: true,
        prayerUpdates: true
      }
    });

    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertGuestDevice({
      installationId: "guest-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-guest-prayer-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "member-ios",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-prayer-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });

    const provider = new RecordingPushProvider();
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      provider,
      memberService
    );

    await service.sendPrayerUpdatePublished(prayerFixture);

    expect(provider.devices.map((device) => device.installationId)).toEqual([
      "member-ios"
    ]);
    expect(provider.message).toMatchObject({
      type: "prayer_update_published",
      title: "Prayer update",
      body: "A new prayer update is available.",
      route: "/life"
    });
    expect(provider.message?.body).not.toContain(prayerFixture.body);

    await service.sendPrayerUpdatePublished({
      ...prayerFixture,
      id: "prayer-public",
      visibility: "public"
    });
    expect(provider.devices.map((device) => device.installationId).sort()).toEqual([
      "guest-ios",
      "member-ios"
    ]);
  });

  it("records retryable delivery tasks when push provider returns failures", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-1",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });

    const deliveryRepository = new InMemoryNotificationDeliveryRepository();
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const service = new NotificationService(
      pushRepository,
      deliveryRepository,
      inboxService,
      new RecordingPushProvider({
        attempted: 1,
        sent: 0,
        failed: 1,
        revokedTokens: 0
      }),
      memberService
    );

    await service.sendSermonPublished(sermonFixture);
    const retryable = await deliveryRepository.listRetryableTasks(
      new Date(Date.now() + 6 * 60 * 1000),
      10
    );

    expect(retryable).toHaveLength(1);
    expect(retryable[0]).toMatchObject({
      type: "sermon_published",
      status: "retrying",
      attempts: 1,
      lastErrorCode: "notification_delivery_failed"
    });
    expect(retryable[0]?.messageId).toEqual(expect.any(String));
  });

  it("rejects manual retry for queued delivery tasks", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const deliveryRepository = new InMemoryNotificationDeliveryRepository();
    const service = new NotificationService(
      new InMemoryPushRepository(memberRepository),
      deliveryRepository,
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      new RecordingPushProvider(),
      memberService
    );
    const { task } = await deliveryRepository.createOrGetTask({
      type: "sermon_published",
      channel: "push",
      dedupeKey: "queued-sermon",
      audience: "public",
      preferenceKey: "sermonPublished",
      recipientUserIds: [],
      payload: {
        type: "sermon_published",
        title: "Queued sermon",
        body: "Queued delivery"
      },
      recipientCount: 0,
      deviceIds: []
    });

    await expect(service.retryDelivery(task.id)).rejects.toMatchObject({
      code: "notification_task_transition_not_allowed",
      category: "state_conflict",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        taskId: task.id,
        action: "retry"
      }
    });
  });

  it("does not revive cancelled deduped delivery tasks", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    await pushRepository.upsertMemberDevice({
      userId: "member-lee",
      installationId: "ios-1",
      platform: "ios",
      provider: "fcm",
      pushToken: "token-member-lee-abcdefghijklmnopqrstuvwxyz",
      permissionStatus: "authorized",
      locale: "en",
      appVersion: "1.0.0"
    });

    const deliveryRepository = new InMemoryNotificationDeliveryRepository();
    const provider = new RecordingPushProvider({
      attempted: 1,
      sent: 0,
      failed: 1,
      revokedTokens: 0
    });
    const service = new NotificationService(
      pushRepository,
      deliveryRepository,
      new NotificationInboxService(
        new InMemoryNotificationInboxRepository(memberRepository)
      ),
      provider,
      memberService
    );

    await service.sendSermonPublished(sermonFixture);
    const tasks = await deliveryRepository.listTasks({ limit: 10 });
    const task = tasks.tasks[0];
    expect(task?.status).toBe("retrying");

    await service.cancelDelivery(task!.id);
    const duplicateResult = await service.sendSermonPublished(sermonFixture);

    expect(duplicateResult).toEqual({
      attempted: 0,
      sent: 0,
      failed: 0,
      revokedTokens: 0
    });
    expect(provider.calls).toBe(1);
    await expect(deliveryRepository.getTask(task!.id)).resolves.toMatchObject({
      status: "cancelled"
    });
  });

  it("updates notification preferences through the notification service", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const memberService = new MemberService(memberRepository);
    const pushRepository = new InMemoryPushRepository(memberRepository);
    const inboxService = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );
    const service = new NotificationService(
      pushRepository,
      new InMemoryNotificationDeliveryRepository(),
      inboxService,
      new RecordingPushProvider(),
      memberService
    );

    const member = await service.updateMemberNotificationSettings("member-lee", {
      weeklyBulletin: false,
      sermonPublished: true,
      lifePostPublished: false,
      prayerUpdates: true
    });

    expect(member.notificationSettings).toEqual({
      weeklyBulletin: false,
      sermonPublished: true,
      lifePostPublished: false,
      prayerUpdates: true
    });
  });

  it("returns structured errors for invalid push payloads", async () => {
    const provider = new FcmPushProvider(
      {
        project_id: "mbc-test",
        client_email: "firebase-adminsdk@example.iam.gserviceaccount.com",
        private_key: "not-a-private-key"
      },
      { timeoutMs: 100 }
    );

    await expect(
      provider.sendToDevices([], {
        type: "",
        title: "",
        body: ""
      })
    ).rejects.toMatchObject({
      code: "notification_payload_invalid",
      category: "validation_error",
      sourceLayer: "capability",
      recoverable: true,
      retryable: false,
      nextAction: "review_request"
    });
  });

  it("returns structured errors when FCM token signing fails", async () => {
    const provider = new FcmPushProvider(
      {
        project_id: "mbc-test",
        client_email: "firebase-adminsdk@example.iam.gserviceaccount.com",
        private_key: "not-a-private-key"
      },
      { timeoutMs: 100 }
    );

    await expect(
      provider.sendToDevices(
        [
          {
            id: "device-1",
            installationId: "ios-1",
            platform: "ios",
            provider: "fcm",
            pushToken: "token-member-lee-abcdefghijklmnopqrstuvwxyz",
            permissionStatus: "authorized",
            locale: "en",
            appVersion: "1.0.0",
            updatedAt: "2026-01-01T00:00:00.000Z",
            lastSeenAt: "2026-01-01T00:00:00.000Z"
          }
        ],
        {
          type: "sermon_published",
          title: "New sermon",
          body: "Romans 8"
        }
      )
    ).rejects.toMatchObject({
      code: "notification_provider_unavailable",
      category: "external_dependency_failed",
      sourceLayer: "capability",
      recoverable: true,
      retryable: true,
      nextAction: "retry"
    });
  });
});

class RecordingPushProvider implements PushProvider {
  constructor(
    private readonly result: PushSendResult | null = null
  ) {}

  devices: Parameters<PushProvider["sendToDevices"]>[0] = [];
  message: PushMessage | null = null;
  calls = 0;

  async sendToDevices(
    devices: Parameters<PushProvider["sendToDevices"]>[0],
    message: PushMessage
  ): Promise<PushSendResult> {
    this.calls += 1;
    this.devices = devices;
    this.message = message;
    if (this.result) {
      return this.result;
    }
    return {
      attempted: devices.length,
      sent: devices.length,
      failed: 0,
      revokedTokens: 0
    };
  }
}

const sermonFixture: Sermon = {
  id: "sermon-1",
  revision: 0,
  title: "Walking Through Romans 8",
  speaker: "Pastor Chen",
  sermonDate: "2026-05-22T18:00:00.000Z",
  series: "Romans",
  topics: ["Hope"],
  primaryReference: "Romans 8:28",
  summary: "A sermon about hope and the sovereignty of God.",
  durationSeconds: 2400,
  thumbnailUrl: null,
  audio: {
    url: null,
    fileName: null,
    mimeType: null,
    sizeBytes: 0,
    status: "missing",
    uploadedAt: null
  },
  status: "published",
  publishedAt: "2026-05-22T18:00:00.000Z",
  outline: [],
  references: [],
  transcript: null,
  createdAt: "2026-05-22T18:00:00.000Z",
  updatedAt: "2026-05-22T18:00:00.000Z"
};

const lifePostFixture: LifePost = {
  id: "life-post-1",
  revision: 3,
  type: "fellowship",
  title: "Friday Fellowship Meal",
  body: "Gather for dinner, prayer, and testimony after work.",
  meta: "Friday 7 PM",
  iconName: "meal",
  startsAt: "2026-06-12T19:00:00.000Z",
  endsAt: "2026-06-12T21:00:00.000Z",
  visibility: "public",
  imageUrl: null,
  displayWeight: 0,
  ctaLabel: null,
  ctaUrl: null,
  registrationEnabled: false,
  registrationCapacity: null,
  registrationDeadline: null,
  registrationAllowCancellation: true,
  registrationMaxPartySize: 1,
  registrationSummary: {
    enabled: false,
    capacity: null,
    registeredCount: 0,
    remainingCount: null,
    deadline: null,
    allowCancellation: true,
    maxPartySize: 1,
    myRegistrationStatus: null,
    myPartySize: null,
    myNote: null,
    myCheckedInAt: null,
    myCheckInMethod: null
  },
  status: "published",
  updatedAt: "2026-06-10T18:00:00.000Z"
};

const prayerFixture: PrayerRequest & { visibility: "members" } = {
  id: "prayer-1",
  title: "Sensitive prayer update",
  body: "A private family health detail that must not be pushed.",
  visibility: "members",
  groupId: null,
  status: "approved",
  submitterName: "Member",
  createdAt: "2026-06-10T12:00:00.000Z",
  updatedAt: "2026-06-10T12:00:00.000Z"
};
