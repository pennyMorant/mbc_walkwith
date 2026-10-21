<script setup lang="ts">
import type { SermonDiscussionGuide, SermonDiscussionGuideStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  guides: SermonDiscussionGuide[];
  selectedGuideId: string | null;
  pending: boolean;
  statusColor: (status: SermonDiscussionGuideStatus) => string;
}>();
defineEmits<{ select: [guide: SermonDiscussionGuide] }>();
const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <v-list lines="three">
      <v-list-item v-if="pending"><v-progress-linear color="primary" indeterminate /></v-list-item>
      <v-list-item v-else-if="guides.length === 0">
        {{ t("No discussion guides match the current filters.") }}
      </v-list-item>
      <v-list-item v-for="guide in guides" :key="guide.id" :active="selectedGuideId === guide.id" @click="$emit('select', guide)">
        <template #title><div class="font-weight-bold">{{ guide.title }}</div></template>
        <template #subtitle>
          <div class="text-caption text-medium-emphasis">{{ guide.sermonId }}</div>
          <div class="d-flex align-center flex-wrap ga-2 mt-1">
            <v-chip size="x-small" variant="tonal" :color="statusColor(guide.status)">{{ t(guide.status) }}</v-chip>
            <v-chip size="x-small" variant="tonal">{{ t(guide.audienceType) }}</v-chip>
            <span class="text-caption">{{ guide.questions.length }} {{ t("questions") }}</span>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
