import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostgresNotificationDeliveryRepository } from "../src/modules/notifications/postgres-notification-delivery.repository.js";
import { PostgresPushRepository } from "../src/modules/notifications/postgres-push.repository.js";
import { createDbFromConnectionString } from "../src/shared/db/client.js";
import {
  memberDeviceTokens,
  notificationDeliveryTasks
} from "../src/shared/db/schema.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;
const execFileAsync = promisify(execFile);
const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describeIfDatabase("notification delivery Postgres integrity", () => {
  beforeAll(async () => {
    await execFileAsync("bun", ["run", "db:migrate"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl! }
    });
  });

  it("creates and claims a concurrent deduped task only once", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresNotificationDeliveryRepository(db);
    const dedupeKey = `notification-concurrent-${randomUUID()}`;

    try {
      const creations = await Promise.all([
        repository.createOrGetTask(taskInput(dedupeKey)),
        repository.createOrGetTask(taskInput(dedupeKey))
      ]);
      expect(creations.filter((result) => result.created)).toHaveLength(1);
      expect(new Set(creations.map((result) => result.task.id)).size).toBe(1);

      const taskId = creations[0]!.task.id;
      const claims = await Promise.all([
        repository.claimTask(taskId, "initial", new Date()),
        repository.claimTask(taskId, "initial", new Date())
      ]);
      const activeClaims = claims.filter((claim) => claim !== null);
      expect(activeClaims).toHaveLength(1);
      const claim = activeClaims[0]!;
      await repository.markAttemptResult(
        taskId,
        claim.leaseId,
        { attempted: 2, sent: 1, failed: 1, revokedTokens: 0 },
        ["device-two"]
      );

      const retryClaim = await repository.claimTask(
        taskId,
        "manual_retry",
        new Date()
      );
      expect(retryClaim?.pendingDeviceIds).toEqual(["device-two"]);
      await repository.markAttemptResult(
        taskId,
        retryClaim!.leaseId,
        { attempted: 1, sent: 1, failed: 0, revokedTokens: 0 },
        []
      );
      await expect(repository.getTask(taskId)).resolves.toMatchObject({
        status: "sent",
        attempts: 2
      });
    } finally {
      await db
        .delete(notificationDeliveryTasks)
        .where(inArray(notificationDeliveryTasks.dedupeKey, [dedupeKey]));
    }
  });

  it("paginates equal timestamps with the task id tie breaker", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresNotificationDeliveryRepository(db);
    const prefix = `notification-page-${randomUUID()}`;
    const dedupeKeys = Array.from(
      { length: 3 },
      (_, index) => `${prefix}-${index}`
    );
    const createdAt = new Date("2026-07-14T12:00:00.000Z");

    try {
      await db.insert(notificationDeliveryTasks).values(
        dedupeKeys.map((dedupeKey) => ({
          type: prefix,
          channel: "push" as const,
          dedupeKey,
          audience: "public" as const,
          preferenceKey: "sermonPublished",
          payload: {
            type: "sermon_published",
            title: "Sermon",
            body: "Sermon body"
          },
          createdAt,
          updatedAt: createdAt
        }))
      );

      const first = await repository.listTasks({
        limit: 2,
        type: prefix
      });
      const expectedIds = (
        await db
          .select({ id: notificationDeliveryTasks.id })
          .from(notificationDeliveryTasks)
          .where(inArray(notificationDeliveryTasks.dedupeKey, dedupeKeys))
      ).map((row) => row.id);
      const firstIds = first.tasks.map((task) => task.id);
      if (firstIds.length !== 2 || !first.nextCursor) {
        throw new Error(
          "Expected the equal-timestamp tasks on the first page."
        );
      }
      const second = await repository.listTasks({
        limit: 2,
        type: prefix,
        cursor: first.nextCursor
      });
      const collected = [...firstIds, ...second.tasks.map((task) => task.id)];
      expect(new Set(collected)).toEqual(new Set(expectedIds));
    } finally {
      await db
        .delete(notificationDeliveryTasks)
        .where(inArray(notificationDeliveryTasks.dedupeKey, dedupeKeys));
    }
  });

  it("keeps concurrent guest device registration idempotent", async () => {
    const db = createDbFromConnectionString(testDatabaseUrl!);
    const repository = new PostgresPushRepository(db);
    const installationId = `guest-push-${randomUUID()}`;
    const input = {
      installationId,
      platform: "android" as const,
      provider: "fcm" as const,
      pushToken: `guest-token-${randomUUID()}-abcdefghijklmnopqrstuvwxyz`,
      permissionStatus: "authorized" as const,
      locale: "en",
      appVersion: "1.0.0"
    };

    try {
      const devices = await Promise.all([
        repository.upsertGuestDevice(input),
        repository.upsertGuestDevice(input)
      ]);
      expect(new Set(devices.map((device) => device.id)).size).toBe(1);
    } finally {
      await db
        .delete(memberDeviceTokens)
        .where(inArray(memberDeviceTokens.installationId, [installationId]));
    }
  });
});

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
    recipientCount: 2,
    deviceIds: ["device-one", "device-two"]
  };
}
