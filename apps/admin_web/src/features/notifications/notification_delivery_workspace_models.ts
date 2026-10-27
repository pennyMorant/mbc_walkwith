import type {
  NotificationDeliveryStatus,
  NotificationDeliveryTask
} from "@mbc/api-contracts";

export type NotificationDeliveryFilterForm = {
  status: NotificationDeliveryStatus | "";
  type: string;
};

export type NotificationDeliveryFilterSnapshot = Readonly<{
  status: NotificationDeliveryStatus | "";
  type: string;
}>;

export type NotificationTaskCommandContext = {
  taskId: string;
  contextVersion: number;
};

export const notificationDeliveryStatuses: Array<
  NotificationDeliveryStatus | ""
> = ["", "queued", "sent", "failed", "retrying", "cancelled"];

export function createNotificationDeliveryFilterForm(): NotificationDeliveryFilterForm {
  return { status: "", type: "" };
}

export function notificationDeliveryFilterSnapshot(
  form: NotificationDeliveryFilterForm
): NotificationDeliveryFilterSnapshot {
  return {
    status: form.status,
    type: form.type.trim()
  };
}

export function sameNotificationDeliveryFilters(
  first: NotificationDeliveryFilterSnapshot,
  second: NotificationDeliveryFilterSnapshot
) {
  return first.status === second.status && first.type === second.type;
}

export function resetNotificationDeliveryFilterForm(
  form: NotificationDeliveryFilterForm
) {
  Object.assign(form, createNotificationDeliveryFilterForm());
}

export function canRetryNotificationDelivery(
  task: NotificationDeliveryTask
) {
  return task.status === "failed" || task.status === "retrying";
}

export function canCancelNotificationDelivery(
  task: NotificationDeliveryTask
) {
  return task.status === "queued" || task.status === "retrying";
}

export function isCurrentNotificationTaskContext(
  context: NotificationTaskCommandContext | undefined,
  currentTaskId: string | undefined,
  contextVersion: number
) {
  return Boolean(
    context &&
      context.taskId === currentTaskId &&
      context.contextVersion === contextVersion
  );
}
