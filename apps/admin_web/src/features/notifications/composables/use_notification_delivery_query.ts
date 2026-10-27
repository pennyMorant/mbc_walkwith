import { useInfiniteQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listNotificationDeliveries } from "@/core/api/notifications";

import {
  createNotificationDeliveryFilterForm,
  notificationDeliveryFilterSnapshot,
  resetNotificationDeliveryFilterForm,
  sameNotificationDeliveryFilters,
  type NotificationDeliveryFilterSnapshot
} from "../notification_delivery_workspace_models";

type NotificationQueryClient = Pick<
  QueryClient,
  "invalidateQueries" | "resetQueries"
>;

export function useNotificationDeliveryQuery(
  queryClient: NotificationQueryClient
) {
  const filters = reactive(createNotificationDeliveryFilterForm());
  const appliedFilters = ref(notificationDeliveryFilterSnapshot(filters));

  const deliveriesQuery = useInfiniteQuery({
    queryKey: ["admin-notification-deliveries", appliedFilters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, queryKey }) => {
      const filterSnapshot =
        queryKey[1] as NotificationDeliveryFilterSnapshot;
      return listNotificationDeliveries({
        ...filterSnapshot,
        cursor: pageParam,
        limit: 50
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const deliveries = computed(
    () =>
      deliveriesQuery.data.value?.pages.flatMap((page) => page.items) ?? []
  );

  function applyFilters() {
    const snapshot = notificationDeliveryFilterSnapshot(filters);
    if (sameNotificationDeliveryFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetNotificationDeliveryFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["admin-notification-deliveries", appliedFilters.value]
    });
  }

  function restartList() {
    return queryClient.resetQueries({
      exact: true,
      queryKey: ["admin-notification-deliveries", appliedFilters.value]
    });
  }

  function loadMore() {
    if (
      deliveriesQuery.hasNextPage.value &&
      !deliveriesQuery.isFetchingNextPage.value
    ) {
      return deliveriesQuery.fetchNextPage();
    }
  }

  return {
    filters,
    appliedFilters,
    deliveriesQuery,
    deliveries,
    applyFilters,
    clearFilters,
    refreshList,
    restartList,
    loadMore
  };
}
