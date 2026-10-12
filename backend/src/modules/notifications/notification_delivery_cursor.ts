import type { NotificationDeliveryTask } from "./notification-delivery.repository.js";

const separator = "~";
const cursorPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z~[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NotificationDeliveryCursor = {
  createdAt: string;
  id: string;
};

export function encodeNotificationDeliveryCursor(
  task: Pick<NotificationDeliveryTask, "createdAt" | "id">
) {
  return `${task.createdAt}${separator}${task.id}`;
}

export function decodeNotificationDeliveryCursor(
  value: string
): NotificationDeliveryCursor {
  if (!cursorPattern.test(value)) {
    throw new Error("Notification delivery cursor is invalid.");
  }
  const separatorIndex = value.lastIndexOf(separator);
  const createdAt = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);
  return { createdAt: new Date(createdAt).toISOString(), id };
}

export function isTaskAfterNotificationCursor(
  task: Pick<NotificationDeliveryTask, "createdAt" | "id">,
  cursor: NotificationDeliveryCursor
) {
  return (
    task.createdAt < cursor.createdAt ||
    (task.createdAt === cursor.createdAt && task.id < cursor.id)
  );
}
