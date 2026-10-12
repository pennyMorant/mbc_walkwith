<script setup lang="ts">
import type { Sermon } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  sermon: Sermon;
  errorMessage: string;
  ready: boolean;
  canUpdate: boolean;
  canPublish: boolean;
  saveReviewLoading: boolean;
  savePublishLoading: boolean;
  submitReviewLoading: boolean;
  publishLoading: boolean;
  returnDraftLoading: boolean;
  markFailedLoading: boolean;
  archiveLoading: boolean;
  deleteLoading: boolean;
  updateLoading: boolean;
}>();

const emit = defineEmits<{
  saveReview: [];
  savePublish: [];
  submitReview: [];
  publish: [];
  returnDraft: [];
  markFailed: [];
  archive: [];
  delete: [];
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <div class="d-flex flex-column flex-lg-row justify-space-between ga-3">
      <div class="d-flex ga-2 flex-wrap">
        <v-btn
          color="warning"
          variant="tonal"
          :loading="saveReviewLoading"
          :disabled="!canUpdate || !ready || saveReviewLoading"
          @click="emit('saveReview')"
        >
          {{ t("Save review") }}
        </v-btn>
        <v-btn
          color="success"
          variant="tonal"
          :loading="savePublishLoading"
          :disabled="!canUpdate || !canPublish || !ready || savePublishLoading"
          @click="emit('savePublish')"
        >
          {{ t("Save publish") }}
        </v-btn>
        <v-btn
          color="warning"
          variant="tonal"
          :loading="submitReviewLoading"
          :disabled="
            sermon.status === 'needs_review' ||
            sermon.status === 'published' ||
            !canUpdate ||
            !ready ||
            submitReviewLoading
          "
          @click="emit('submitReview')"
        >
          {{ t("Submit only") }}
        </v-btn>
        <v-btn
          color="success"
          variant="tonal"
          :loading="publishLoading"
          :disabled="
            sermon.status === 'published' ||
            !canPublish ||
            !ready ||
            publishLoading
          "
          @click="emit('publish')"
        >
          {{ t("Publish only") }}
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          :loading="returnDraftLoading"
          :disabled="sermon.status === 'draft' || !canUpdate || returnDraftLoading"
          @click="emit('returnDraft')"
        >
          {{ t("Draft") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :loading="markFailedLoading"
          :disabled="sermon.status === 'failed' || !canUpdate || markFailedLoading"
          @click="emit('markFailed')"
        >
          {{ t("Failed") }}
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          :loading="archiveLoading"
          :disabled="!canUpdate || archiveLoading"
          @click="emit('archive')"
        >
          {{ t("Archive") }}
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          :loading="deleteLoading"
          :disabled="!canUpdate || deleteLoading"
          @click="emit('delete')"
        >
          {{ t("Delete") }}
        </v-btn>
      </div>
      <v-btn
        color="primary"
        :loading="updateLoading"
        :disabled="!canUpdate || updateLoading"
        @click="emit('save')"
      >
        {{ t("Save changes") }}
      </v-btn>
    </div>
  </div>
</template>
