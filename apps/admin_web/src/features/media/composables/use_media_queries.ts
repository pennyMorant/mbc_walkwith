import type { MediaCleanupStatus } from "@mbc/api-contracts";
import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, type ComputedRef } from "vue";

import {
  listMediaAssets,
  listMediaCleanupTasks
} from "@/core/api/media";

import {
  createMediaLibraryFilterForm,
  mediaLibraryFilterSnapshot,
  resetMediaLibraryFilterForm,
  sameMediaLibraryFilters,
  type MediaLibraryFilterSnapshot
} from "../media_workspace_models";

type MediaQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useMediaLibraryQuery(queryClient: MediaQueryClient) {
  const filters = reactive(createMediaLibraryFilterForm());
  const appliedFilters = ref(mediaLibraryFilterSnapshot(filters));
  const assetsQuery = useQuery({
    queryKey: ["admin-media-assets", appliedFilters],
    queryFn: ({ queryKey }) => {
      const snapshot = queryKey[1] as MediaLibraryFilterSnapshot;
      return listMediaAssets({
        kind: "image",
        ...(snapshot.visibility ? { visibility: snapshot.visibility } : {}),
        ...(snapshot.consentStatus
          ? { consentStatus: snapshot.consentStatus }
          : {}),
        limit: 100
      });
    }
  });
  const assets = computed(() => assetsQuery.data.value ?? []);
  const initialError = computed(() =>
    assetsQuery.data.value === undefined ? assetsQuery.error.value : null
  );
  const refreshError = computed(() =>
    assetsQuery.data.value !== undefined ? assetsQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = mediaLibraryFilterSnapshot(filters);
    if (sameMediaLibraryFilters(appliedFilters.value, snapshot)) {
      return refresh();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetMediaLibraryFilterForm(filters);
    return applyFilters();
  }

  function refresh() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["admin-media-assets", appliedFilters.value]
    });
  }

  return {
    applyFilters,
    assets,
    assetsQuery,
    clearFilters,
    filters,
    initialError,
    refresh,
    refreshError
  };
}

export function useMediaCleanupQuery(
  queryClient: MediaQueryClient,
  enabled: ComputedRef<boolean>
) {
  const status = ref<MediaCleanupStatus | "">("failed");
  const appliedStatus = ref<MediaCleanupStatus | "">("failed");
  const cleanupQuery = useQuery({
    queryKey: ["admin-media-cleanup-tasks", appliedStatus],
    enabled,
    queryFn: ({ queryKey }) =>
      listMediaCleanupTasks({
        status: queryKey[1] as MediaCleanupStatus | "",
        limit: 50
      })
  });
  const tasks = computed(() => cleanupQuery.data.value ?? []);
  const initialError = computed(() =>
    cleanupQuery.data.value === undefined ? cleanupQuery.error.value : null
  );
  const refreshError = computed(() =>
    cleanupQuery.data.value !== undefined ? cleanupQuery.error.value : null
  );

  function applyStatus() {
    if (appliedStatus.value === status.value) return refresh();
    appliedStatus.value = status.value;
  }

  function refresh() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["admin-media-cleanup-tasks", appliedStatus.value]
    });
  }

  return {
    applyStatus,
    cleanupQuery,
    initialError,
    refresh,
    refreshError,
    status,
    tasks
  };
}
