import type {
  MediaAsset,
  MediaAssetUpdateRequest,
  MediaCleanupTask
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  listMediaAssetUsages,
  retryMediaCleanupTask,
  updateMediaAsset,
  uploadMediaImage
} from "@/core/api/media";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import { mediaCommandTargetsSelection } from "../media_workspace_models";
import {
  useMediaCleanupQuery,
  useMediaLibraryQuery
} from "./use_media_queries";

type MediaUpdateIntent = {
  assetId: string;
  input: MediaAssetUpdateRequest;
};

export function useMediaPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const canRead = computed(() => authStore.can("media:read"));
  const canManage = computed(() => authStore.can("media:manage"));
  const library = useMediaLibraryQuery(queryClient);
  const cleanup = useMediaCleanupQuery(queryClient, canRead);
  const selectedAsset = ref<MediaAsset | null>(null);
  const editDialog = ref(false);
  const uploadErrorMessage = ref("");
  const updateErrorMessage = ref("");
  const cleanupRetryErrorMessage = ref("");
  const retryingTaskId = ref<string | null>(null);

  const usageQuery = useQuery({
    queryKey: [
      "admin-media-asset-usages",
      computed(() => selectedAsset.value?.id ?? "")
    ],
    enabled: computed(() => editDialog.value && Boolean(selectedAsset.value)),
    queryFn: ({ queryKey }) => listMediaAssetUsages(queryKey[1] as string)
  });
  const usages = computed(() => usageQuery.data.value ?? []);

  const updateMutation = useMutation({
    onMutate: () => {
      updateErrorMessage.value = "";
    },
    mutationFn: (intent: MediaUpdateIntent) =>
      updateMediaAsset(intent.assetId, intent.input),
    onSuccess: async (asset, intent) => {
      if (
        mediaCommandTargetsSelection(
          selectedAsset.value?.id ?? null,
          editDialog.value,
          intent.assetId
        )
      ) {
        selectedAsset.value = asset;
        editDialog.value = false;
      }
      await queryClient.invalidateQueries({
        queryKey: ["admin-media-assets"]
      });
    },
    onError: (error, intent) => {
      if (
        mediaCommandTargetsSelection(
          selectedAsset.value?.id ?? null,
          editDialog.value,
          intent.assetId
        )
      ) {
        updateErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  const uploadMutation = useMutation({
    onMutate: () => {
      uploadErrorMessage.value = "";
    },
    mutationFn: (file: File) => uploadMediaImage(file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-media-assets"] }),
    onError: (error) => {
      uploadErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  });

  const retryMutation = useMutation({
    onMutate: (taskId: string) => {
      cleanupRetryErrorMessage.value = "";
      retryingTaskId.value = taskId;
    },
    mutationFn: retryMediaCleanupTask,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin-media-cleanup-tasks"]
      }),
    onError: (error, taskId) => {
      if (retryingTaskId.value === taskId) {
        cleanupRetryErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    },
    onSettled: (_data, _error, taskId) => {
      if (retryingTaskId.value === taskId) retryingTaskId.value = null;
    }
  });

  const libraryErrorMessage = queryErrorMessage(
    library.initialError,
    "common.error"
  );
  const libraryRefreshErrorMessage = queryErrorMessage(
    library.refreshError,
    "media.libraryRefreshFailed"
  );
  const cleanupErrorMessage = queryErrorMessage(
    cleanup.initialError,
    "common.error"
  );
  const cleanupRefreshErrorMessage = queryErrorMessage(
    cleanup.refreshError,
    "media.cleanupRefreshFailed"
  );
  const usagesErrorMessage = computed(() =>
    usageQuery.data.value === undefined && usageQuery.error.value
      ? formatApiErrorMessage(usageQuery.error.value, t("common.error"))
      : ""
  );
  const usagesRefreshErrorMessage = computed(() =>
    usageQuery.data.value !== undefined && usageQuery.error.value
      ? formatApiErrorMessage(
          usageQuery.error.value,
          t("media.usagesRefreshFailed")
        )
      : ""
  );

  function queryErrorMessage(
    error: { value: unknown },
    fallbackKey: string
  ) {
    return computed(() =>
      error.value
        ? formatApiErrorMessage(error.value, t(fallbackKey))
        : ""
    );
  }

  function edit(asset: MediaAsset) {
    updateErrorMessage.value = "";
    selectedAsset.value = asset;
    editDialog.value = true;
  }

  function save(input: MediaAssetUpdateRequest) {
    if (
      !selectedAsset.value ||
      !canManage.value ||
      updateMutation.isPending.value
    ) {
      return;
    }
    updateMutation.mutate({
      assetId: selectedAsset.value.id,
      input: { ...input }
    });
  }

  function upload(file: File) {
    if (!canManage.value || uploadMutation.isPending.value) return;
    uploadMutation.mutate(file);
  }

  function retryCleanup(task: MediaCleanupTask) {
    if (!canManage.value || retryMutation.isPending.value || !task.retryable) {
      return;
    }
    retryMutation.mutate(task.id);
  }

  watch(editDialog, (open) => {
    if (!open) updateErrorMessage.value = "";
  });

  return {
    applyCleanupStatus: cleanup.applyStatus,
    applyLibraryFilters: library.applyFilters,
    assets: library.assets,
    assetsQuery: library.assetsQuery,
    canManage,
    canRead,
    cleanupQuery: cleanup.cleanupQuery,
    cleanupStatus: cleanup.status,
    cleanupTasks: cleanup.tasks,
    cleanupErrorMessage,
    cleanupRefreshErrorMessage,
    cleanupRetryErrorMessage,
    clearLibraryFilters: library.clearFilters,
    edit,
    editDialog,
    libraryFilters: library.filters,
    libraryErrorMessage,
    libraryRefreshErrorMessage,
    refreshCleanup: cleanup.refresh,
    refreshLibrary: library.refresh,
    retryCleanup,
    retryMutation,
    retryingTaskId,
    save,
    selectedAsset,
    t,
    updateErrorMessage,
    updateMutation,
    upload,
    uploadErrorMessage,
    uploadMutation,
    usageQuery,
    usages,
    usagesErrorMessage,
    usagesRefreshErrorMessage
  };
}
