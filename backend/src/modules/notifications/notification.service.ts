import type {
  ContentLocale,
  LifePost,
  LifePostPublishNotification,
  MemberNotificationSettings,
  MemberPushDevice,
  NotificationAudience,
  PrayerRequest,
  Sermon,
  UpsertGuestPushDeviceRequest,
  UpsertMemberPushDeviceRequest
} from "@mbc/api-contracts";

import { isAppError } from "../../shared/http/app-error.js";
import { memberNotFound } from "../members/member-errors.js";
import type { MemberService } from "../members/member.service.js";
import type { ContentLocalizationService } from "../content-localization/content-localization.service.js";
import type {
  NotificationDeliveryClaim,
  NotificationDeliveryRepository,
  NotificationDeliveryTask
} from "./notification-delivery.repository.js";
import {
  notificationTaskNotFound,
  notificationTaskTransitionNotAllowed
} from "./notification-errors.js";
import type { NotificationInboxService } from "./notification-inbox.service.js";
import {
  audienceForLifePost,
  lifePostPublishedMessage,
  prayerUpdatePublishedMessage,
  sermonPublishedMessage,
  weeklyBulletinPublishedMessage
} from "./notification_messages.js";
import type {
  PushMessage,
  PushProvider,
  PushSendResult
} from "./push.provider.js";
import type { PushRepository } from "./push.repository.js";

export class NotificationService {
  constructor(
    private readonly repository: PushRepository,
    private readonly deliveryRepository: NotificationDeliveryRepository,
    private readonly inboxService: NotificationInboxService,
    private readonly provider: PushProvider,
    private readonly memberService: MemberService,
    private readonly localizations?: ContentLocalizationService
  ) {}

  upsertMemberDevice(
    userId: string,
    input: UpsertMemberPushDeviceRequest
  ): Promise<MemberPushDevice> {
    return this.repository.upsertMemberDevice({
      userId,
      installationId: input.installationId,
      platform: input.platform,
      provider: input.provider,
      pushToken: input.pushToken,
      permissionStatus: input.permissionStatus,
      locale: input.locale,
      appVersion: input.appVersion ?? null
    });
  }

  upsertGuestDevice(
    input: UpsertGuestPushDeviceRequest
  ): Promise<MemberPushDevice> {
    return this.repository.upsertGuestDevice({
      installationId: input.installationId,
      platform: input.platform,
      provider: input.provider,
      pushToken: input.pushToken,
      permissionStatus: input.permissionStatus,
      locale: input.locale,
      appVersion: input.appVersion ?? null
    });
  }

  revokeMemberDevice(userId: string, installationId: string) {
    return this.repository.revokeMemberDevice(userId, installationId);
  }

  revokeGuestDevice(installationId: string) {
    return this.repository.revokeGuestDevice(installationId);
  }

  async updateMemberNotificationSettings(
    userId: string,
    updates: MemberNotificationSettings
  ) {
    const existing = await this.memberService.getById(userId);
    if (!existing) {
      throw memberNotFound(userId);
    }
    const member = await this.memberService.update(userId, {
      notificationSettings: mergeNotificationSettings(
        existing.notificationSettings,
        updates
      )
    });
    if (!member) {
      throw memberNotFound(userId);
    }
    return member;
  }

  async sendSermonPublished(sermon: Sermon): Promise<PushSendResult> {
    const message = sermonPublishedMessage(sermon);
    return this.sendNotificationIntent({
      type: message.type,
      title: message.title,
      body: message.body,
      route: message.route ?? null,
      data: message.data ?? {},
      audience: "public",
      sourceType: "sermon",
      sourceId: sermon.id,
      sourceVersion: sermon.revision,
      dedupeKey: `sermon_published:${sermon.id}`,
      preference: "sermonPublished"
    });
  }

  async sendLifePostPublished(
    post: LifePost,
    notification: LifePostPublishNotification = { sourceLocale: "zh-Hans" }
  ): Promise<PushSendResult> {
    const message = lifePostPublishedMessage(post, notification);
    return this.sendNotificationIntent({
      type: message.type,
      title: message.title,
      body: message.body,
      route: message.route ?? null,
      data: message.data ?? {},
      audience: audienceForLifePost(post),
      sourceType: "life_post",
      sourceId: post.id,
      sourceVersion: post.revision,
      customCopy: hasCustomNotificationCopy(notification),
      notificationTranslations: notification.translations,
      dedupeKey: `life_post_published:${post.id}`,
      preference: "lifePostPublished"
    });
  }

  async sendWeeklyBulletinPublished(
    post: LifePost,
    notification: LifePostPublishNotification = { sourceLocale: "zh-Hans" }
  ): Promise<PushSendResult> {
    const message = weeklyBulletinPublishedMessage(post, notification);
    return this.sendNotificationIntent({
      type: message.type,
      title: message.title,
      body: message.body,
      route: message.route ?? null,
      data: message.data ?? {},
      audience: audienceForLifePost(post),
      sourceType: "life_post",
      sourceId: post.id,
      sourceVersion: post.revision,
      customCopy: hasCustomNotificationCopy(notification),
      notificationTranslations: notification.translations,
      dedupeKey: `weekly_bulletin_published:${post.id}`,
      preference: "weeklyBulletin"
    });
  }

  async sendPrayerUpdatePublished(
    request: PrayerRequest & { visibility: "public" | "members" }
  ): Promise<PushSendResult> {
    const message = prayerUpdatePublishedMessage(request);
    return this.sendNotificationIntent({
      type: message.type,
      title: message.title,
      body: message.body,
      route: message.route ?? null,
      data: message.data ?? {},
      audience: request.visibility,
      sourceType: "prayer_request",
      sourceId: request.id,
      dedupeKey: `prayer_update_published:${request.id}`,
      preference: "prayerUpdates"
    });
  }

  async retryDueDeliveries(limit = 20): Promise<PushSendResult[]> {
    const now = new Date();
    const tasks = await this.deliveryRepository.listRetryableTasks(now, limit);
    const results: PushSendResult[] = [];
    for (const task of tasks) {
      if (!task.preferenceKey) {
        continue;
      }
      const claim = await this.deliveryRepository.claimTask(
        task.id,
        "due_retry",
        now
      );
      if (!claim) {
        continue;
      }
      try {
        results.push(await this.deliverClaim(claim));
      } catch {
        results.push(failedResult(claim.pendingDeviceIds.length));
      }
    }
    return results;
  }

  async retryDelivery(taskId: string): Promise<PushSendResult> {
    const task = await this.deliveryRepository.getTask(taskId);
    if (!task) {
      throw notificationTaskNotFound(taskId);
    }
    if (
      !task.preferenceKey ||
      (task.status !== "failed" && task.status !== "retrying")
    ) {
      throw notificationTaskTransitionNotAllowed(taskId, "retry");
    }
    const claim = await this.deliveryRepository.claimTask(
      task.id,
      "manual_retry",
      new Date()
    );
    if (!claim) {
      throw notificationTaskTransitionNotAllowed(taskId, "retry");
    }
    return this.deliverClaim(claim);
  }

  async cancelDelivery(taskId: string) {
    const task = await this.deliveryRepository.getTask(taskId);
    if (!task) {
      throw notificationTaskNotFound(taskId);
    }
    if (task.status !== "queued" && task.status !== "retrying") {
      throw notificationTaskTransitionNotAllowed(taskId, "cancel");
    }
    const cancelled = await this.deliveryRepository.cancelTask(
      taskId,
      new Date()
    );
    if (!cancelled) {
      const current = await this.deliveryRepository.getTask(taskId);
      if (!current) {
        throw notificationTaskNotFound(taskId);
      }
      throw notificationTaskTransitionNotAllowed(taskId, "cancel");
    }
    return cancelled;
  }

  private async sendNotificationIntent(input: NotificationIntent) {
    const targets = await this.repository.listActiveTargets({
      audience: input.audience,
      preference: input.preference,
      userIds: input.recipientUserIds ?? []
    });
    const groups = groupTargetsByLocale(targets);
    const memberLocales = preferredLocalesByMember(targets);
    const eligibleMembers = await this.inboxService.listEligibleMembers(
      input.preference,
      input.recipientUserIds
    );
    const inboxUserIdsByLocale = new Map<ContentLocale, string[]>();
    for (const member of eligibleMembers) {
      const locale = memberLocales.get(member.userId) ?? contentLocaleForDevice(member.appLocale);
      inboxUserIdsByLocale.set(locale, [
        ...(inboxUserIdsByLocale.get(locale) ?? []),
        member.userId
      ]);
    }
    const locales = new Set<ContentLocale>([
      ...groups.keys(),
      ...inboxUserIdsByLocale.keys()
    ]);
    const results = await Promise.all(
      [...locales].map(async (locale) => {
        const group = groups.get(locale) ?? [];
        const payload = await this.localizedPayload(input, locale);
        const inboxUserIds = inboxUserIdsByLocale.get(locale) ?? [];
        const inboxResult = await this.inboxService.createForPreference({
          type: input.type,
          title: payload.title,
          body: payload.body,
          audience: input.audience,
          route: input.route ?? null,
          data: input.data ?? {},
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          dedupeKey: `${input.dedupeKey}:${locale}`,
          preference: input.preference,
          userIds: inboxUserIds
        });
        if (group.length === 0 && targets.length > 0) {
          return skippedResult();
        }
        return this.deliverPushTask({
          type: input.type,
          messageId: inboxResult.message.id,
          dedupeKey: `${input.dedupeKey}:${locale}`,
          payload,
          audience: input.audience,
          preference: input.preference,
          recipientUserIds: input.recipientUserIds ?? [],
          deviceIds: group.map((target) => target.device.id)
        });
      })
    );
    return mergeSendResults(results);
  }

  private async localizedPayload(
    input: NotificationIntent,
    locale: ContentLocale
  ): Promise<PushMessage> {
    if (
      input.customCopy ||
      !this.localizations ||
      !input.sourceVersion ||
      !isLocalizedResource(input.sourceType)
    ) {
      return notificationPayloadForLocale(input, locale);
    }
    const localized = await this.localizations.resolve(
      input.sourceType,
      input.sourceId,
      locale,
      input.sourceVersion
    );
    return localized
      ? withLocale(input, locale, localized.fields)
      : notificationPayloadForLocale(input, locale);
  }

  private async deliverPushTask(input: {
    type: string;
    messageId: string | null;
    dedupeKey: string;
    payload: PushMessage;
    audience: NotificationAudience;
    preference: keyof MemberNotificationSettings;
    recipientUserIds: string[];
    deviceIds?: string[];
  }): Promise<PushSendResult> {
    const targets = await this.repository.listActiveTargets({
      audience: input.audience,
      preference: input.preference,
      userIds: input.recipientUserIds
    });
    const devices = targets
      .map((target) => target.device)
      .filter((device) => !input.deviceIds || input.deviceIds.includes(device.id));
    const { task, created } = await this.deliveryRepository.createOrGetTask({
      messageId: input.messageId,
      type: input.type,
      channel: "push",
      dedupeKey: input.dedupeKey,
      audience: input.audience,
      preferenceKey: input.preference,
      recipientUserIds: input.recipientUserIds,
      payload: input.payload,
      recipientCount: devices.length,
      deviceIds: devices.map((device) => device.id)
    });
    if (!created && task.status === "sent") {
      return sendResultFromTask(task);
    }
    if (!created && task.status === "cancelled") {
      return skippedResult();
    }
    const claim = await this.deliveryRepository.claimTask(
      task.id,
      "initial",
      new Date()
    );
    if (!claim) {
      return skippedResult();
    }
    return this.deliverClaim(claim);
  }

  private async deliverClaim(
    claim: NotificationDeliveryClaim
  ): Promise<PushSendResult> {
    const task = claim.task;
    const pending = new Set(claim.pendingDeviceIds);
    const targets = await this.repository.listActiveTargets({
      audience: task.audience,
      preference: task.preferenceKey,
      userIds: task.recipientUserIds
    });
    const devices = targets
      .map((target) => target.device)
      .filter((device) => pending.has(device.id));
    try {
      const result = await this.provider.sendToDevices(devices, task.payload);
      const retryDeviceIds = retryDeviceIdsForResult(result, devices);
      await this.deliveryRepository.markAttemptResult(
        task.id,
        claim.leaseId,
        result,
        retryDeviceIds
      );
      return publicSendResult(result);
    } catch (error) {
      await this.deliveryRepository.markAttemptFailure(
        task.id,
        claim.leaseId,
        deliveryFailureFromError(error)
      );
      throw error;
    }
  }
}

type NotificationIntent = {
  type: string;
  title: string;
  body: string;
  route: string | null;
  data: Record<string, string>;
  audience: NotificationAudience;
  sourceType: string;
  sourceId: string;
  sourceVersion?: number;
  customCopy?: boolean;
  notificationTranslations?:
    | Partial<
        Record<
          ContentLocale,
          { title?: string | undefined; body?: string | undefined }
        >
      >
    | undefined;
  dedupeKey: string;
  preference: keyof MemberNotificationSettings;
  recipientUserIds?: string[];
};

export function mergeNotificationSettings(
  existing: MemberNotificationSettings,
  updates: Partial<MemberNotificationSettings>
): MemberNotificationSettings {
  return {
    weeklyBulletin: updates.weeklyBulletin ?? existing.weeklyBulletin,
    sermonPublished: updates.sermonPublished ?? existing.sermonPublished,
    lifePostPublished:
      updates.lifePostPublished ?? existing.lifePostPublished,
    prayerUpdates: updates.prayerUpdates ?? existing.prayerUpdates
  };
}

function groupTargetsByLocale(targets: Awaited<ReturnType<PushRepository["listActiveTargets"]>>) {
  const groups = new Map<ContentLocale, typeof targets>();
  for (const target of targets) {
    const locale = contentLocaleForDevice(target.device.locale);
    groups.set(locale, [...(groups.get(locale) ?? []), target]);
  }
  return groups;
}

function preferredLocalesByMember(targets: Awaited<ReturnType<PushRepository["listActiveTargets"]>>) {
  const latest = new Map<string, { locale: ContentLocale; lastSeenAt: string }>();
  for (const target of targets) {
    if (!target.userId) continue;
    const existing = latest.get(target.userId);
    if (!existing || target.device.lastSeenAt > existing.lastSeenAt) {
      latest.set(target.userId, {
        locale: contentLocaleForDevice(target.device.locale),
        lastSeenAt: target.device.lastSeenAt
      });
    }
  }
  return new Map([...latest.entries()].map(([userId, value]) => [userId, value.locale]));
}

function contentLocaleForDevice(locale: string): ContentLocale {
  const normalized = locale.replace("_", "-").toLowerCase();
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("zh-hant") || normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk")) return "zh-Hant";
  if (normalized.startsWith("zh")) return "zh-Hans";
  return "en";
}

function isLocalizedResource(value: string): value is "life_post" | "sermon" {
  return value === "life_post" || value === "sermon";
}

function withLocale(
  input: NotificationIntent,
  locale: ContentLocale,
  fields: Record<string, string> = {}
): PushMessage {
  const title = notificationTitle(input, locale, fields);
  const body = notificationBody(input, fields);
  return {
    type: input.type,
    title,
    body,
    ...(input.route ? { route: input.route } : {}),
    data: input.data
  };
}

function sourcePayload(input: NotificationIntent): PushMessage {
  return {
    type: input.type,
    title: input.title,
    body: input.body,
    ...(input.route ? { route: input.route } : {}),
    data: input.data
  };
}

function notificationPayloadForLocale(
  input: NotificationIntent,
  locale: ContentLocale
): PushMessage {
  const copy = input.notificationTranslations?.[locale];
  if (!copy) return sourcePayload(input);
  return {
    ...sourcePayload(input),
    ...(copy.title ? { title: copy.title } : {}),
    ...(copy.body ? { body: copy.body } : {})
  };
}

function hasCustomNotificationCopy(notification: {
  title?: string | undefined;
  body?: string | undefined;
  translations?: Partial<
    Record<
      ContentLocale,
      { title?: string | undefined; body?: string | undefined }
    >
  > | undefined;
}) {
  return (
    notification.title !== undefined ||
    notification.body !== undefined ||
    Object.values(notification.translations ?? {}).some(
      (copy) => copy.title !== undefined || copy.body !== undefined
    )
  );
}

function notificationTitle(input: NotificationIntent, locale: ContentLocale, fields: Record<string, string>) {
  if (input.type === "sermon_published") {
    return `${localizedLabel(locale, "newSermon")}: ${fields.title ?? input.title.replace(/^New sermon:\s*/, "")}`;
  }
  if (input.type === "life_post_published") {
    return `${localizedLabel(locale, "churchLife")}: ${fields.title ?? input.title.replace(/^Church life:\s*/, "")}`;
  }
  if (input.type === "weekly_bulletin_published") {
    return `${localizedLabel(locale, "weeklyBulletin")}: ${fields.title ?? input.title.replace(/^Weekly bulletin:\s*/, "")}`;
  }
  return input.title;
}

function notificationBody(input: NotificationIntent, fields: Record<string, string>) {
  if (input.type === "sermon_published") return excerpt(fields.summary ?? fields.title ?? input.body);
  if (input.type === "life_post_published") return excerpt(fields.body ?? fields.meta ?? input.body);
  if (input.type === "weekly_bulletin_published") return excerpt(fields.meta ?? fields.body ?? input.body);
  return input.body;
}

function localizedLabel(locale: ContentLocale, key: "newSermon" | "churchLife" | "weeklyBulletin") {
  const labels: Record<ContentLocale, Record<typeof key, string>> = {
    en: { newSermon: "New sermon", churchLife: "Church life", weeklyBulletin: "Weekly bulletin" },
    es: { newSermon: "Nuevo sermón", churchLife: "Vida de la iglesia", weeklyBulletin: "Boletín semanal" },
    "zh-Hans": { newSermon: "新讲道", churchLife: "教会生活", weeklyBulletin: "每周周报" },
    "zh-Hant": { newSermon: "新講道", churchLife: "教會生活", weeklyBulletin: "每週週報" }
  };
  return labels[locale][key];
}

function excerpt(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function mergeSendResults(results: PushSendResult[]): PushSendResult {
  return results.reduce<PushSendResult>(
    (total, result) => ({
      attempted: total.attempted + result.attempted,
      sent: total.sent + result.sent,
      failed: total.failed + result.failed,
      revokedTokens: total.revokedTokens + result.revokedTokens
    }),
    { attempted: 0, sent: 0, failed: 0, revokedTokens: 0 }
  );
}

function sendResultFromTask(task: NotificationDeliveryTask): PushSendResult {
  const result = task.providerEvidence.result;
  if (isPushSendResult(result)) {
    return result;
  }
  return {
    attempted: task.recipientCount,
    sent: task.recipientCount,
    failed: 0,
    revokedTokens: 0
  };
}

function skippedResult(): PushSendResult {
  return {
    attempted: 0,
    sent: 0,
    failed: 0,
    revokedTokens: 0
  };
}

function failedResult(recipientCount: number): PushSendResult {
  return {
    attempted: recipientCount,
    sent: 0,
    failed: recipientCount,
    revokedTokens: 0
  };
}

function publicSendResult(result: PushSendResult): PushSendResult {
  return {
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    revokedTokens: result.revokedTokens
  };
}

function retryDeviceIdsForResult(
  result: PushSendResult,
  devices: MemberPushDevice[]
) {
  if (result.failed <= 0) {
    return [];
  }
  const attemptedDeviceIds = new Set(devices.map((device) => device.id));
  const requested = result.retryDeviceIds;
  if (!requested) {
    return [...attemptedDeviceIds];
  }
  return [...new Set(requested)].filter((id) => attemptedDeviceIds.has(id));
}

function isPushSendResult(value: unknown): value is PushSendResult {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PushSendResult>;
  return (
    typeof candidate.attempted === "number" &&
    typeof candidate.sent === "number" &&
    typeof candidate.failed === "number" &&
    typeof candidate.revokedTokens === "number"
  );
}

function deliveryFailureFromError(error: unknown) {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      evidence: error.evidence
    };
  }
  return {
    code: "notification_delivery_failed",
    message: error instanceof Error ? error.message : "Notification failed.",
    retryable: true
  };
}
