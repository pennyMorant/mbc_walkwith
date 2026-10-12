import {
  adminNotificationDeliveryListQuerySchema,
  type MemberPushDevice,
  type Sermon
} from "@mbc/api-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InMemoryMemberRepository } from "../src/modules/members/in-memory-member.repository.js";
import { MemberService } from "../src/modules/members/member.service.js";
import { InMemoryNotificationDeliveryRepository } from "../src/modules/notifications/in-memory-notification-delivery.repository.js";
import { InMemoryNotificationInboxRepository } from "../src/modules/notifications/in-memory-notification-inbox.repository.js";
import { InMemoryPushRepository } from "../src/modules/notifications/in-memory-push.repository.js";
import { NotificationInboxService } from "../src/modules/notifications/notification-inbox.service.js";
import { NotificationService } from "../src/modules/notifications/notification.service.js";
import { isPostgresPushDeviceConflict } from "../src/modules/notifications/postgres_notification_errors.js";
import type {
  PushMessage,
  PushProvider,
  PushSendResult
} from "../src/modules/notifications/push.provider.js";

describe("notification delivery integrity", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("classifies only push-device uniqueness constraints as retryable conflicts", () => {
    expect(
      isPostgresPushDeviceConflict({
        code: "23505",
        constraint: "idx_member_device_tokens_push_token"
      })
    ).toBe(true);
    expect(
      isPostgresPushDeviceConflict({
        code: "23505",
        constraint: "idx_member_device_tokens_guest_installation"
      })
    ).toBe(true);
    expect(
      isPostgresPushDeviceConflict({
        code: "23505",
        constraint: "idx_notification_delivery_tasks_dedupe"
      })
    ).toBe(false);
  });

  it("rejects malformed composite delivery cursors before repository access", () => {
    expect(
      adminNotificationDeliveryListQuerySchema.safeParse({
        cursor:
          "2026-07-14T12:00:00.000Z~------------------------------------"
      }).success
    ).toBe(false);
    expect(
      adminNotificationDeliveryListQuerySchema.safeParse({
        cursor:
          "2026-07-14T12:00:00.000Z~123e4567-e89b-12d3-a456-426614174000"
      }).success
    ).toBe(true);
  });

  it("claims a deduped initial delivery only once", async () => {
    const provider = new ScriptedPushProvider();
    const started = deferred<void>();
    const release = deferred<void>();
    provider.enqueue(async (devices) => {
      started.resolve(undefined);
      await release.promise;
      return successResult(devices);
    });
    const harness = await createHarness(provider);

    const first = harness.service.sendSermonPublished(sermon("same-sermon"));
    await started.promise;
    const duplicate = await harness.service.sendSermonPublished(
      sermon("same-sermon")
    );
    release.resolve(undefined);

    await expect(first).resolves.toMatchObject({ sent: 2, failed: 0 });
    expect(duplicate).toEqual(emptyResult);
    expect(provider.calls).toBe(1);
    const tasks = await harness.deliveries.listTasks({ limit: 10 });
    expect(tasks.tasks).toHaveLength(1);
    expect(tasks.tasks[0]).toMatchObject({ status: "sent", attempts: 1 });
  });

  it("retries only devices that failed the previous attempt", async () => {
    const provider = new ScriptedPushProvider();
    const harness = await createHarness(provider);
    const failedDeviceId = harness.devices[1]!.id;
    provider.enqueue(async (devices) => ({
      attempted: devices.length,
      sent: devices.length - 1,
      failed: 1,
      revokedTokens: 0,
      retryDeviceIds: [failedDeviceId]
    }));
    provider.enqueue(async (devices) => successResult(devices));

    await expect(
      harness.service.sendSermonPublished(sermon("partial-sermon"))
    ).resolves.toEqual({
      attempted: 2,
      sent: 1,
      failed: 1,
      revokedTokens: 0
    });
    const [task] = (await harness.deliveries.listTasks({ limit: 10 })).tasks;
    expect(task).toMatchObject({ status: "retrying", attempts: 1 });

    await expect(harness.service.retryDelivery(task!.id)).resolves.toEqual({
      attempted: 1,
      sent: 1,
      failed: 0,
      revokedTokens: 0
    });
    expect(provider.deviceIdsByCall[1]).toEqual([failedDeviceId]);
    await expect(harness.deliveries.getTask(task!.id)).resolves.toMatchObject({
      status: "sent",
      attempts: 2
    });
  });

  it("rejects a second manual retry while the delivery lease is active", async () => {
    const provider = new ScriptedPushProvider();
    provider.enqueue(async (devices) => failureResult(devices));
    const retryStarted = deferred<void>();
    const retryRelease = deferred<void>();
    provider.enqueue(async (devices) => {
      retryStarted.resolve(undefined);
      await retryRelease.promise;
      return successResult(devices);
    });
    const harness = await createHarness(provider);

    await harness.service.sendSermonPublished(sermon("manual-retry"));
    const [task] = (await harness.deliveries.listTasks({ limit: 10 })).tasks;
    const firstRetry = harness.service.retryDelivery(task!.id);
    await retryStarted.promise;

    await expect(harness.service.retryDelivery(task!.id)).rejects.toMatchObject(
      {
        code: "notification_task_transition_not_allowed",
        evidence: { taskId: task!.id, action: "retry" }
      }
    );
    retryRelease.resolve(undefined);
    await expect(firstRetry).resolves.toMatchObject({ sent: 2, failed: 0 });
    expect(provider.calls).toBe(2);
  });

  it("continues a due retry batch after one provider failure", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00.000Z"));
    const provider = new ScriptedPushProvider();
    provider.enqueue(async (devices) => failureResult(devices));
    provider.enqueue(async (devices) => failureResult(devices));
    provider.enqueue(async () => {
      throw new Error("temporary provider outage");
    });
    provider.enqueue(async (devices) => successResult(devices));
    const harness = await createHarness(provider);

    await harness.service.sendSermonPublished(sermon("batch-one"));
    await harness.service.sendSermonPublished(sermon("batch-two"));
    vi.setSystemTime(new Date("2026-07-14T12:06:00.000Z"));

    const results = await harness.service.retryDueDeliveries(10);

    expect(results).toHaveLength(2);
    expect(results).toContainEqual({
      attempted: 2,
      sent: 0,
      failed: 2,
      revokedTokens: 0
    });
    expect(results).toContainEqual({
      attempted: 2,
      sent: 2,
      failed: 0,
      revokedTokens: 0
    });
    expect(provider.calls).toBe(4);
    const tasks = await harness.deliveries.listTasks({ limit: 10 });
    expect(tasks.tasks.map((task) => task.attempts).sort()).toEqual([2, 2]);
    expect(tasks.tasks.map((task) => task.status).sort()).toEqual([
      "retrying",
      "sent"
    ]);
  });

  it("does not cancel a task while a delivery claim is active", async () => {
    const deliveries = new InMemoryNotificationDeliveryRepository();
    const { task } = await deliveries.createOrGetTask(
      taskInput("active-lease")
    );
    const claim = await deliveries.claimTask(task.id, "initial", new Date());
    expect(claim).not.toBeNull();

    await expect(
      deliveries.cancelTask(task.id, new Date())
    ).resolves.toBeNull();
    await expect(deliveries.getTask(task.id)).resolves.toMatchObject({
      status: "retrying"
    });
  });

  it("paginates tasks with identical timestamps without gaps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00.000Z"));
    const deliveries = new InMemoryNotificationDeliveryRepository();
    for (let index = 0; index < 5; index += 1) {
      await deliveries.createOrGetTask(taskInput(`page-${index}`));
    }

    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await deliveries.listTasks({ limit: 2, cursor });
      ids.push(...page.tasks.map((task) => task.id));
      cursor = page.nextCursor;
    } while (cursor);

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });
});

async function createHarness(provider: ScriptedPushProvider) {
  const members = new InMemoryMemberRepository();
  const memberService = new MemberService(members);
  const pushes = new InMemoryPushRepository(members);
  const devices = await Promise.all([
    registerDevice(pushes, "member-lee", "ios-one", "token-one"),
    registerDevice(pushes, "member-chan", "android-two", "token-two")
  ]);
  const deliveries = new InMemoryNotificationDeliveryRepository();
  const service = new NotificationService(
    pushes,
    deliveries,
    new NotificationInboxService(
      new InMemoryNotificationInboxRepository(members)
    ),
    provider,
    memberService
  );
  return { service, deliveries, devices };
}

function registerDevice(
  repository: InMemoryPushRepository,
  userId: string,
  installationId: string,
  tokenSuffix: string
) {
  return repository.upsertMemberDevice({
    userId,
    installationId,
    platform: installationId.startsWith("ios") ? "ios" : "android",
    provider: "fcm",
    pushToken: `${tokenSuffix}-abcdefghijklmnopqrstuvwxyz`,
    permissionStatus: "authorized",
    locale: "en",
    appVersion: "1.0.0"
  });
}

class ScriptedPushProvider implements PushProvider {
  private scripts: Array<
    (
      devices: MemberPushDevice[],
      message: PushMessage
    ) => Promise<PushSendResult>
  > = [];

  calls = 0;
  deviceIdsByCall: string[][] = [];

  enqueue(
    script: (
      devices: MemberPushDevice[],
      message: PushMessage
    ) => Promise<PushSendResult>
  ) {
    this.scripts.push(script);
  }

  async sendToDevices(devices: MemberPushDevice[], message: PushMessage) {
    this.calls += 1;
    this.deviceIdsByCall.push(devices.map((device) => device.id));
    const script = this.scripts.shift();
    return script ? script(devices, message) : successResult(devices);
  }
}

function successResult(devices: MemberPushDevice[]): PushSendResult {
  return {
    attempted: devices.length,
    sent: devices.length,
    failed: 0,
    revokedTokens: 0
  };
}

function failureResult(devices: MemberPushDevice[]): PushSendResult {
  return {
    attempted: devices.length,
    sent: 0,
    failed: devices.length,
    revokedTokens: 0,
    retryDeviceIds: devices.map((device) => device.id)
  };
}

function taskInput(dedupeKey: string) {
  return {
    type: "sermon_published",
    channel: "push" as const,
    dedupeKey,
    audience: "public" as const,
    preferenceKey: "sermonPublished" as const,
    recipientUserIds: [],
    payload: {
      type: "sermon_published",
      title: "Sermon",
      body: "Sermon body"
    },
    recipientCount: 0,
    deviceIds: []
  };
}

function sermon(id: string): Sermon {
  return {
    id,
    revision: 0,
    title: "Walking Through Romans 8",
    speaker: "Pastor Chen",
    sermonDate: "2026-07-12T18:00:00.000Z",
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
    publishedAt: "2026-07-12T18:00:00.000Z",
    outline: [],
    references: [],
    transcript: null,
    createdAt: "2026-07-12T18:00:00.000Z",
    updatedAt: "2026-07-12T18:00:00.000Z"
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

const emptyResult = {
  attempted: 0,
  sent: 0,
  failed: 0,
  revokedTokens: 0
};
