import { appError } from "../../shared/http/app-error.js";

export function notificationItemNotFound(notificationId: string) {
  return appError({
    code: "notification_item_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Notification item not found.",
    recoverable: true,
    retryable: false,
    evidence: { notificationId },
    nextAction: "refresh"
  });
}

export function notificationTaskNotFound(taskId: string) {
  return appError({
    code: "notification_task_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Notification delivery task not found.",
    recoverable: true,
    retryable: false,
    evidence: { taskId },
    nextAction: "refresh"
  });
}

export function notificationTaskTransitionNotAllowed(
  taskId: string,
  action: "retry" | "cancel"
) {
  return appError({
    code: "notification_task_transition_not_allowed",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: `Notification delivery task cannot ${action}.`,
    recoverable: true,
    retryable: false,
    evidence: { taskId, action },
    nextAction: "refresh"
  });
}
