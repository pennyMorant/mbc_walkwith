<script setup lang="ts">
import type { LifePost, LifePostStatus, LifePostVisibility } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import LifePostMarkdownPreview from "./LifePostMarkdownPreview.vue";

defineProps<{
  post: LifePost;
  iconLabel: (iconName: string) => string;
  statusColor: (status: LifePostStatus) => string;
  visibilityColor: (visibility: LifePostVisibility) => string;
  formatSchedule: (post: LifePost) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-4 mb-5" variant="outlined">
    <v-img v-if="post.imageUrl" :src="post.imageUrl" height="180" cover />
    <div class="pa-4">
      <div
        class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
      >
        <div>
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("life.preview") }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ iconLabel(post.iconName) }} · {{ post.meta || t("life.noMeta") }}
          </div>
          <div
            v-if="post.startsAt"
            class="text-caption text-medium-emphasis mt-1"
          >
            {{ formatSchedule(post) }}
          </div>
        </div>
        <v-chip size="small" :color="statusColor(post.status)" variant="tonal">
          {{ t(post.status) }}
        </v-chip>
        <v-chip
          size="small"
          :color="visibilityColor(post.visibility)"
          variant="tonal"
        >
          {{ t(post.visibility) }}
        </v-chip>
      </div>
      <div class="text-subtitle-1 font-weight-bold mt-4">
        {{ post.title }}
      </div>
      <LifePostMarkdownPreview
        class="mt-1"
        :markdown="post.body"
        :empty-text="t('life.noBody')"
        dense
      />
      <v-btn
        v-if="post.ctaUrl"
        class="mt-4"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-open-in-new"
      >
        {{ post.ctaLabel || t("Open link") }}
      </v-btn>
    </div>
  </v-card>
</template>
