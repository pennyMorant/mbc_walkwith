<script setup lang="ts">
import type { SermonDiscussionGuide, SermonDiscussionGuideStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  guides: SermonDiscussionGuide[];
  selectedGuideId: string | null;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  statusColor: (status: SermonDiscussionGuideStatus) => string;
}>();
defineEmits<{ retry: []; select: [guide: SermonDiscussionGuide] }>();
const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <AdminDataState
      :pending="(pending || fetching) && guides.length === 0"
      :error-message="guides.length === 0 ? errorMessage : ''"
      :empty="!fetching && !errorMessage && guides.length === 0"
      :empty-title="t('No discussion guides match the current filters.')"
      empty-icon="mdi-forum-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="fetching && guides.length > 0"
        color="primary"
        indeterminate
      />
      <v-alert
        v-if="guides.length > 0 && errorMessage"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        <div class="d-flex flex-column ga-3">
          <span>{{ errorMessage }}</span>
          <v-btn
            align-self="start"
            color="error"
            prepend-icon="mdi-refresh"
            size="small"
            variant="tonal"
            @click="$emit('retry')"
          >
            {{ t("common.refresh") }}
          </v-btn>
        </div>
      </v-alert>
      <v-list lines="three">
        <v-list-item
          v-for="guide in guides"
          :key="guide.id"
          :active="selectedGuideId === guide.id"
          @click="$emit('select', guide)"
        >
          <template #title>
            <div class="font-weight-bold">{{ guide.title }}</div>
          </template>
          <template #subtitle>
            <div class="text-caption text-medium-emphasis">
              {{ guide.sermonId }}
            </div>
            <div class="d-flex align-center flex-wrap ga-2 mt-1">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="statusColor(guide.status)"
              >
                {{ t(guide.status) }}
              </v-chip>
              <v-chip size="x-small" variant="tonal">
                {{ t(guide.audienceType) }}
              </v-chip>
              <span class="text-caption">
                {{ guide.questions.length }} {{ t("questions") }}
              </span>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </AdminDataState>
  </v-card>
</template>
