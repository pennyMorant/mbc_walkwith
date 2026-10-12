import { randomUUID } from "node:crypto";

import type {
  CreateNotificationDeliveryTaskInput,
  NotificationDeliveryClaimMode,
  NotificationDeliveryFailureInput,
  NotificationDeliveryListQuery,
  NotificationDeliveryRepository,
  NotificationDeliveryTask
} from "./notification-delivery.repository.js";
import {
  decodeNotificationDeliveryCursor,
  encodeNotificationDeliveryCursor,
  isTaskAfterNotificationCursor
} from "./notification_delivery_cursor.js";
import type { PushSendResult } from "./push.provider.js";

type StoredNotificationDeliveryTask = NotificationDeliveryTask & {
  pendingDeviceIds: string[];
  leaseId: string | null;
  leaseExpiresAt: string | null;
};

export class InMemoryNotificationDeliveryRepository implements NotificationDeliveryRepository {
  private tasks = new Map<string, StoredNotificationDeliveryTask>();

  async getTask(taskId: string) {
    const task = this.tasks.get(taskId);
    return task ? publicTask(task) : null;
  }

  async listTasks(query: NotificationDeliveryListQuery) {
    const cursor = query.cursor
      ? decodeNotificationDeliveryCursor(query.cursor)
      : null;
    const filtered = [...this.tasks.values()]
      .filter((task) => !query.status || task.status === query.status)
      .filter((task) => !query.type || task.type === query.type)
      .filter((task) => !cursor || isTaskAfterNotificationCursor(task, cursor))
      .sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          right.id.localeCompare(left.id)
      );
    const pageRows = filtered.slice(0, query.limit + 1);
    const tasks = pageRows.slice(0, query.limit).map(publicTask);
    return {
      tasks,
      nextCursor:
        pageRows.length > query.limit
          ? encodeNotificationDeliveryCursor(tasks[tasks.length - 1]!)
          : null
    };
  }

  async createOrGetTask(input: CreateNotificationDeliveryTaskInput) {
    const existing = [...this.tasks.values()].find(
      (task) => task.dedupeKey === input.dedupeKey
    );
    if (existing) {
      return { task: publicTask(existing), created: false };
    }
    const now = new Date().toISOString();
    const task: StoredNotificationDeliveryTask = {
      id: randomUUID(),
      messageId: input.messageId ?? null,
      type: input.type,
      channel: input.channel,
      dedupeKey: input.dedupeKey,
      audience: input.audience,
      preferenceKey: input.preferenceKey ?? null,
      recipientUserIds: input.recipientUserIds ?? [],
      status: "queued",
      payload: input.payload,
      recipientCount: input.recipientCount,
      pendingDeviceIds: [...new Set(input.deviceIds)],
      attempts: 0,
      providerEvidence: {},
      lastErrorCode: null,
      lastErrorMessage: null,
      nextAttemptAt: null,
      sentAt: null,
      failedAt: null,
      leaseId: null,
      leaseExpiresAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.id, task);
    return { task: publicTask(task), created: true };
  }

  async claimTask(
    taskId: string,
    mode: NotificationDeliveryClaimMode,
    now: Date
  ) {
    const task = this.tasks.get(taskId);
    if (!task || !isClaimable(task, mode, now)) {
      return null;
    }
    const leaseId = randomUUID();
    const leaseExpiresAt = leaseExpiry(now).toISOString();
    const claimed = {
      ...task,
      status: "retrying",
      leaseId,
      leaseExpiresAt,
      nextAttemptAt: leaseExpiresAt,
      updatedAt: now.toISOString()
    } satisfies StoredNotificationDeliveryTask;
    this.tasks.set(taskId, claimed);
    return {
      task: publicTask(claimed),
      leaseId,
      pendingDeviceIds: [...claimed.pendingDeviceIds]
    };
  }

  async markAttemptResult(
    taskId: string,
    leaseId: string,
    result: PushSendResult,
    pendingDeviceIds: string[]
  ) {
    const task = this.requireClaim(taskId, leaseId);
    const now = new Date().toISOString();
    const pending = [...new Set(pendingDeviceIds)];
    const retrying = result.failed > 0 && pending.length > 0;
    const failed = result.failed > 0 && !retrying;
    const next = {
      ...task,
      status: retrying ? "retrying" : failed ? "failed" : "sent",
      attempts: task.attempts + 1,
      pendingDeviceIds: pending,
      providerEvidence: { result: publicSendResult(result) },
      lastErrorCode: result.failed > 0 ? "notification_delivery_failed" : null,
      lastErrorMessage:
        result.failed > 0
          ? `${result.failed} notification deliveries failed.`
          : null,
      nextAttemptAt: retrying ? retryAt().toISOString() : null,
      sentAt: result.failed > 0 ? task.sentAt : now,
      failedAt: result.failed > 0 ? now : null,
      leaseId: null,
      leaseExpiresAt: null,
      updatedAt: now
    } satisfies StoredNotificationDeliveryTask;
    this.tasks.set(taskId, next);
    return publicTask(next);
  }

  async markAttemptFailure(
    taskId: string,
    leaseId: string,
    failure: NotificationDeliveryFailureInput
  ) {
    const task = this.requireClaim(taskId, leaseId);
    const now = new Date().toISOString();
    const next = {
      ...task,
      status: failure.retryable ? "retrying" : "failed",
      attempts: task.attempts + 1,
      providerEvidence: failure.evidence ?? {},
      lastErrorCode: failure.code,
      lastErrorMessage: failure.message,
      nextAttemptAt: failure.retryable ? retryAt().toISOString() : null,
      failedAt: now,
      leaseId: null,
      leaseExpiresAt: null,
      updatedAt: now
    } satisfies StoredNotificationDeliveryTask;
    this.tasks.set(taskId, next);
    return publicTask(next);
  }

  async cancelTask(taskId: string, now: Date) {
    const task = this.tasks.get(taskId);
    if (
      !task ||
      (task.status !== "queued" && task.status !== "retrying") ||
      !leaseAvailable(task, now)
    ) {
      return null;
    }
    const next = {
      ...task,
      status: "cancelled",
      nextAttemptAt: null,
      leaseId: null,
      leaseExpiresAt: null,
      updatedAt: now.toISOString()
    } satisfies StoredNotificationDeliveryTask;
    this.tasks.set(taskId, next);
    return publicTask(next);
  }

  async listRetryableTasks(now: Date, limit: number) {
    return [...this.tasks.values()]
      .filter(
        (task) =>
          task.status === "retrying" &&
          task.nextAttemptAt != null &&
          new Date(task.nextAttemptAt) <= now
      )
      .sort((left, right) =>
        (left.nextAttemptAt ?? "").localeCompare(right.nextAttemptAt ?? "")
      )
      .slice(0, limit)
      .map(publicTask);
  }

  private requireClaim(taskId: string, leaseId: string) {
    const task = this.tasks.get(taskId);
    if (!task || task.leaseId !== leaseId) {
      throw new Error(
        `Notification delivery claim ${taskId} is no longer active.`
      );
    }
    return task;
  }
}

function isClaimable(
  task: StoredNotificationDeliveryTask,
  mode: NotificationDeliveryClaimMode,
  now: Date
) {
  if (!leaseAvailable(task, now)) {
    return false;
  }
  if (mode === "initial") {
    return task.status === "queued";
  }
  if (mode === "manual_retry") {
    return task.status === "failed" || task.status === "retrying";
  }
  return (
    task.status === "retrying" &&
    task.nextAttemptAt !== null &&
    new Date(task.nextAttemptAt) <= now
  );
}

function leaseAvailable(task: StoredNotificationDeliveryTask, now: Date) {
  return (
    (task.leaseId === null && task.leaseExpiresAt === null) ||
    (task.leaseExpiresAt !== null && new Date(task.leaseExpiresAt) <= now)
  );
}

function publicTask(
  task: StoredNotificationDeliveryTask
): NotificationDeliveryTask {
  const {
    pendingDeviceIds: _,
    leaseId: __,
    leaseExpiresAt: ___,
    ...result
  } = task;
  return result;
}

function publicSendResult(result: PushSendResult): PushSendResult {
  return {
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    revokedTokens: result.revokedTokens
  };
}

function retryAt() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

function leaseExpiry(now: Date) {
  return new Date(now.getTime() + 30 * 60 * 1000);
}
