<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import SermonTopicsField from "./SermonTopicsField.vue";

type SermonEditForm = {
  title: string;
  speaker: string;
  sermonDate: string;
  series: string;
  topics: string[];
  primaryReference: string;
  summary: string;
};

defineProps<{
  editForm: SermonEditForm;
  topicOptions: string[];
  topicsLoading: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-text-field
      v-model="editForm.title"
      :label="t('Title')"
      density="comfortable"
      variant="outlined"
    />
    <v-text-field
      v-model="editForm.speaker"
      :label="t('Speaker')"
      density="comfortable"
      variant="outlined"
    />
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="editForm.sermonDate"
          :label="t('Date')"
          density="comfortable"
          variant="outlined"
        />
      </v-col>
    </v-row>
    <v-text-field
      v-model="editForm.series"
      :label="t('Series')"
      density="comfortable"
      variant="outlined"
    />
    <SermonTopicsField
      v-model="editForm.topics"
      :items="topicOptions"
      :loading="topicsLoading"
    />
    <v-text-field
      v-model="editForm.primaryReference"
      :label="t('Primary Scripture')"
      density="comfortable"
      variant="outlined"
    />
    <v-textarea
      v-model="editForm.summary"
      :label="t('Summary')"
      rows="4"
      density="comfortable"
      variant="outlined"
    />
  </div>
</template>
