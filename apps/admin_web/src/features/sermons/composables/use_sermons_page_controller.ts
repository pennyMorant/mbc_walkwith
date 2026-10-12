import type { Sermon } from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createLocalSermonDraft,
  updateAdminSermon
} from "@/core/api/sermons";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import { sermonStatusColor, type SermonPipelineAction } from "../sermon_pipeline";
import {
  isManualSermonCreateViewCurrent,
  manualSermonCreateIntent,
  sameManualSermonCreateIntent,
  sameSermonUpdateIntent,
  sermonCommandIntent,
  sermonUpdateIntent,
  type SermonUpdateIntent
} from "../sermon_mutation_models";
import { useSermonAiDrafts } from "./use_sermon_ai_drafts";
import { useSermonAudioState } from "./use_sermon_audio_state";
import { useSermonEditorForms } from "./use_sermon_editor_forms";
import { useSermonLibraryQuery } from "./use_sermon_library_query";
import { useSermonPipelineState } from "./use_sermon_pipeline_state";
import { useSermonStatusMutations } from "./use_sermon_status_mutations";
import { useSermonWorkflow } from "./use_sermon_workflow";

export function useSermonsPageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const selectedSermon = ref<Sermon | null>(null);
  const detailDrawer = ref(false);
  const activeDetailTab = ref("pipeline");
  const {
    filters,
    sermonsQuery,
    facetsQuery,
    topicOptions,
    sermons,
    nextCursor,
    resetList,
    refreshList,
    loadMore
  } = useSermonLibraryQuery(queryClient);

  const {
    editForm,
    manualSermonForm,
    selectedManualManuscriptFile,
    selectedTranscriptFile,
    reviewChecks,
    isReviewReady,
    canCreateManualSermon,
    cleanedOutline,
    cleanedReferences,
    applySermonToDetail,
    resetManualSermonForm,
    importManualManuscriptFile,
    importTranscriptFile,
    buildUpdatePayload,
    addOutlineItem,
    removeOutlineItem,
    moveOutlineItem,
    addReference,
    removeReference
  } = useSermonEditorForms({ selectedSermon, authStore, t });

  const {
    sermonWorkflowRefreshing,
    refreshSelectedSermonWorkflow
  } = useSermonWorkflow({
    selectedSermon,
    activeDetailTab,
    applySermonToDetail
  });

  const {
    selectedAudioFile,
    pendingAudioFile,
    pendingAudioValidation,
    canUploadAudio,
    audioPlaybackUrl,
    uploadAudioMutation,
    loadAudioPreviewMutation,
    deleteAudioMutation,
    uploadSelectedAudio,
    loadSelectedAudioPreview,
    deleteCurrentAudio,
    clearAudioPreviewForOtherSermon
  } = useSermonAudioState({
    selectedSermon,
    activeDetailTab,
    authStore,
    t,
    applySermonResult: applyServerSermonResult,
    resetList: refreshList
  });

  const {
    sermonAiResource,
    sermonSummaryAiInput,
    sermonOutlineAiInput,
    applySermonSummaryDraft,
    applySermonOutlineDraft
  } = useSermonAiDrafts({
    selectedSermon,
    editForm
  });

  function applyServerSermonResult(sermon: Sermon, replaceEditor = true) {
    if (selectedSermon.value?.id !== sermon.id) {
      return false;
    }
    if (replaceEditor) {
      const currentTab = activeDetailTab.value;
      applySermonToDetail(sermon);
      activeDetailTab.value = currentTab;
    } else {
      selectedSermon.value = sermon;
    }
    return true;
  }

  const createManualSermonMutation = useMutation({
    mutationFn: (intent: ReturnType<typeof manualSermonCreateIntent>) => {
      if (!authStore.can("sermons:create")) {
        throw new Error(t("Sermon create access required"));
      }
      return createLocalSermonDraft(intent.draft);
    },
    onSuccess: async (sermon, intent) => {
      if (sameManualSermonCreateIntent(manualSermonForm, intent)) {
        resetManualSermonForm();
      }
      if (
        isManualSermonCreateViewCurrent(
          selectedSermon.value,
          detailDrawer.value,
          intent
        )
      ) {
        openSermon(sermon);
        activeDetailTab.value = sermon.transcript?.text
          ? "transcript"
          : "metadata";
      }
      refreshList();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (intent: SermonUpdateIntent) => {
      if (!authStore.can("sermons:update")) {
        throw new Error(t("Sermon update access required"));
      }
      return updateAdminSermon(
        intent.sermonId,
        intent.revision,
        intent.payload
      );
    },
    onSuccess: async (sermon, intent) => {
      applyServerSermonResult(
        sermon,
        sameSermonUpdateIntent(
          selectedSermon.value,
          buildUpdatePayload(),
          intent
        )
      );
      refreshList();
    }
  });
  
  const {
    archiveMutation,
    deleteMutation,
    markFailedMutation,
    publishMutation,
    returnDraftMutation,
    saveAndPublishMutation,
    saveAndReviewMutation,
    submitReviewMutation
  } = useSermonStatusMutations({
    selectedSermon,
    detailDrawer,
    authStore,
    t,
    buildUpdatePayload,
    applySermonResult: applyServerSermonResult,
    refreshList
  });
  
  const sermonMutationErrorMessage = computed(() =>
    formatApiErrorMessage(
      updateMutation.error.value ||
        uploadAudioMutation.error.value ||
        loadAudioPreviewMutation.error.value ||
        deleteAudioMutation.error.value ||
        submitReviewMutation.error.value ||
        saveAndReviewMutation.error.value ||
        saveAndPublishMutation.error.value ||
        returnDraftMutation.error.value ||
        markFailedMutation.error.value ||
        publishMutation.error.value ||
        archiveMutation.error.value ||
        deleteMutation.error.value,
      t("common.error")
    )
  );
  const {
    sermonPipelineSteps,
    sermonPipelineProgress,
    nextSermonPipelineStep
  } = useSermonPipelineState({
    selectedSermon,
    editForm,
    authStore,
    t,
    cleanedOutline,
    cleanedReferences,
    reviewChecks,
    isReviewReady,
    saveAndReviewPending: saveAndReviewMutation.isPending,
    saveAndPublishPending: saveAndPublishMutation.isPending
  });
  function openSermon(sermon: Sermon) {
    clearAudioPreviewForOtherSermon(sermon.id);
    applySermonToDetail(sermon);
    activeDetailTab.value = "pipeline";
    detailDrawer.value = true;
  }
  
  function runPipelineAction(action: SermonPipelineAction) {
    if (action.disabled) {
      return;
    }
    if (action.id === "open_audio") {
      activeDetailTab.value = "audio";
      return;
    }
    if (action.id === "open_transcript") {
      activeDetailTab.value = "transcript";
      return;
    }
    if (action.id === "open_outline") {
      activeDetailTab.value = "outline";
      return;
    }
    if (action.id === "open_references") {
      activeDetailTab.value = "references";
      return;
    }
    if (action.id === "save_review") {
      saveCurrentSermonForReview();
      return;
    }
    saveAndPublishCurrentSermon();
  }

  function createManualSermon() {
    if (
      !canCreateManualSermon.value ||
      createManualSermonMutation.isPending.value
    ) {
      return;
    }
    createManualSermonMutation.mutate(
      manualSermonCreateIntent(manualSermonForm, {
        selectedSermonId: selectedSermon.value?.id ?? null,
        detailDrawerOpen: detailDrawer.value
      })
    );
  }

  function saveCurrentSermon() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      updateMutation.isPending.value
    ) {
      return;
    }
    updateMutation.mutate(
      sermonUpdateIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision,
        buildUpdatePayload()
      )
    );
  }

  function saveCurrentSermonForReview() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      !isReviewReady.value ||
      saveAndReviewMutation.isPending.value
    ) {
      return;
    }
    saveAndReviewMutation.mutate(
      sermonUpdateIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision,
        buildUpdatePayload("needs_review")
      )
    );
  }

  function saveAndPublishCurrentSermon() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      !authStore.can("sermons:publish") ||
      !isReviewReady.value ||
      saveAndPublishMutation.isPending.value
    ) {
      return;
    }
    saveAndPublishMutation.mutate(
      sermonUpdateIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision,
        buildUpdatePayload("published")
      )
    );
  }

  function submitCurrentSermonReview() {
    if (
      !selectedSermon.value ||
      selectedSermon.value.status === "needs_review" ||
      selectedSermon.value.status === "published" ||
      !authStore.can("sermons:update") ||
      !isReviewReady.value ||
      submitReviewMutation.isPending.value
    ) {
      return;
    }
    submitReviewMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  function publishCurrentSermon() {
    if (
      !selectedSermon.value ||
      selectedSermon.value.status === "published" ||
      !authStore.can("sermons:publish") ||
      !isReviewReady.value ||
      publishMutation.isPending.value
    ) {
      return;
    }
    publishMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  function returnCurrentSermonDraft() {
    if (
      !selectedSermon.value ||
      selectedSermon.value.status === "draft" ||
      !authStore.can("sermons:update") ||
      returnDraftMutation.isPending.value
    ) {
      return;
    }
    returnDraftMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  function markCurrentSermonFailed() {
    if (
      !selectedSermon.value ||
      selectedSermon.value.status === "failed" ||
      !authStore.can("sermons:update") ||
      markFailedMutation.isPending.value
    ) {
      return;
    }
    markFailedMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  function archiveCurrentSermon() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      archiveMutation.isPending.value
    ) {
      return;
    }
    archiveMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  function deleteCurrentSermon() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      deleteMutation.isPending.value
    ) {
      return;
    }
    deleteMutation.mutate(
      sermonCommandIntent(
        selectedSermon.value.id,
        selectedSermon.value.revision
      )
    );
  }

  return {
    activeDetailTab,
    addOutlineItem,
    addReference,
    archiveCurrentSermon,
    archiveMutation,
    audioPlaybackUrl,
    authStore,
    canCreateManualSermon,
    canUploadAudio,
    cleanedOutline,
    cleanedReferences,
    createManualSermon,
    createManualSermonMutation,
    deleteCurrentAudio,
    deleteCurrentSermon,
    deleteAudioMutation,
    deleteMutation,
    detailDrawer,
    editForm,
    filters,
    importManualManuscriptFile,
    importTranscriptFile,
    isReviewReady,
    loadAudioPreviewMutation,
    loadSelectedAudioPreview,
    loadMore,
    manualSermonForm,
    markCurrentSermonFailed,
    markFailedMutation,
    moveOutlineItem,
    nextCursor,
    nextSermonPipelineStep,
    openSermon,
    pendingAudioFile,
    pendingAudioValidation,
    publishCurrentSermon,
    publishMutation,
    refreshSelectedSermonWorkflow,
    removeOutlineItem,
    removeReference,
    resetList,
    refreshList,
    resetManualSermonForm,
    returnCurrentSermonDraft,
    returnDraftMutation,
    reviewChecks,
    runPipelineAction,
    saveAndPublishCurrentSermon,
    saveAndPublishMutation,
    saveCurrentSermon,
    saveCurrentSermonForReview,
    saveAndReviewMutation,
    selectedAudioFile,
    selectedManualManuscriptFile,
    selectedSermon,
    selectedTranscriptFile,
    sermonAiResource,
    sermonSummaryAiInput,
    sermonOutlineAiInput,
    sermonMutationErrorMessage,
    sermonPipelineProgress,
    sermonPipelineSteps,
    sermonWorkflowRefreshing,
    sermons,
    sermonsQuery,
    facetsQuery,
    topicOptions,
    statusColor: sermonStatusColor,
    submitCurrentSermonReview,
    submitReviewMutation,
    t,
    updateMutation,
    uploadSelectedAudio,
    uploadAudioMutation,
    applySermonSummaryDraft,
    applySermonOutlineDraft
  };
}
