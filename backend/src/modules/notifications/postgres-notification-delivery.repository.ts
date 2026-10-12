import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql
} from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { notificationDeliveryTasks } from "../../shared/db/schema.js";
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
  encodeNotificationDeliveryCursor
} from "./notification_delivery_cursor.js";
import type { PushMessage, PushSendResult } from "./push.provider.js";

export class PostgresNotificationDeliveryRepository implements NotificationDeliveryRepository {
  constructor(private readonly db: AppDb) {}

  async getTask(taskId: string) {
    const rows = await this.db
      .select()
      .from(notificationDeliveryTasks)
      .where(eq(notificationDeliveryTasks.id, taskId))
      .limit(1);
    return rows[0] ? taskFromRow(rows[0]) : null;
  }

  async listTasks(query: NotificationDeliveryListQuery) {
    const cursor = query.cursor
      ? decodeNotificationDeliveryCursor(query.cursor)
      : null;
    const filters = [
      query.status
        ? eq(notificationDeliveryTasks.status, query.status)
        : undefined,
      query.type ? eq(notificationDeliveryTasks.type, query.type) : undefined,
      cursor
        ? or(
            lt(notificationDeliveryTasks.createdAt, new Date(cursor.createdAt)),
            and(
              eq(
                notificationDeliveryTasks.createdAt,
                new Date(cursor.createdAt)
              ),
              lt(notificationDeliveryTasks.id, cursor.id)
            )
          )
        : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await this.db
      .select()
      .from(notificationDeliveryTasks)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(
        desc(notificationDeliveryTasks.createdAt),
        desc(notificationDeliveryTasks.id)
      )
      .limit(query.limit + 1);

    const tasks = rows.slice(0, query.limit).map(taskFromRow);
    return {
      tasks,
      nextCursor:
        rows.length > query.limit
          ? encodeNotificationDeliveryCursor(tasks[tasks.length - 1]!)
          : null
    };
  }

  async createOrGetTask(input: CreateNotificationDeliveryTaskInput) {
    const [created] = await this.db
      .insert(notificationDeliveryTasks)
      .values({
        messageId: input.messageId ?? null,
        type: input.type,
        channel: input.channel,
        dedupeKey: input.dedupeKey,
        audience: input.audience,
        preferenceKey: input.preferenceKey ?? null,
        recipientUserIds: input.recipientUserIds ?? [],
        payload: input.payload,
        recipientCount: input.recipientCount,
        pendingDeviceIds: [...new Set(input.deviceIds)]
      })
      .onConflictDoNothing({
        target: notificationDeliveryTasks.dedupeKey
      })
      .returning();
    if (created) {
      return { task: taskFromRow(created), created: true };
    }

    const [existing] = await this.db
      .select()
      .from(notificationDeliveryTasks)
      .where(eq(notificationDeliveryTasks.dedupeKey, input.dedupeKey))
      .limit(1);
    if (!existing) {
      throw new Error("Failed to create or load notification delivery task.");
    }
    return { task: taskFromRow(existing), created: false };
  }

  async claimTask(
    taskId: string,
    mode: NotificationDeliveryClaimMode,
    now: Date
  ) {
    const leaseId = randomUUID();
    const leaseExpiresAt = leaseExpiry(now);
    const [claimed] = await this.db
      .update(notificationDeliveryTasks)
      .set({
        status: "retrying",
        leaseId,
        leaseExpiresAt,
        nextAttemptAt: leaseExpiresAt,
        updatedAt: now
      })
      .where(
        and(
          eq(notificationDeliveryTasks.id, taskId),
          claimModeCondition(mode, now),
          leaseAvailableCondition(now)
        )
      )
      .returning();
    if (!claimed) {
      return null;
    }
    return {
      task: taskFromRow(claimed),
      leaseId,
      pendingDeviceIds: stringArray(claimed.pendingDeviceIds)
    };
  }

  async markAttemptResult(
    taskId: string,
    leaseId: string,
    result: PushSendResult,
    pendingDeviceIds: string[]
  ) {
    const now = new Date();
    const pending = [...new Set(pendingDeviceIds)];
    const retrying = result.failed > 0 && pending.length > 0;
    const failed = result.failed > 0 && !retrying;
    const [updated] = await this.db
      .update(notificationDeliveryTasks)
      .set({
        status: retrying ? "retrying" : failed ? "failed" : "sent",
        attempts: sql`${notificationDeliveryTasks.attempts} + 1`,
        pendingDeviceIds: pending,
        providerEvidence: { result: publicSendResult(result) },
        lastErrorCode:
          result.failed > 0 ? "notification_delivery_failed" : null,
        lastErrorMessage:
          result.failed > 0
            ? `${result.failed} notification deliveries failed.`
            : null,
        nextAttemptAt: retrying ? retryAt() : null,
        ...(result.failed === 0 ? { sentAt: now } : {}),
        failedAt: result.failed > 0 ? now : null,
        leaseId: null,
        leaseExpiresAt: null,
        updatedAt: now
      })
      .where(
        and(
          eq(notificationDeliveryTasks.id, taskId),
          eq(notificationDeliveryTasks.leaseId, leaseId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error(
        `Notification delivery claim ${taskId} is no longer active.`
      );
    }
    return taskFromRow(updated);
  }

  async markAttemptFailure(
    taskId: string,
    leaseId: string,
    failure: NotificationDeliveryFailureInput
  ) {
    const now = new Date();
    const [updated] = await this.db
      .update(notificationDeliveryTasks)
      .set({
        status: failure.retryable ? "retrying" : "failed",
        attempts: sql`${notificationDeliveryTasks.attempts} + 1`,
        providerEvidence: failure.evidence ?? {},
        lastErrorCode: failure.code,
        lastErrorMessage: failure.message,
        nextAttemptAt: failure.retryable ? retryAt() : null,
        failedAt: now,
        leaseId: null,
        leaseExpiresAt: null,
        updatedAt: now
      })
      .where(
        and(
          eq(notificationDeliveryTasks.id, taskId),
          eq(notificationDeliveryTasks.leaseId, leaseId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error(
        `Notification delivery claim ${taskId} is no longer active.`
      );
    }
    return taskFromRow(updated);
  }

  async cancelTask(taskId: string, now: Date) {
    const [updated] = await this.db
      .update(notificationDeliveryTasks)
      .set({
        status: "cancelled",
        nextAttemptAt: null,
        leaseId: null,
        leaseExpiresAt: null,
        updatedAt: now
      })
      .where(
        and(
          eq(notificationDeliveryTasks.id, taskId),
          inArray(notificationDeliveryTasks.status, ["queued", "retrying"]),
          leaseAvailableCondition(now)
        )
      )
      .returning();
    return updated ? taskFromRow(updated) : null;
  }

  async listRetryableTasks(now: Date, limit: number) {
    const rows = await this.db
      .select()
      .from(notificationDeliveryTasks)
      .where(
        and(
          eq(notificationDeliveryTasks.status, "retrying"),
          lte(notificationDeliveryTasks.nextAttemptAt, now)
        )
      )
      .orderBy(
        asc(notificationDeliveryTasks.nextAttemptAt),
        asc(notificationDeliveryTasks.createdAt)
      )
      .limit(limit);
    return rows.map(taskFromRow);
  }
}

type NotificationDeliveryTaskRow =
  typeof notificationDeliveryTasks.$inferSelect;

function taskFromRow(
  row: NotificationDeliveryTaskRow
): NotificationDeliveryTask {
  return {
    id: row.id,
    messageId: row.messageId,
    type: row.type,
    channel: row.channel,
    dedupeKey: row.dedupeKey,
    audience: row.audience,
    preferenceKey:
      row.preferenceKey === "weeklyBulletin" ||
      row.preferenceKey === "sermonPublished" ||
      row.preferenceKey === "lifePostPublished" ||
      row.preferenceKey === "prayerUpdates"
        ? row.preferenceKey
        : null,
    recipientUserIds: stringArray(row.recipientUserIds),
    status: row.status,
    payload: row.payload as PushMessage,
    recipientCount: row.recipientCount,
    attempts: row.attempts,
    providerEvidence: asRecord(row.providerEvidence),
    lastErrorCode: row.lastErrorCode,
    lastErrorMessage: row.lastErrorMessage,
    nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function claimModeCondition(mode: NotificationDeliveryClaimMode, now: Date) {
  if (mode === "initial") {
    return eq(notificationDeliveryTasks.status, "queued");
  }
  if (mode === "manual_retry") {
    return inArray(notificationDeliveryTasks.status, ["failed", "retrying"]);
  }
  return and(
    eq(notificationDeliveryTasks.status, "retrying"),
    lte(notificationDeliveryTasks.nextAttemptAt, now)
  );
}

function leaseAvailableCondition(now: Date) {
  return or(
    and(
      isNull(notificationDeliveryTasks.leaseId),
      isNull(notificationDeliveryTasks.leaseExpiresAt)
    ),
    lte(notificationDeliveryTasks.leaseExpiresAt, now)
  )!;
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
