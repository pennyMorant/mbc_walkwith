<script setup lang="ts">
import type {
  SermonDiscussionAudienceType,
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionGuideStatus,
  SermonDiscussionQuestionType
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import SermonDiscussionQuestionCard from "./SermonDiscussionQuestionCard.vue";

defineProps<{
  audienceTypeOptions: SermonDiscussionAudienceType[];
  canManage: boolean;
  canSaveGuide: boolean;
  contentLocked: boolean;
  form: SermonDiscussionGuideCreateRequest;
  isEditing: boolean;
  questionTypeOptions: SermonDiscussionQuestionType[];
  saving: boolean;
  statusOptions: SermonDiscussionGuideStatus[];
}>();

defineEmits<{
  addActionStep: [];
  addPrayerPrompt: [];
  addQuestion: [];
  removeActionStep: [index: number];
  removePrayerPrompt: [index: number];
  removeQuestion: [index: number];
  saveGuide: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <div>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="form.title"
          :disabled="!canManage || contentLocked"
          :label="t('Title')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="form.status"
          :disabled="!canManage"
          :items="optionItems(statusOptions)"
          :label="t('Status')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="form.sermonId"
          :disabled="isEditing || !canManage || contentLocked"
          :label="t('Sermon ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.audienceType"
          :disabled="!canManage || contentLocked"
          :items="optionItems(audienceTypeOptions)"
          :label="t('Audience')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="8">
        <v-text-field
          v-model="form.audienceId"
          :disabled="!canManage || contentLocked || form.audienceType === 'public'"
          :label="t('Audience ID')"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="form.summary"
          :disabled="!canManage || contentLocked"
          :label="t('Summary')"
          density="compact"
          rows="3"
          variant="outlined"
        />
      </v-col>
    </v-row>

    <v-divider class="my-5" />

    <div class="d-flex align-center justify-space-between ga-3">
      <div>
        <div class="text-subtitle-2 font-weight-bold">
          {{ t("Discussion questions") }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Questions are linked to the sermon, not copied from the transcript.") }}
        </div>
      </div>
      <v-btn
        v-if="canManage && !contentLocked"
        size="small"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="$emit('addQuestion')"
      >
        {{ t("Add question") }}
      </v-btn>
    </div>

    <v-alert
      v-if="form.questions.length === 0"
      class="mt-3"
      density="comfortable"
      type="info"
      variant="tonal"
    >
      {{ t("No discussion questions yet.") }}
    </v-alert>

    <SermonDiscussionQuestionCard
      v-for="(question, index) in form.questions"
      :key="question.id"
      :can-manage="canManage && !contentLocked"
      :index="index"
      :question="question"
      :question-type-options="questionTypeOptions"
      @remove="$emit('removeQuestion', $event)"
    />

    <v-divider class="my-5" />

    <div class="d-flex align-center justify-space-between ga-3">
      <div class="text-subtitle-2 font-weight-bold">
        {{ t("Action steps") }}
      </div>
      <v-btn
        v-if="canManage && !contentLocked"
        size="small"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="$emit('addActionStep')"
      >
        {{ t("Add action") }}
      </v-btn>
    </div>

    <v-row class="mt-3" dense>
      <v-col
        v-for="(action, index) in form.actionSteps"
        :key="action.id"
        cols="12"
      >
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="action.title"
              :disabled="!canManage || contentLocked"
              :label="t('Action title')"
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="7">
            <v-text-field
              v-model="action.description"
              :disabled="!canManage || contentLocked"
              :label="t('Description')"
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn
              v-if="canManage && !contentLocked"
              block
              color="error"
              icon="mdi-delete-outline"
              variant="text"
              @click="$emit('removeActionStep', index)"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-divider class="my-5" />

    <div class="d-flex align-center justify-space-between ga-3">
      <div class="text-subtitle-2 font-weight-bold">
        {{ t("Prayer prompts") }}
      </div>
      <v-btn
        v-if="canManage && !contentLocked"
        size="small"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="$emit('addPrayerPrompt')"
      >
        {{ t("Add prayer") }}
      </v-btn>
    </div>

    <v-row class="mt-3" dense>
      <v-col
        v-for="(_, index) in form.prayerPrompts"
        :key="`prayer-${index}`"
        cols="12"
      >
        <v-row dense>
          <v-col cols="12" md="11">
            <v-text-field
              v-model="form.prayerPrompts[index]"
              :disabled="!canManage || contentLocked"
              :label="t('Prayer prompt')"
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-btn
              v-if="canManage && !contentLocked"
              block
              color="error"
              icon="mdi-delete-outline"
              variant="text"
              @click="$emit('removePrayerPrompt', index)"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <div class="d-flex justify-end mt-5">
      <v-btn
        v-if="canManage"
        color="primary"
        :disabled="!canSaveGuide || saving"
        :loading="saving"
        @click="$emit('saveGuide')"
      >
        {{ t("common.save") }}
      </v-btn>
    </div>
  </div>
</template>
