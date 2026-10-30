<script setup lang="ts">
import {
  sermonDiscussionAudienceTypeOptions,
  sermonDiscussionGuideStatusOptions,
  sermonDiscussionQuestionTypeOptions,
  sermonDiscussionResponseUserTypeOptions
} from "@/core/api/sermon_discussion_guides";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import ContentLocalizationCard from "../../content-localization/components/ContentLocalizationCard.vue";
import SermonDiscussionGuideEditor from "../components/SermonDiscussionGuideEditor.vue";
import SermonDiscussionGuideFiltersCard from "../components/SermonDiscussionGuideFiltersCard.vue";
import SermonDiscussionGuideListCard from "../components/SermonDiscussionGuideListCard.vue";
import SermonDiscussionResponsesPanel from "../components/SermonDiscussionResponsesPanel.vue";
import { useSermonDiscussionGuidesPage } from "../composables/use_sermon_discussion_guides_page";

const {
  activePanel,
  addActionStep,
  addPrayerPrompt,
  addQuestion,
  applyGuideFilters,
  applyResponseFilters,
  availableGuideStatusOptions,
  canManage,
  canSaveGuide,
  canUseAi,
  filters,
  guideContentLocked,
  guideErrorMessage,
  guideForm,
  guideRefreshErrorMessage,
  guideStatusColor,
  guides,
  guidesQuery,
  hideResponse,
  hideResponseErrorMessage,
  hidingResponseId,
  newGuide,
  optionItems,
  removeActionStep,
  removePrayerPrompt,
  removeQuestion,
  responseErrorMessage,
  responseFilters,
  responseRefreshErrorMessage,
  responses,
  responsesQuery,
  saveErrorMessage,
  saveGuide,
  saveGuideMutation,
  selectedGuide,
  selectGuide,
  t
} = useSermonDiscussionGuidesPage();
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('nav.sermonGuides')"
      :subtitle="t('sermonGuides.subtitle')"
    >
      <template #actions>
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newGuide"
        >
          {{ t("New discussion guide") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <SermonDiscussionGuideFiltersCard
      v-model="filters"
      :status-items="optionItems(['', ...sermonDiscussionGuideStatusOptions])"
      :audience-items="optionItems(['', ...sermonDiscussionAudienceTypeOptions])"
      @apply="applyGuideFilters"
    />

    <v-row class="mt-2" dense>
      <v-col cols="12" lg="4">
        <SermonDiscussionGuideListCard
          :guides="guides"
          :selected-guide-id="selectedGuide?.id ?? null"
          :pending="guidesQuery.isPending.value"
          :fetching="guidesQuery.isFetching.value"
          :error-message="guideErrorMessage"
          :refresh-error-message="guideRefreshErrorMessage"
          :status-color="guideStatusColor"
          @retry="guidesQuery.refetch()"
          @select="selectGuide"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <v-card-title>
            {{ selectedGuide?.title || t("Discussion guide") }}
          </v-card-title>
          <v-card-subtitle>
            {{
              selectedGuide
                ? `${t("Sermon ID")}: ${selectedGuide.sermonId}`
                : t("Create a guide linked to a sermon record.")
            }}
          </v-card-subtitle>
          <v-card-text>
            <v-btn-toggle
              v-model="activePanel"
              class="mb-5"
              density="comfortable"
              mandatory
            >
              <v-btn value="guide">{{ t("Guide") }}</v-btn>
              <v-btn value="responses">{{ t("Responses") }}</v-btn>
            </v-btn-toggle>

            <v-alert
              v-if="activePanel === 'guide' && saveErrorMessage"
              class="mb-4"
              type="error"
              variant="tonal"
            >
              {{ saveErrorMessage }}
            </v-alert>

            <SermonDiscussionGuideEditor
              v-if="activePanel === 'guide'"
              :audience-type-options="sermonDiscussionAudienceTypeOptions"
              :can-manage="canManage"
              :can-save-guide="canSaveGuide"
              :content-locked="guideContentLocked"
              :form="guideForm"
              :is-editing="Boolean(selectedGuide)"
              :question-type-options="sermonDiscussionQuestionTypeOptions"
              :saving="saveGuideMutation.isPending.value"
              :status-options="availableGuideStatusOptions"
              @add-action-step="addActionStep"
              @add-prayer-prompt="addPrayerPrompt"
              @add-question="addQuestion"
              @remove-action-step="removeActionStep"
              @remove-prayer-prompt="removePrayerPrompt"
              @remove-question="removeQuestion"
              @save-guide="saveGuide"
            />

            <ContentLocalizationCard
              v-if="activePanel === 'guide' && selectedGuide"
              resource-type="sermon_discussion_guide"
              :resource-id="selectedGuide.id"
              :revision="selectedGuide.revision"
              :fields="{
                title: guideForm.title,
                ...(guideForm.summary ? { summary: guideForm.summary } : {})
              }"
              :can-edit="canManage && !saveGuideMutation.isPending.value"
              :can-use-ai="canUseAi"
              :source-locale="guideForm.sourceLocale"
              @update:source-locale="guideForm.sourceLocale = $event"
            />

            <SermonDiscussionResponsesPanel
              v-else
              :can-manage="canManage"
              :command-error-message="hideResponseErrorMessage"
              :error-message="responseErrorMessage"
              :refresh-error-message="responseRefreshErrorMessage"
              :filters="responseFilters"
              :hiding-response-id="hidingResponseId"
              :pending="Boolean(selectedGuide) && responsesQuery.isPending.value"
              :fetching="Boolean(selectedGuide) && responsesQuery.isFetching.value"
              :responses="responses"
              :selected-guide="selectedGuide"
              :user-type-items="optionItems(['', ...sermonDiscussionResponseUserTypeOptions])"
              @apply="applyResponseFilters"
              @hide-response="hideResponse"
              @retry="responsesQuery.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
