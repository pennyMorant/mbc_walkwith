import type {
  AdminPrayerRequest,
  AdminPrayerRequestApproveRequest,
  AdminPrayerRequestUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  approvePrayerRequest,
  archivePrayerRequest,
  deletePrayerRequest,
  hidePrayerRequest,
  updatePrayerRequest
} from "@/core/api/prayer_requests";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  createPrayerModerationForm,
  fillPrayerModerationForm,
  prayerApprovalPayload,
  prayerCommandTargetsSelection,
  prayerModerationPayload
} from "../prayer_workspace_models";
import { usePrayerListQuery } from "./use_prayer_list_query";

type PrayerUpdateIntent = {
  requestId: string;
  payload: AdminPrayerRequestUpdateRequest;
};

type PrayerApproveIntent = {
  requestId: string;
  payload: AdminPrayerRequestApproveRequest;
};

type PrayerNoteIntent = { requestId: string; moderationNote: string };
type PrayerRequestIntent = { requestId: string };

export function usePrayerPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedRequest = ref<AdminPrayerRequest | null>(null);
  const drawer = ref(false);
  const successMessage = ref("");
  const mutationErrorMessage = ref("");
  const successVisible = computed({
    get: () => successMessage.value.length > 0,
    set: (visible: boolean) => {
      if (!visible) successMessage.value = "";
    }
  });
  const form = reactive(createPrayerModerationForm());
  const listQuery = usePrayerListQuery(queryClient);
  const {
    applyFilters,
    clearFilters,
    filters,
    refreshList,
    requests,
    requestsQuery
  } = listQuery;
  const canModerate = computed(() => authStore.can("prayer:moderate"));
  const canUpdate = computed(
    () =>
      canModerate.value &&
      Boolean(selectedRequest.value) &&
      (form.visibility !== "group" || form.groupId.trim().length > 0)
  );
  const pendingCount = computed(
    () => requests.value.filter((request) => request.status === "pending").length
  );
  const privateCount = computed(
    () =>
      requests.value.filter((request) => request.visibility === "private").length
  );
  const commandPending = computed(
    () =>
      updateMutation.isPending.value ||
      approveMutation.isPending.value ||
      hideMutation.isPending.value ||
      archiveMutation.isPending.value ||
      deleteMutation.isPending.value
  );
  const listErrorMessage = computed(() =>
    listQuery.initialError.value
      ? formatApiErrorMessage(listQuery.initialError.value, t("common.error"))
      : ""
  );
  const listRefreshErrorMessage = computed(() =>
    listQuery.refreshError.value
      ? formatApiErrorMessage(
          listQuery.refreshError.value,
          t("prayer.refreshFailed")
        )
      : ""
  );

  function selectedOrThrow() {
    if (!canModerate.value) {
      throw new Error(t("Prayer moderate access required"));
    }
    return requireSelected(
      selectedRequest.value,
      t("No prayer request selected.")
    );
  }
  async function completeCommand(
    request: AdminPrayerRequest,
    commandRequestId: string,
    message: string
  ) {
    if (
      request.id === commandRequestId &&
      prayerCommandTargetsSelection(
        selectedRequest.value?.id ?? null,
        drawer.value,
        commandRequestId
      )
    ) {
      selectedRequest.value = request;
      fillPrayerModerationForm(form, request);
    }
    successMessage.value = message;
    await queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
  }

  const updateMutation = useMutation({
    onMutate: () => clearMutationError(),
    mutationFn: (intent: PrayerUpdateIntent) =>
      updatePrayerRequest(intent.requestId, intent.payload),
    onSuccess: (request, intent) =>
      completeCommand(
        request,
        intent.requestId,
        t("Prayer moderation saved.")
      ),
    onError: (error, intent) => captureMutationError(error, intent.requestId)
  });
  const approveMutation = useMutation({
    onMutate: () => clearMutationError(),
    mutationFn: (intent: PrayerApproveIntent) =>
      approvePrayerRequest(intent.requestId, intent.payload),
    onSuccess: (request, intent) =>
      completeCommand(request, intent.requestId, t("Prayer approved.")),
    onError: (error, intent) => captureMutationError(error, intent.requestId)
  });
  const hideMutation = useMutation({
    onMutate: () => clearMutationError(),
    mutationFn: (intent: PrayerNoteIntent) =>
      hidePrayerRequest(intent.requestId, intent.moderationNote),
    onSuccess: (request, intent) =>
      completeCommand(request, intent.requestId, t("Prayer hidden.")),
    onError: (error, intent) => captureMutationError(error, intent.requestId)
  });
  const archiveMutation = useMutation({
    onMutate: () => clearMutationError(),
    mutationFn: (intent: PrayerRequestIntent) =>
      archivePrayerRequest(intent.requestId),
    onSuccess: (request, intent) =>
      completeCommand(request, intent.requestId, t("Prayer archived.")),
    onError: (error, intent) => captureMutationError(error, intent.requestId)
  });
  const deleteMutation = useMutation({
    onMutate: () => clearMutationError(),
    mutationFn: (intent: PrayerRequestIntent) =>
      deletePrayerRequest(intent.requestId),
    onSuccess: async (_result, intent) => {
      if (
        prayerCommandTargetsSelection(
          selectedRequest.value?.id ?? null,
          drawer.value,
          intent.requestId
        )
      ) {
        selectedRequest.value = null;
        drawer.value = false;
      }
      successMessage.value = t("Prayer deleted.");
      await queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    },
    onError: (error, intent) => captureMutationError(error, intent.requestId)
  });

  function openRequest(request: AdminPrayerRequest) {
    clearMutationError();
    selectedRequest.value = request;
    fillPrayerModerationForm(form, request);
    drawer.value = true;
  }
  function save() {
    if (!canUpdate.value || commandPending.value) return;
    const request = selectedOrThrow();
    updateMutation.mutate({
      requestId: request.id,
      payload: prayerModerationPayload(form)
    });
  }

  function approve() {
    if (!canUpdate.value || commandPending.value) return;
    const request = selectedOrThrow();
    approveMutation.mutate({
      requestId: request.id,
      payload: prayerApprovalPayload(form)
    });
  }

  function hide() {
    if (!canModerate.value || commandPending.value) return;
    const request = selectedOrThrow();
    hideMutation.mutate({
      requestId: request.id,
      moderationNote: form.moderationNote.trim()
    });
  }

  function archive() {
    if (!canModerate.value || commandPending.value) return;
    archiveMutation.mutate({ requestId: selectedOrThrow().id });
  }

  function deleteSelected() {
    if (!canModerate.value || commandPending.value) return;
    deleteMutation.mutate({ requestId: selectedOrThrow().id });
  }

  function clearMutationError() {
    mutationErrorMessage.value = "";
  }

  function captureMutationError(error: unknown, commandRequestId: string) {
    if (
      prayerCommandTargetsSelection(
        selectedRequest.value?.id ?? null,
        drawer.value,
        commandRequestId
      )
    ) {
      mutationErrorMessage.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }

  watch(drawer, (open) => {
    if (!open) clearMutationError();
  });

  return {
    applyFilters,
    approve,
    approveMutation,
    archive,
    archiveMutation,
    canModerate,
    canUpdate,
    clearFilters,
    commandPending,
    deleteMutation,
    deleteSelected,
    drawer,
    filters,
    form,
    hide,
    hideMutation,
    listErrorMessage,
    listRefreshErrorMessage,
    mutationErrorMessage,
    openRequest,
    optionItems,
    pendingCount,
    privateCount,
    requests,
    requestsQuery,
    refreshList,
    save,
    selectedRequest,
    successMessage,
    successVisible,
    t,
    updateMutation
  };
}
