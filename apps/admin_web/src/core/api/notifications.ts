import {
  adminNotificationDeliveryListResponseSchema,
  adminNotificationCancelResponseSchema,
  adminNotificationRetryOneResponseSchema,
  adminNotificationRetryDueResponseSchema,
  type AdminNotificationDeliveryListResponse,
  type AdminNotificationDeliveryListQuery,
  type AdminNotificationCancelResponse,
  type AdminNotificationRetryOneResponse,
  type AdminNotificationRetryDueResponse,
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type {
  QueryWithNullableString,
  QueryWithSelectAll
} from "./filter_types";
import { pathSegment } from "./path_segments";

export type NotificationDeliveryListFilters = QueryWithNullableString<
  QueryWithSelectAll<AdminNotificationDeliveryListQuery, "status">,
  "cursor"
>;

export async function listNotificationDeliveries(
  filters: NotificationDeliveryListFilters = {}
): Promise<AdminNotificationDeliveryListResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "status", filters.status);
  appendParam(params, "type", filters.type);
  appendParam(params, "cursor", filters.cursor ?? undefined);
  return apiClient.getData(
    `/admin/notifications/deliveries?${params}`,
    adminNotificationDeliveryListResponseSchema
  );
}

export async function retryDueNotificationDeliveries(
  limit = 20
): Promise<AdminNotificationRetryDueResponse> {
  return apiClient.postData(
    "/admin/notifications/deliveries/retry-due",
    { limit },
    adminNotificationRetryDueResponseSchema
  );
}

export async function retryNotificationDelivery(
  taskId: string
): Promise<AdminNotificationRetryOneResponse> {
  return apiClient.postData(
    `/admin/notifications/deliveries/${pathSegment(taskId)}/retry`,
    {},
    adminNotificationRetryOneResponseSchema
  );
}

export async function cancelNotificationDelivery(
  taskId: string
): Promise<AdminNotificationCancelResponse> {
  return apiClient.postData(
    `/admin/notifications/deliveries/${pathSegment(taskId)}/cancel`,
    {},
    adminNotificationCancelResponseSchema
  );
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
