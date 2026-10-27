import { describe, expect, test } from "bun:test";
import type { NotificationDeliveryTask } from "@mbc/api-contracts";

import {
  canCancelNotificationDelivery,
  canRetryNotificationDelivery,
  createNotificationDeliveryFilterForm,
  isCurrentNotificationTaskContext,
  notificationDeliveryFilterSnapshot,
  resetNotificationDeliveryFilterForm,
  sameNotificationDeliveryFilters
} from "../src/features/notifications/notification_delivery_workspace_models";

function delivery(
  status: NotificationDeliveryTask["status"]
): NotificationDeliveryTask {
  return {
    id: `task-${status}`,
    messageId: null,
    type: "life_post_published",
    channel: "push",
    dedupeKey: `delivery-${status}`,
    audience: "members",
    preferenceKey: "lifePostPublished",
    recipientUserIds: [],
    status,
    payload: {
      type: "life_post_published",
      title: "Church life",
      body: "New church life content"
    },
    recipientCount: 1,
    attempts: 0,
    providerEvidence: {},
    lastErrorCode: null,
    lastErrorMessage: null,
    nextAttemptAt: null,
    sentAt: null,
    failedAt: null,
    createdAt: "2026-10-26T12:00:00.000Z",
    updatedAt: "2026-10-26T12:00:00.000Z"
  };
}

describe("notification delivery workspace models", () => {
  test("keeps filter drafts separate from normalized applied filters", () => {
    const form = createNotificationDeliveryFilterForm();
    form.status = "retrying";
    form.type = "  life_post_published  ";

    const snapshot = notificationDeliveryFilterSnapshot(form);

    expect(snapshot).toEqual({
      status: "retrying",
      type: "life_post_published"
    });
    expect(form.type).toBe("  life_post_published  ");
  });

  test("compares and resets filter state without replacing its identity", () => {
    const form = createNotificationDeliveryFilterForm();
    const identity = form;
    form.status = "failed";
    form.type = "sermon_published";

    expect(
      sameNotificationDeliveryFilters(
        notificationDeliveryFilterSnapshot(form),
        { status: "failed", type: "sermon_published" }
      )
    ).toBe(true);

    resetNotificationDeliveryFilterForm(form);
    expect(form).toBe(identity);
    expect(form).toEqual({ status: "", type: "" });
  });

  test("mirrors eligible retry and cancel affordances without changing tasks", () => {
    expect(canRetryNotificationDelivery(delivery("failed"))).toBe(true);
    expect(canRetryNotificationDelivery(delivery("retrying"))).toBe(true);
    expect(canRetryNotificationDelivery(delivery("sent"))).toBe(false);
    expect(canCancelNotificationDelivery(delivery("queued"))).toBe(true);
    expect(canCancelNotificationDelivery(delivery("retrying"))).toBe(true);
    expect(canCancelNotificationDelivery(delivery("cancelled"))).toBe(false);
  });

  test("accepts asynchronous command results only for the active task context", () => {
    const context = { taskId: "task-a", contextVersion: 4 };

    expect(isCurrentNotificationTaskContext(context, "task-a", 4)).toBe(true);
    expect(isCurrentNotificationTaskContext(context, "task-b", 4)).toBe(false);
    expect(isCurrentNotificationTaskContext(context, "task-a", 5)).toBe(false);
  });
});
