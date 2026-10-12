import type {
  AdminPrayerRequest,
  PrayerStatus,
  PrayerVisibility
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  approvePrayerRequest,
  archivePrayerRequest,
  deletePrayerRequest,
  hidePrayerRequest,
  listPrayerRequests,
  updatePrayerRequest
} from "@/core/api/prayer_requests";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  createPrayerModerationForm,
  fillPrayerModerationForm,
  prayerApprovalPayload,
  prayerModerationPayload
} from "../prayer_workspace_models";

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
  const filters = reactive({
    query: "",
    status: "" as PrayerStatus | "",
    visibility: "" as PrayerVisibility | "",
    groupId: ""
  });
  const form = reactive(createPrayerModerationForm());
  const activeFilters = computed(() => ({ ...filters, limit: 50 }));
  const requestsQuery = useQuery({
    queryKey: ["prayer-requests", activeFilters],
    queryFn: () => listPrayerRequests(activeFilters.value)
  });
  const requests = computed(() => requestsQuery.data.value ?? []);
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

  function selectedOrThrow() {
    if (!canModerate.value) {
      throw new Error(t("Prayer moderate access required"));
    }
    return requireSelected(
      selectedRequest.value,
      t("No prayer request selected.")
    );
  }
  async function refreshSelected(request: AdminPrayerRequest, message: string) {
    openRequest(request);
    successMessage.value = message;
    await queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
  }

  const updateMutation = useMutation({
    onMutate: clearMutationError,
    mutationFn: () =>
      updatePrayerRequest(
        selectedOrThrow().id,
        prayerModerationPayload(form)
      ),
    onSuccess: (request) =>
      refreshSelected(request, t("Prayer moderation saved.")),
    onError: captureMutationError
  });
  const approveMutation = useMutation({
    onMutate: clearMutationError,
    mutationFn: () =>
      approvePrayerRequest(selectedOrThrow().id, prayerApprovalPayload(form)),
    onSuccess: (request) => refreshSelected(request, t("Prayer approved.")),
    onError: captureMutationError
  });
  const hideMutation = useMutation({
    onMutate: clearMutationError,
    mutationFn: () =>
      hidePrayerRequest(selectedOrThrow().id, form.moderationNote.trim()),
    onSuccess: (request) => refreshSelected(request, t("Prayer hidden.")),
    onError: captureMutationError
  });
  const archiveMutation = useMutation({
    onMutate: clearMutationError,
    mutationFn: () => archivePrayerRequest(selectedOrThrow().id),
    onSuccess: (request) => refreshSelected(request, t("Prayer archived.")),
    onError: captureMutationError
  });
  const deleteMutation = useMutation({
    onMutate: clearMutationError,
    mutationFn: () => deletePrayerRequest(selectedOrThrow().id),
    onSuccess: async () => {
      selectedRequest.value = null;
      drawer.value = false;
      successMessage.value = t("Prayer deleted.");
      await queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    },
    onError: captureMutationError
  });
  const errorMessage = computed(() => {
    const queryError = requestsQuery.error.value;
    return queryError
      ? formatApiErrorMessage(queryError, t("common.error"))
      : mutationErrorMessage.value;
  });

  function openRequest(request: AdminPrayerRequest) {
    selectedRequest.value = request;
    fillPrayerModerationForm(form, request);
    drawer.value = true;
  }
  function mutateWhen(allowed: boolean, action: () => void) {
    if (canModerate.value && allowed) action();
  }

  function clearMutationError() {
    mutationErrorMessage.value = "";
  }

  function captureMutationError(error: unknown) {
    mutationErrorMessage.value = formatApiErrorMessage(
      error,
      t("common.error")
    );
  }

  return {
    approve: () =>
      mutateWhen(canUpdate.value && !approveMutation.isPending.value, () =>
        approveMutation.mutate()
      ),
    approveMutation,
    archive: () =>
      mutateWhen(!archiveMutation.isPending.value, () =>
        archiveMutation.mutate()
      ),
    archiveMutation,
    canModerate,
    canUpdate,
    deleteMutation,
    deleteSelected: () =>
      mutateWhen(!deleteMutation.isPending.value, () =>
        deleteMutation.mutate()
      ),
    drawer,
    errorMessage,
    filters,
    form,
    hide: () =>
      mutateWhen(!hideMutation.isPending.value, () => hideMutation.mutate()),
    hideMutation,
    openRequest,
    optionItems,
    pendingCount,
    privateCount,
    requests,
    requestsQuery,
    save: () =>
      mutateWhen(canUpdate.value && !updateMutation.isPending.value, () =>
        updateMutation.mutate()
      ),
    selectedRequest,
    successMessage,
    successVisible,
    t,
    updateMutation
  };
}
