<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import SermonTopicsField from "./SermonTopicsField.vue";

type ManualSermonForm = {
  title: string;
  speaker: string;
  sermonDate: string;
  series: string;
  topics: string[];
  primaryReference: string;
  summary: string;
  transcriptText: string;
  transcriptSource: string;
  reviewMarkdown: string;
};

defineProps<{
  form: ManualSermonForm;
  canCreate: boolean;
  loading: boolean;
  error: unknown;
  topicOptions: string[];
  topicsLoading: boolean;
}>();

const manuscriptFile = defineModel<File | File[] | null>({
  required: true
});

const emit = defineEmits<{
  importManuscriptFile: [value: File | File[] | null];
  reset: [];
  submit: [];
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-4">
    <div class="pa-5">
      <div class="text-subtitle-1 font-weight-bold">
        {{ t("Manual sermon") }}
      </div>
      <div class="text-body-2 text-medium-emphasis">
        {{ t("sermons.manualSubtitle") }}
      </div>

      <v-text-field
        v-model="form.title"
        class="mt-4"
        :label="t('Title')"
        density="compact"
        variant="outlined"
      />
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.speaker"
            :label="t('Speaker')"
            density="compact"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.sermonDate"
            :label="t('Date')"
            density="compact"
            variant="outlined"
          />
        </v-col>
      </v-row>
      <v-text-field
        v-model="form.series"
        :label="t('Series')"
        density="compact"
        variant="outlined"
      />
      <SermonTopicsField
        v-model="form.topics"
        :items="topicOptions"
        :loading="topicsLoading"
        density="compact"
      />
      <v-text-field
        v-model="form.primaryReference"
        :label="t('Primary Scripture')"
        density="compact"
        variant="outlined"
      />
      <v-textarea
        v-model="form.summary"
        :label="t('Summary')"
        rows="2"
        density="compact"
        variant="outlined"
      />
      <v-file-input
        v-model="manuscriptFile"
        accept=".txt,.md,text/plain,text/markdown"
        :label="t('Upload manuscript file')"
        density="compact"
        variant="outlined"
        prepend-icon="mdi-file-document-outline"
        @update:model-value="emit('importManuscriptFile', $event)"
      />
      <v-textarea
        v-model="form.transcriptText"
        :label="t('Sermon manuscript')"
        rows="5"
        density="compact"
        variant="outlined"
      />
      <v-text-field
        v-model="form.transcriptSource"
        :label="t('Transcript source')"
        density="compact"
        variant="outlined"
      />
      <v-textarea
        v-model="form.reviewMarkdown"
        :label="t('Review notes')"
        rows="3"
        density="compact"
        variant="outlined"
      />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ formatApiErrorMessage(error, t("common.error")) }}
      </v-alert>

      <div class="d-flex justify-end ga-2">
        <v-btn variant="tonal" @click="emit('reset')">
          {{ t("common.cancel") }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!canCreate || loading"
          @click="emit('submit')"
        >
          {{ t("Create sermon") }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>
