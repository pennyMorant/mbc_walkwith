<script setup lang="ts">
import type { LifePost } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  post: LifePost | null;
  errorMessage: string;
  publishReady: boolean;
  canSave: boolean;
  canUpdate: boolean;
  canPublish: boolean;
  submitReviewLoading: boolean;
  returnDraftLoading: boolean;
  publishLoading: boolean;
  unpublishLoading: boolean;
  archiveLoading: boolean;
  deleteLoading: boolean;
  saveLoading: boolean;
}>();

const emit = defineEmits<{
  submitReview: [];
  returnDraft: [];
  publish: [];
  unpublish: [];
  archive: [];
  delete: [];
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
          v-if="post"
          color="warning"
          variant="tonal"
          :disabled="
            !canUpdate ||
            post.status === 'needs_review' ||
            (post.status === 'published' && !canPublish)
          "
          :loading="submitReviewLoading"
          @click="emit('submitReview')"
        >
          {{ t("Submit review") }}
        </v-btn>
        <v-btn
          v-if="post"
          color="secondary"
          variant="tonal"
          :disabled="
            !canUpdate ||
            post.status === 'draft' ||
            (post.status === 'published' && !canPublish)
          "
          :loading="returnDraftLoading"
          @click="emit('returnDraft')"
        >
          {{ t("Return draft") }}
        </v-btn>
        <v-btn
          v-if="post"
          color="success"
          variant="tonal"
          :disabled="
            !canPublish ||
            post.status === 'published' ||
            !publishReady
          "
          :loading="publishLoading"
          @click="emit('publish')"
        >
          {{ t("Publish") }}
        </v-btn>
        <v-btn
          v-if="post"
          color="secondary"
          variant="tonal"
          :disabled="!canPublish || post.status !== 'published'"
          :loading="unpublishLoading"
          @click="emit('unpublish')"
        >
          {{ t("Unpublish") }}
        </v-btn>
        <v-btn
          v-if="post"
          color="grey"
          variant="tonal"
          :disabled="
            !canUpdate ||
            post.status === 'archived' ||
            (post.status === 'published' && !canPublish)
          "
          :loading="archiveLoading"
          @click="emit('archive')"
        >
          {{ t("Archive") }}
        </v-btn>
        <v-btn
          v-if="post"
          color="error"
          variant="tonal"
          :disabled="
            !canUpdate || (post.status === 'published' && !canPublish)
          "
          :loading="deleteLoading"
          @click="emit('delete')"
        >
          {{ t("Delete") }}
        </v-btn>
      </div>
      <v-btn
        type="submit"
        color="primary"
        :disabled="
          !canSave ||
          !canUpdate ||
          (post?.status === 'published' && !canPublish)
        "
        :loading="saveLoading"
      >
        {{ t("common.save") }}
      </v-btn>
    </div>
  </div>
</template>
