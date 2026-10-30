import type {
  SermonDiscussionGuide,
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionGuideUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createSermonDiscussionGuide,
  hideSermonDiscussionResponse,
  updateSermonDiscussionGuide
} from "@/core/api/sermon_discussion_guides";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  canSubmitSermonDiscussionGuide,
  createSermonDiscussionGuideForm,
  createSermonDiscussionLocalIdFactory,
  fillSermonDiscussionGuideForm,
  guideStatusColor,
  resetSermonDiscussionGuideForm,
  sermonDiscussionCommandTargetsSelection,
  sermonDiscussionGuideContentLocked,
  sermonDiscussionGuidePayload,
  sermonDiscussionGuideStatusOptions
} from "../sermon_discussion_guide_workspace_models";
import { useSermonDiscussionGuideQueries } from "./use_sermon_discussion_guide_queries";

type GuideSaveIntent =
  | {
      guideId: null;
      payload: SermonDiscussionGuideCreateRequest;
      type: "create";
    }
  | {
      guideId: string;
      payload: SermonDiscussionGuideUpdateRequest;
      type: "update";
    };

type HideResponseIntent = {
  guideId: string;
  responseId: string;
};

export function useSermonDiscussionGuidesPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedGuide = ref<SermonDiscussionGuide | null>(null);
  const activePanel = ref<"guide" | "responses">("guide");
  const hidingResponseId = ref<string | null>(null);
  const saveErrorMessage = ref("");
  const hideResponseErrorMessage = ref("");
  const nextLocalId = createSermonDiscussionLocalIdFactory();
  const guideForm = reactive(createSermonDiscussionGuideForm());
  const queries = useSermonDiscussionGuideQueries(selectedGuide);
  const canManage = computed(() => authStore.can("sermon_guides:manage"));
  const canUseAi = computed(() => authStore.can("ai:use"));

  const availableGuideStatusOptions = computed(() =>
    sermonDiscussionGuideStatusOptions(selectedGuide.value)
  );
  const guideContentLocked = computed(() =>
    sermonDiscussionGuideContentLocked(selectedGuide.value, guideForm.status)
  );
  const canSaveGuide = computed(() =>
    canSubmitSermonDiscussionGuide(
      canManage.value,
      guideForm,
      selectedGuide.value?.id ?? null
    )
  );
  const guideErrorMessage = queryErrorMessage(
    queries.guidesInitialError,
    "common.error"
  );
  const guideRefreshErrorMessage = queryErrorMessage(
    queries.guidesRefreshError,
    "sermonGuides.libraryRefreshFailed"
  );
  const responseErrorMessage = queryErrorMessage(
    queries.responsesInitialError,
    "common.error"
  );
  const responseRefreshErrorMessage = queryErrorMessage(
    queries.responsesRefreshError,
    "sermonGuides.responsesRefreshFailed"
  );

  const saveGuideMutation = useMutation({
    mutationFn: (intent: GuideSaveIntent) => {
      if (intent.type === "create") {
        return createSermonDiscussionGuide(intent.payload);
      }
      return updateSermonDiscussionGuide(intent.guideId, intent.payload);
    },
    onSuccess: async (guide, intent) => {
      if (
        sermonDiscussionCommandTargetsSelection(
          selectedGuide.value?.id ?? null,
          intent.guideId
        )
      ) {
        selectGuide(guide);
      }
      await queryClient.invalidateQueries({
        queryKey: ["sermon-discussion-guides"]
      });
    },
    onError: (error, intent) => {
      if (
        sermonDiscussionCommandTargetsSelection(
          selectedGuide.value?.id ?? null,
          intent.guideId
        )
      ) {
        saveErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  const hideResponseMutation = useMutation({
    mutationFn: (intent: HideResponseIntent) =>
      hideSermonDiscussionResponse(intent.responseId),
    onMutate: (intent) => {
      hideResponseErrorMessage.value = "";
      hidingResponseId.value = intent.responseId;
    },
    onSuccess: async (_response, intent) => {
      await queryClient.invalidateQueries({
        queryKey: ["sermon-discussion-responses", intent.guideId]
      });
    },
    onError: (error, intent) => {
      if (selectedGuide.value?.id === intent.guideId) {
        hideResponseErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    },
    onSettled: (_data, _error, intent) => {
      if (hidingResponseId.value === intent.responseId) {
        hidingResponseId.value = null;
      }
    }
  });

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

  function selectGuide(guide: SermonDiscussionGuide) {
    clearCommandErrors();
    selectedGuide.value = guide;
    fillSermonDiscussionGuideForm(guideForm, guide);
  }

  function newGuide() {
    clearCommandErrors();
    selectedGuide.value = null;
    activePanel.value = "guide";
    resetSermonDiscussionGuideForm(guideForm);
  }

  function saveGuide() {
    if (!canSaveGuide.value || saveGuideMutation.isPending.value) return;
    saveErrorMessage.value = "";
    const payload = sermonDiscussionGuidePayload(guideForm, nextLocalId);
    const guide = selectedGuide.value;
    if (!guide) {
      saveGuideMutation.mutate({ type: "create", guideId: null, payload });
      return;
    }
    const { sermonId: _sermonId, ...updatePayload } = payload;
    saveGuideMutation.mutate({
      type: "update",
      guideId: guide.id,
      payload: { ...updatePayload, expectedRevision: guide.revision }
    });
  }

  function hideResponse(responseId: string) {
    if (
      !canManage.value ||
      hideResponseMutation.isPending.value ||
      !selectedGuide.value ||
      !responseId
    ) {
      return;
    }
    hideResponseMutation.mutate({
      guideId: selectedGuide.value.id,
      responseId
    });
  }

  function addQuestion() {
    guideForm.questions.push({
      id: nextLocalId("question"),
      type: "application",
      prompt: "",
      sort: guideForm.questions.length,
      startSeconds: null
    });
  }

  function addActionStep() {
    guideForm.actionSteps.push({
      id: nextLocalId("action"),
      title: "",
      description: "",
      sort: guideForm.actionSteps.length
    });
  }

  function clearCommandErrors() {
    saveErrorMessage.value = "";
    hideResponseErrorMessage.value = "";
  }

  return {
    activePanel,
    addActionStep,
    addPrayerPrompt: () => guideForm.prayerPrompts.push(""),
    addQuestion,
    applyGuideFilters: queries.applyGuideFilters,
    applyResponseFilters: queries.applyResponseFilters,
    availableGuideStatusOptions,
    canManage,
    canSaveGuide,
    canUseAi,
    filters: queries.filters,
    guideContentLocked,
    guideErrorMessage,
    guideForm,
    guideRefreshErrorMessage,
    guideStatusColor,
    guides: queries.guides,
    guidesQuery: queries.guidesQuery,
    hideResponse,
    hideResponseErrorMessage,
    hidingResponseId,
    newGuide,
    optionItems,
    removeActionStep: (index: number) => guideForm.actionSteps.splice(index, 1),
    removePrayerPrompt: (index: number) =>
      guideForm.prayerPrompts.splice(index, 1),
    removeQuestion: (index: number) => guideForm.questions.splice(index, 1),
    responseErrorMessage,
    responseFilters: queries.responseFilters,
    responseRefreshErrorMessage,
    responses: queries.responses,
    responsesQuery: queries.responsesQuery,
    saveErrorMessage,
    saveGuide,
    saveGuideMutation,
    selectedGuide,
    selectGuide,
    t
  };
}
