<script setup lang="ts">
import type { Sermon } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { formatSermonFileSize } from "../sermon_pipeline";

defineProps<{
  sermon: Sermon;
  audioPlaybackUrl: string | null;
  pendingAudioValidation: string | null;
  pendingAudioFile: File | null;
  canUpdateSermons: boolean;
  canUploadAudio: boolean;
  loadPreviewLoading: boolean;
  deleteAudioLoading: boolean;
  uploadAudioLoading: boolean;
}>();

const selectedAudioFile = defineModel<File | File[] | null>({
  required: true
});

const emit = defineEmits<{
  loadPreview: [];
  deleteAudio: [];
  uploadAudio: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-card variant="outlined" class="pa-4 mb-4">
      <div
        class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4 mb-3"
      >
        <div>
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("Audio file") }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t(sermon.audio.status) }}
          </div>
        </div>
        <v-chip
          :color="sermon.audio.status === 'ready' ? 'success' : 'grey'"
          variant="tonal"
        >
          {{ t(sermon.audio.status) }}
        </v-chip>
      </div>

      <div v-if="sermon.audio.status === 'ready'">
        <v-list density="compact" class="pa-0">
          <v-list-item :title="t('File')">
            <template #subtitle>
              {{ sermon.audio.fileName || "sermon-audio" }}
            </template>
          </v-list-item>
          <v-list-item :title="t('Type')">
            <template #subtitle>
              {{ sermon.audio.mimeType || t("unknown") }}
            </template>
          </v-list-item>
          <v-list-item :title="t('Size')">
            <template #subtitle>
              {{ formatSermonFileSize(sermon.audio.sizeBytes) }}
            </template>
          </v-list-item>
          <v-list-item :title="t('Uploaded')">
            <template #subtitle>
              {{ sermon.audio.uploadedAt || t("unknown") }}
            </template>
          </v-list-item>
        </v-list>

        <audio
          v-if="audioPlaybackUrl"
          class="w-100 mt-3"
          :src="audioPlaybackUrl"
          controls
        />
        <div class="d-flex ga-2 mt-3">
          <v-btn
            color="info"
            variant="tonal"
            :loading="loadPreviewLoading"
            @click="emit('loadPreview')"
          >
            {{ t("Load preview") }}
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :loading="deleteAudioLoading"
            :disabled="!canUpdateSermons"
            @click="emit('deleteAudio')"
          >
            {{ t("Delete audio") }}
          </v-btn>
        </div>
      </div>
      <v-alert v-else type="info" variant="tonal">
        {{ t("No audio uploaded.") }}
      </v-alert>
    </v-card>

    <v-file-input
      v-model="selectedAudioFile"
      accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-m4a,audio/x-wav"
      :label="t('Audio file')"
      density="comfortable"
      variant="outlined"
      prepend-icon="mdi-music-note"
    />
    <v-alert
      v-if="pendingAudioValidation"
      type="error"
      variant="tonal"
      class="mb-3"
    >
      {{ pendingAudioValidation }}
    </v-alert>
    <div
      v-else-if="pendingAudioFile"
      class="text-caption text-medium-emphasis mb-3"
    >
      {{ t("Selected audio") }}:
      {{ pendingAudioFile.name }} ·
      {{ pendingAudioFile.type || t("unknown type") }} ·
      {{ formatSermonFileSize(pendingAudioFile.size) }}
    </div>
    <div v-else class="text-caption text-medium-emphasis mb-3">
      {{ t("sermons.audioUploadHelp") }}
    </div>
    <div class="d-flex justify-end">
      <v-btn
        color="primary"
        :loading="uploadAudioLoading"
        :disabled="!canUploadAudio"
        @click="emit('uploadAudio')"
      >
        {{ t("Upload audio") }}
      </v-btn>
    </div>
  </div>
</template>
