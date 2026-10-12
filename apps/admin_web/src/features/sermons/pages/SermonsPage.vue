<script setup lang="ts">
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
  sermonAiResource,
  sermonSummaryAiInput,
  sermonOutlineAiInput,
  sermonMutationErrorMessage,
  sermonPipelineProgress,
  sermonPipelineSteps,
  sermonWorkflowRefreshing,
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
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.sermons") }}</div>
        <div class="page-subtitle">
          {{ t("sermons.subtitle") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        :loading="sermonsQuery.isFetching.value"
        @click="refreshList"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <v-row class="mt-6" dense>
      <v-col cols="12" lg="4">
        <SermonManualDraftCard
          v-if="authStore.can('sermons:create')"
          v-model="selectedManualManuscriptFile"
          :form="manualSermonForm"
          :can-create="canCreateManualSermon"
          :loading="createManualSermonMutation.isPending.value"
          :error="createManualSermonMutation.error.value"
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

    <v-navigation-drawer
      v-model="detailDrawer"
      location="right"
      temporary
      width="640"
    >
      <div v-if="selectedSermon" class="pa-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">{{ selectedSermon.title }}</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ selectedSermon.speaker }} · {{ selectedSermon.sermonDate }}
            </div>
          </div>
          <v-chip :color="statusColor(selectedSermon.status)">
            {{ t(selectedSermon.status) }}
          </v-chip>
        </div>

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
                :load-preview-loading="loadAudioPreviewMutation.isPending.value"
                :delete-audio-loading="deleteAudioMutation.isPending.value"
                :upload-audio-loading="uploadAudioMutation.isPending.value"
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
    </v-navigation-drawer>
  </div>
</template>
