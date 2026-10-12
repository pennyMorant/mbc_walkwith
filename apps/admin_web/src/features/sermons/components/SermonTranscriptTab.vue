<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

type SermonTranscriptForm = {
  transcriptText: string;
  transcriptSource: string;
  reviewMarkdown: string;
};

defineProps<{
  editForm: SermonTranscriptForm;
}>();

const selectedTranscriptFile = defineModel<File | File[] | null>({
  required: true
});

const emit = defineEmits<{
  importTranscriptFile: [value: File | File[] | null];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-file-input
      v-model="selectedTranscriptFile"
      accept=".txt,.md,text/plain,text/markdown"
      :label="t('Import transcript file')"
      density="comfortable"
      variant="outlined"
      prepend-icon="mdi-file-document-outline"
      @update:model-value="emit('importTranscriptFile', $event)"
    />
    <v-text-field
      v-model="editForm.transcriptSource"
      :label="t('Transcript source')"
      density="comfortable"
      variant="outlined"
    />
    <v-textarea
      v-model="editForm.transcriptText"
      :label="t('Transcript')"
      rows="14"
      density="comfortable"
      variant="outlined"
    />
    <v-textarea
      v-model="editForm.reviewMarkdown"
      :label="t('Review notes')"
      rows="6"
      density="comfortable"
      variant="outlined"
    />
  </div>
</template>
