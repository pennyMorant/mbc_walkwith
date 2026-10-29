import type {
  NewcomerConversionStatus,
  NewcomerFollowUpCreateRequest,
  NewcomerFollowUpStatus,
  NewcomerProfile,
  NewcomerStatus,
  NewcomerUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createNewcomerFollowUp,
  getNewcomer,
  listNewcomerFollowUps,
  updateNewcomer
} from "@/core/api/newcomers";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  dateTimeInputToIso,
  isoToDateTimeInput
} from "../newcomer_presenters";
import {
  newcomerFollowUpHasRequiredSchedule,
  newcomerResultTargetsSelection
} from "../newcomer_workspace_models";
import { useNewcomerListQuery } from "./use_newcomer_list_query";

export function useNewcomerPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();

  const selectedNewcomer = ref<NewcomerProfile | null>(null);
  const mutationErrorMessage = ref("");
  const form = reactive({
    status: "new" as NewcomerStatus,
    assigneeName: "",
    preferredLanguage: "",
    interest: "",
    nextFollowUpAt: "",
    conversionStatus: "none" as NewcomerConversionStatus,
    linkedMemberUserId: ""
  });
  const followUpForm = reactive({
    note: "",
    status: "completed" as NewcomerFollowUpStatus,
    plannedAt: ""
  });

  const listQuery = useNewcomerListQuery(queryClient);
  const {
    applyFilters,
    clearFilters,
    filters,
    newcomers,
    newcomersQuery,
    refreshList
  } = listQuery;
  const followUpsQuery = useQuery({
    queryKey: computed(() => [
      "newcomer-follow-ups",
      selectedNewcomer.value?.id
    ]),
    queryFn: ({ queryKey }) => listNewcomerFollowUps(queryKey[1] as string),
    enabled: computed(() => Boolean(selectedNewcomer.value))
  });

  const updateMutation = useMutation({
    onMutate: () => {
      clearMutationError();
      return { newcomerId: selectedNewcomer.value?.id ?? null };
    },
    mutationFn: () => {
      const newcomer = requireSelected(
        selectedNewcomer.value,
        t("No newcomer selected.")
      );
      if (!canSave.value) {
        throw new Error(t("Newcomer manage access required"));
      }
      return updateNewcomer(newcomer.id, buildNewcomerPayload());
    },
    onSuccess: async (newcomer, _variables, context) => {
      if (
        context?.newcomerId === newcomer.id &&
        newcomerResultTargetsSelection(
          selectedNewcomer.value?.id ?? null,
          newcomer.id
        )
      ) {
        selectedNewcomer.value = newcomer;
      }
      await queryClient.invalidateQueries({ queryKey: ["newcomers"] });
    },
    onError: (error, _variables, context) => {
      if (context?.newcomerId === (selectedNewcomer.value?.id ?? null)) {
        captureMutationError(error);
      }
    }
  });

  const followUpMutation = useMutation({
    onMutate: () => {
      clearMutationError();
      return { newcomerId: selectedNewcomer.value?.id ?? null };
    },
    mutationFn: () => {
      const newcomer = requireSelected(
        selectedNewcomer.value,
        t("No newcomer selected.")
      );
      if (!canCreateFollowUp.value) {
        throw new Error(t("Newcomer manage access required"));
      }
      return createNewcomerFollowUp(newcomer.id, buildFollowUpPayload());
    },
    onSuccess: async (followUp, _variables, context) => {
      try {
        if (
          context?.newcomerId === followUp.newcomerId &&
          newcomerResultTargetsSelection(
            selectedNewcomer.value?.id ?? null,
            followUp.newcomerId
          )
        ) {
          const refreshed = await getNewcomer(followUp.newcomerId);
          if (
            newcomerResultTargetsSelection(
              selectedNewcomer.value?.id ?? null,
              refreshed.id
            )
          ) {
            selectedNewcomer.value = refreshed;
          }
        }
        if (context?.newcomerId === selectedNewcomer.value?.id) {
          resetFollowUpForm();
        }
      } finally {
        await queryClient.invalidateQueries({ queryKey: ["newcomers"] });
        await queryClient.invalidateQueries({
          queryKey: ["newcomer-follow-ups"]
        });
      }
    },
    onError: (error, _variables, context) => {
      if (context?.newcomerId === (selectedNewcomer.value?.id ?? null)) {
        captureMutationError(error);
      }
    }
  });

  const followUps = computed(() => followUpsQuery.data.value ?? []);
  const canManage = computed(() => authStore.can("newcomers:manage"));
  const newCount = computed(
    () => newcomers.value.filter((item) => item.status === "new").length
  );
  const assignedCount = computed(
    () =>
      newcomers.value.filter((item) =>
        ["assigned", "contacted", "visited"].includes(item.status)
      ).length
  );
  const discipleshipCount = computed(
    () =>
      newcomers.value.filter((item) => item.status === "in_discipleship")
        .length
  );
  const drawer = computed({
    get: () => Boolean(selectedNewcomer.value),
    set: (value: boolean) => {
      if (!value) {
        clearMutationError();
        selectedNewcomer.value = null;
      }
    }
  });
  const canSave = computed(
    () => Boolean(selectedNewcomer.value && canManage.value)
  );
  const canCreateFollowUp = computed(() => {
    const plannedAt = dateTimeInputToIso(followUpForm.plannedAt);
    return (
      Boolean(selectedNewcomer.value && canManage.value) &&
      followUpForm.note.trim().length > 0 &&
      newcomerFollowUpHasRequiredSchedule(followUpForm.status, plannedAt)
    );
  });
  const listErrorMessage = computed(() =>
    listQuery.initialError.value
      ? formatApiErrorMessage(listQuery.initialError.value, t("common.error"))
      : ""
  );
  const listRefreshErrorMessage = computed(() =>
    listQuery.refreshError.value
      ? formatApiErrorMessage(
          listQuery.refreshError.value,
          t("newcomers.refreshFailed")
        )
      : ""
  );
  const followUpsInitialErrorMessage = computed(() =>
    followUpsQuery.data.value === undefined && followUpsQuery.error.value
      ? formatApiErrorMessage(followUpsQuery.error.value, t("common.error"))
      : ""
  );
  const followUpsRefreshErrorMessage = computed(() =>
    followUpsQuery.data.value !== undefined && followUpsQuery.error.value
      ? formatApiErrorMessage(followUpsQuery.error.value, t("common.error"))
      : ""
  );

  watch(selectedNewcomer, (newcomer) => {
    if (!newcomer) return;
    form.status = newcomer.status;
    form.assigneeName = newcomer.assigneeName;
    form.preferredLanguage = newcomer.preferredLanguage;
    form.interest = newcomer.interest;
    form.nextFollowUpAt = isoToDateTimeInput(newcomer.nextFollowUpAt);
    form.conversionStatus = newcomer.conversionStatus;
    form.linkedMemberUserId = newcomer.linkedMemberUserId ?? "";
  });

  function openNewcomer(newcomer: NewcomerProfile) {
    clearMutationError();
    resetFollowUpForm();
    selectedNewcomer.value = newcomer;
  }

  function buildNewcomerPayload(): NewcomerUpdateRequest {
    return {
      status: form.status,
      assigneeName: form.assigneeName.trim(),
      preferredLanguage: form.preferredLanguage.trim(),
      interest: form.interest.trim(),
      nextFollowUpAt: dateTimeInputToIso(form.nextFollowUpAt),
      conversionStatus: form.conversionStatus,
      linkedMemberUserId: form.linkedMemberUserId.trim() || null
    };
  }

  function buildFollowUpPayload(): NewcomerFollowUpCreateRequest {
    return {
      note: followUpForm.note.trim(),
      status: followUpForm.status,
      plannedAt: dateTimeInputToIso(followUpForm.plannedAt)
    };
  }

  function saveNewcomer() {
    if (canSave.value && !updateMutation.isPending.value) {
      updateMutation.mutate();
    }
  }

  function addFollowUp() {
    if (canCreateFollowUp.value && !followUpMutation.isPending.value) {
      followUpMutation.mutate();
    }
  }

  function resetFollowUpForm() {
    followUpForm.note = "";
    followUpForm.status = "completed";
    followUpForm.plannedAt = "";
  }

  function clearMutationError() {
    mutationErrorMessage.value = "";
  }

  function captureMutationError(error: unknown) {
    mutationErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
  }

  return {
    addFollowUp,
    applyFilters,
    assignedCount,
    canCreateFollowUp,
    canManage,
    canSave,
    discipleshipCount,
    drawer,
    clearFilters,
    filters,
    followUpForm,
    followUpMutation,
    followUps,
    followUpsInitialErrorMessage,
    followUpsQuery,
    followUpsRefreshErrorMessage,
    form,
    newCount,
    newcomers,
    newcomersQuery,
    listErrorMessage,
    listRefreshErrorMessage,
    mutationErrorMessage,
    openNewcomer,
    refreshList,
    saveNewcomer,
    selectedNewcomer,
    updateMutation
  };
}
