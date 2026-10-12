import type {
  MemberNotificationSettings,
  NotificationAudience
} from "@mbc/api-contracts";

import type { PushMessage, PushSendResult } from "./push.provider.js";

export type NotificationDeliveryStatus =
  "queued" | "sent" | "failed" | "retrying" | "cancelled";

export type NotificationDeliveryChannel = "push";

export type NotificationDeliveryTask = {
  id: string;
  messageId: string | null;
  type: string;
  channel: NotificationDeliveryChannel;
  dedupeKey: string;
  audience: NotificationAudience;
  preferenceKey: keyof MemberNotificationSettings | null;
  recipientUserIds: string[];
  status: NotificationDeliveryStatus;
  payload: PushMessage;
  recipientCount: number;
  attempts: number;
  providerEvidence: Record<string, unknown>;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  nextAttemptAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationDeliveryTaskInput = {
  messageId?: string | null;
  type: string;
  channel: NotificationDeliveryChannel;
  dedupeKey: string;
  audience: NotificationAudience;
  preferenceKey?: keyof MemberNotificationSettings | null;
  recipientUserIds?: string[];
  payload: PushMessage;
  recipientCount: number;
  deviceIds: string[];
};

export type NotificationDeliveryClaimMode =
  "initial" | "manual_retry" | "due_retry";

export type NotificationDeliveryClaim = {
  task: NotificationDeliveryTask;
  leaseId: string;
  pendingDeviceIds: string[];
};

export type NotificationDeliveryListQuery = {
  limit: number;
  status?: NotificationDeliveryStatus;
  type?: string;
  cursor?: string | null;
};

export type NotificationDeliveryListResult = {
  tasks: NotificationDeliveryTask[];
  nextCursor: string | null;
};

export type NotificationDeliveryFailureInput = {
  code: string;
  message: string;
  retryable: boolean;
  evidence?: Record<string, unknown>;
};

export interface NotificationDeliveryRepository {
  getTask(taskId: string): Promise<NotificationDeliveryTask | null>;
  listTasks(
    query: NotificationDeliveryListQuery
  ): Promise<NotificationDeliveryListResult>;
  createOrGetTask(
    input: CreateNotificationDeliveryTaskInput
  ): Promise<{ task: NotificationDeliveryTask; created: boolean }>;
  claimTask(
    taskId: string,
    mode: NotificationDeliveryClaimMode,
    now: Date
  ): Promise<NotificationDeliveryClaim | null>;
  markAttemptResult(
    taskId: string,
    leaseId: string,
    result: PushSendResult,
    pendingDeviceIds: string[]
  ): Promise<NotificationDeliveryTask>;
  markAttemptFailure(
    taskId: string,
    leaseId: string,
    failure: NotificationDeliveryFailureInput
  ): Promise<NotificationDeliveryTask>;
  cancelTask(
    taskId: string,
    now: Date
  ): Promise<NotificationDeliveryTask | null>;
  listRetryableTasks(
    now: Date,
    limit: number
  ): Promise<NotificationDeliveryTask[]>;
}
