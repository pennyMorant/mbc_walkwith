<script setup lang="ts">
import { getAdminSermon } from "@/core/api/sermons";
import { useAdminResourceDeepLink } from "@/core/navigation/use_admin_resource_deep_link";
import AdminDeepLinkState from "@/core/ui/AdminDeepLinkState.vue";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import AdminAiDraftPanel from "../../ai/components/AdminAiDraftPanel.vue";
import ContentLocalizationCard from "../../content-localization/components/ContentLocalizationCard.vue";
import SermonAudioCleanupCard from "../components/SermonAudioCleanupCard.vue";
import SermonAudioTab from "../components/SermonAudioTab.vue";
import SermonEditorActions from "../components/SermonEditorActions.vue";
import SermonLibraryCard from "../components/SermonLibraryCard.vue";
import SermonManualDraftCard from "../components/SermonManualDraftCard.vue";
import SermonMetadataTab from "../components/SermonMetadataTab.vue";
import SermonOutlineTab from "../components/SermonOutlineTab.vue";
import SermonPipelineTab from "../components/SermonPipelineTab.vue";
import SermonReferencesTab from "../components/SermonReferencesTab.vue";
import SermonReviewTab from "../components/SermonReviewTab.vue";
import SermonTranscriptTab from "../components/SermonTranscriptTab.vue";
import { useSermonsPageController } from "../composables/use_sermons_page_controller";

const {
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
  facetsQuery,
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
  refreshList,
  refreshSelectedSermonWorkflow,
  removeOutlineItem,
  removeReference,
  resetList,
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
  topicOptions,
  statusColor,
  submitCurrentSermonReview,
  submitReviewMutation,
  t,
  updateMutation,
  uploadSelectedAudio,
  uploadAudioMutation,
  applySermonSummaryDraft,
  applySermonOutlineDraft
} = useSermonsPageController();
const deepLink = useAdminResourceDeepLink(getAdminSermon, openSermon);
</script>

<template>
  <div>
    <AdminDeepLinkState
      :pending="deepLink.pending.value"
      :error-message="deepLink.error.value ? t('nav.openResourceFailed') : ''"
      :retry-label="t('common.refresh')"
      @retry="deepLink.retry"
    />
    <AdminPageHeader :title="t('nav.sermons')" :subtitle="t('sermons.subtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="sermonsQuery.isFetching.value"
          @refresh="refreshList"
        />
      </template>
    </AdminPageHeader>

    <v-row class="mt-6" dense>
      <v-col cols="12" lg="4">
        <SermonManualDraftCard
          v-if="authStore.can('sermons:create')"
          v-model="selectedManualManuscriptFile"
          :form="manualSermonForm"
          :can-create="canCreateManualSermon"
          :loading="createManualSermonMutation.isPending.value"
          :error="createManualSermonMutation.error.value"
          :import-pending="manualManuscriptImportPending"
          :import-error="manualManuscriptImportError"
          :topic-options="topicOptions"
          :topics-loading="facetsQuery.isPending.value"
          @import-manuscript-file="importManualManuscriptFile"
          @reset="resetManualSermonForm"
          @submit="createManualSermon"
        />
        <v-alert v-else type="info" variant="tonal">
          {{ t("sermons.noImportPermission") }}
        </v-alert>
      </v-col>

      <v-col cols="12" lg="8">
        <SermonLibraryCard
          :filters="filters"
          :sermons="sermons"
          :pending="sermonsQuery.isPending.value"
          :fetching="sermonsQuery.isFetching.value"
          :error="sermonsQuery.error.value"
          :has-more="Boolean(nextCursor)"
          :topic-options="topicOptions"
          :topics-loading="facetsQuery.isPending.value"
          @search="resetList"
          @load-more="loadMore"
          @open="openSermon"
        />
      </v-col>
    </v-row>

    <SermonAudioCleanupCard />

    <AdminResponsiveDrawer
      v-model="detailDrawer"
      :desktop-width="640"
    >
      <div v-if="selectedSermon" class="pa-5">
        <AdminDrawerHeader
          :title="selectedSermon.title"
          :subtitle="`${selectedSermon.speaker} · ${selectedSermon.sermonDate}`"
          :close-label="t('common.close')"
          @close="detailDrawer = false"
        >
          <template #meta>
            <v-chip :color="statusColor(selectedSermon.status)">
              {{ t(selectedSermon.status) }}
            </v-chip>
          </template>
        </AdminDrawerHeader>

        <v-form class="mt-5" @submit.prevent="saveCurrentSermon">
          <v-tabs v-model="activeDetailTab" density="compact">
            <v-tab value="pipeline">{{ t("Pipeline") }}</v-tab>
            <v-tab value="review">{{ t("Review") }}</v-tab>
            <v-tab value="metadata">{{ t("Metadata") }}</v-tab>
            <v-tab value="audio">{{ t("Audio") }}</v-tab>
            <v-tab value="outline">{{ t("Outline") }}</v-tab>
            <v-tab value="references">{{ t("References") }}</v-tab>
            <v-tab value="transcript">{{ t("Transcript") }}</v-tab>
          </v-tabs>

          <v-window v-model="activeDetailTab" class="mt-4">
            <v-window-item value="pipeline">
              <SermonPipelineTab
                :steps="sermonPipelineSteps"
                :progress="sermonPipelineProgress"
                :next-step="nextSermonPipelineStep"
                :workflow-refreshing="sermonWorkflowRefreshing"
                @refresh="refreshSelectedSermonWorkflow"
                @action="runPipelineAction"
              />
            </v-window-item>

            <v-window-item value="review">
              <SermonReviewTab
                :review-checks="reviewChecks"
                :ready="isReviewReady"
                :transcript-characters="editForm.transcriptText.trim().length"
                :outline-count="cleanedOutline.length"
                :reference-count="cleanedReferences.length"
              />
            </v-window-item>

            <v-window-item value="metadata">
              <SermonMetadataTab
                :edit-form="editForm"
                :topic-options="topicOptions"
                :topics-loading="facetsQuery.isPending.value"
              />
              <AdminAiDraftPanel
                task="sermon_summary"
                :title="t('ai.sermonSummaryTitle')"
                :subtitle="t('ai.sermonSummarySubtitle')"
                :button-label="t('ai.generateSermonSummary')"
                :apply-label="t('ai.applyToSummary')"
                :input="sermonSummaryAiInput"
                :resource="sermonAiResource"
                :can-use="authStore.can('ai:use')"
                :disabled="
                  !editForm.title.trim() &&
                  !editForm.transcriptText.trim() &&
                  !editForm.reviewMarkdown.trim() &&
                  !editForm.summary.trim()
                "
                @apply="applySermonSummaryDraft"
              />
            </v-window-item>

            <v-window-item value="audio">
              <SermonAudioTab
                v-model="selectedAudioFile"
                :sermon="selectedSermon"
                :audio-playback-url="audioPlaybackUrl"
                :pending-audio-validation="pendingAudioValidation"
                :pending-audio-file="pendingAudioFile"
                :can-update-sermons="authStore.can('sermons:update')"
                :can-upload-audio="canUploadAudio"
                :can-delete-audio="canDeleteAudio"
                :can-load-audio-preview="canLoadAudioPreview"
                :load-preview-loading="loadAudioPreviewMutation.isPending.value"
                :delete-audio-loading="deleteAudioMutation.isPending.value"
                :upload-audio-loading="uploadAudioMutation.isPending.value"
                :error-message="sermonAudioErrorMessage"
                @load-preview="loadSelectedAudioPreview"
                @delete-audio="deleteCurrentAudio"
                @upload-audio="uploadSelectedAudio"
              />
            </v-window-item>

            <v-window-item value="outline">
              <AdminAiDraftPanel
                task="sermon_outline"
                :title="t('ai.sermonOutlineTitle')"
                :subtitle="t('ai.sermonOutlineSubtitle')"
                :button-label="t('ai.generateSermonOutline')"
                :apply-label="t('ai.applyToOutline')"
                :input="sermonOutlineAiInput"
                :resource="sermonAiResource"
                :can-use="authStore.can('ai:use')"
                :disabled="
                  !editForm.title.trim() &&
                  !editForm.transcriptText.trim() &&
                  !editForm.reviewMarkdown.trim() &&
                  !editForm.summary.trim()
                "
                @apply="applySermonOutlineDraft"
              />
              <SermonOutlineTab
                :outline="editForm.outline"
                @add="addOutlineItem"
                @remove="removeOutlineItem"
                @move="moveOutlineItem"
              />
            </v-window-item>

            <v-window-item value="references">
              <SermonReferencesTab
                :references="editForm.references"
                @add="addReference"
                @remove="removeReference"
              />
            </v-window-item>

            <v-window-item value="transcript">
              <SermonTranscriptTab
                v-model="selectedTranscriptFile"
                :edit-form="editForm"
                :import-pending="transcriptImportPending"
                :import-error="transcriptImportError"
                @import-transcript-file="importTranscriptFile"
              />
            </v-window-item>
          </v-window>

          <ContentLocalizationCard
            resource-type="sermon"
            :resource-id="selectedSermon.id"
            :revision="selectedSermon.revision"
            :fields="{ title: editForm.title, ...(editForm.summary ? { summary: editForm.summary } : {}), ...(editForm.transcriptText ? { transcriptText: editForm.transcriptText } : {}) }"
            :can-edit="authStore.can('sermons:update')"
            :can-use-ai="authStore.can('ai:use')"
            :source-locale="editForm.sourceLocale"
            @update:source-locale="editForm.sourceLocale = $event"
          />
          <SermonEditorActions
            :sermon="selectedSermon"
            :error-message="sermonMutationErrorMessage"
            :ready="isReviewReady"
            :can-update="authStore.can('sermons:update')"
            :can-publish="authStore.can('sermons:publish')"
            :save-review-loading="saveAndReviewMutation.isPending.value"
            :save-publish-loading="saveAndPublishMutation.isPending.value"
            :submit-review-loading="submitReviewMutation.isPending.value"
            :publish-loading="publishMutation.isPending.value"
            :return-draft-loading="returnDraftMutation.isPending.value"
            :mark-failed-loading="markFailedMutation.isPending.value"
            :archive-loading="archiveMutation.isPending.value"
            :delete-loading="deleteMutation.isPending.value"
            :update-loading="updateMutation.isPending.value"
            :command-pending="sermonWritePending"
            @save-review="saveCurrentSermonForReview"
            @save-publish="saveAndPublishCurrentSermon"
            @submit-review="submitCurrentSermonReview"
            @publish="publishCurrentSermon"
            @return-draft="returnCurrentSermonDraft"
            @mark-failed="markCurrentSermonFailed"
            @archive="archiveCurrentSermon"
            @delete="deleteCurrentSermon"
            @save="saveCurrentSermon"
          />
        </v-form>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>
