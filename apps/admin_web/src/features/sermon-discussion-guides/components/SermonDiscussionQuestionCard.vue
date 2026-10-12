<script setup lang="ts">
import type {
  SermonDiscussionGuideCreateRequest,
  SermonDiscussionQuestionType
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  canManage: boolean;
  index: number;
  question: SermonDiscussionGuideCreateRequest["questions"][number];
  questionTypeOptions: SermonDiscussionQuestionType[];
}>();

const emit = defineEmits<{
  remove: [index: number];
}>();

const { optionItems, t } = useI18n();

function updateStartSeconds(
  question: SermonDiscussionGuideCreateRequest["questions"][number],
  value: unknown
) {
  if (value === "" || value === null || value === undefined) {
    question.startSeconds = null;
    return;
  }
  const parsed = Number(value);
  question.startSeconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
</script>

<template>
  <v-card class="mt-3" variant="outlined">
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-select
            v-model="question.type"
            :disabled="!canManage"
            :items="optionItems(questionTypeOptions)"
            :label="t('Type')"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="7">
          <v-text-field
            v-model="question.prompt"
            :disabled="!canManage"
            :label="t('Question')"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="8" md="1">
          <v-text-field
            :disabled="!canManage"
            :label="t('Start seconds')"
            :model-value="question.startSeconds ?? ''"
            density="compact"
            type="number"
            variant="outlined"
            @update:model-value="updateStartSeconds(question, $event)"
          />
        </v-col>
        <v-col cols="4" md="1">
          <v-btn
            v-if="canManage"
            block
            color="error"
            icon="mdi-delete-outline"
            variant="text"
            @click="emit('remove', index)"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
