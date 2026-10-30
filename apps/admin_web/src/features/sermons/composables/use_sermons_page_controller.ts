import type { Sermon } from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref } from "vue";

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
import { useSelectedSermonErrorMessage } from "./use_sermon_command_feedback";
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
    manualManuscriptImportPending,
    manualManuscriptImportError,
    transcriptImportPending,
    transcriptImportError,
    reviewChecks,
    isReviewReady,
    canCreateManualSermon,
    cleanedOutline,
    cleanedReferences,
    applySermonToDetail,
    resetManualSermonForm: resetManualSermonFields,
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
        resetManualSermonFields();
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

  const sermonRecordCommandPending = computed(
    () =>
      updateMutation.isPending.value ||
      submitReviewMutation.isPending.value ||
      saveAndReviewMutation.isPending.value ||
      saveAndPublishMutation.isPending.value ||
      returnDraftMutation.isPending.value ||
      markFailedMutation.isPending.value ||
      publishMutation.isPending.value ||
      archiveMutation.isPending.value ||
      deleteMutation.isPending.value
  );

  const {
    selectedAudioFile,
    pendingAudioFile,
    pendingAudioValidation,
    canUploadAudio,
    canDeleteAudio,
    canLoadAudioPreview,
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
    otherWritePending: sermonRecordCommandPending,
    applySermonResult: applyServerSermonResult,
    resetList: refreshList
  });

  const sermonWritePending = computed(
    () =>
      sermonRecordCommandPending.value ||
      uploadAudioMutation.isPending.value ||
      deleteAudioMutation.isPending.value
  );

  const sermonRecordMutations = [
    updateMutation,
    submitReviewMutation,
    saveAndReviewMutation,
    saveAndPublishMutation,
    returnDraftMutation,
    markFailedMutation,
    publishMutation,
    archiveMutation,
    deleteMutation
  ];
  const sermonMutationErrorMessage = useSelectedSermonErrorMessage(
    selectedSermon,
    sermonRecordMutations,
    t("common.error")
  );
  const sermonAudioErrorMessage = useSelectedSermonErrorMessage(
    selectedSermon,
    [uploadAudioMutation, loadAudioPreviewMutation, deleteAudioMutation],
    t("common.error")
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
    if (action.disabled || sermonWritePending.value) {
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
      manualManuscriptImportPending.value ||
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

  function resetManualSermonForm() {
    resetManualSermonFields();
    createManualSermonMutation.reset();
  }

  function saveCurrentSermon() {
    if (
      !selectedSermon.value ||
      !authStore.can("sermons:update") ||
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
      sermonWritePending.value
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
    canDeleteAudio,
    canLoadAudioPreview,
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
    manualManuscriptImportError,
    manualManuscriptImportPending,
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
    transcriptImportError,
    transcriptImportPending,
    sermonAiResource,
    sermonAudioErrorMessage,
    sermonSummaryAiInput,
    sermonOutlineAiInput,
    sermonMutationErrorMessage,
    sermonPipelineProgress,
    sermonPipelineSteps,
    sermonWorkflowRefreshing,
    sermonWritePending,
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
