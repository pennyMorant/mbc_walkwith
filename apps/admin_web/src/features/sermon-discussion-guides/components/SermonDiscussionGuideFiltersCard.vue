<script setup lang="ts">
import type {
  SermonDiscussionAudienceType,
  SermonDiscussionGuideStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

type GuideFilters = {
  query: string;
  sermonId: string;
  status: SermonDiscussionGuideStatus | "";
  audienceType: SermonDiscussionAudienceType | "";
};

const filters = defineModel<GuideFilters>({ required: true });
defineProps<{ statusItems: unknown[]; audienceItems: unknown[] }>();
defineEmits<{ apply: [] }>();
const { t } = useI18n();
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-text>
      <AdminFilterToolbar @apply="$emit('apply')">
        <v-text-field
          v-model="filters.query"
          class="admin-filter-control"
          :label="t('Search')"
          density="compact"
          hide-details
          variant="outlined"
        />
        <v-text-field
          v-model="filters.sermonId"
          class="admin-filter-control"
          :label="t('Sermon ID')"
          density="compact"
          hide-details
          variant="outlined"
        />
        <v-select
          v-model="filters.status"
          class="admin-filter-control"
          :items="statusItems"
          :label="t('Status')"
          density="compact"
          hide-details
          variant="outlined"
        />
        <v-select
          v-model="filters.audienceType"
          class="admin-filter-control"
          :items="audienceItems"
          :label="t('Audience')"
          density="compact"
          hide-details
          variant="outlined"
        />
        <template #actions>
          <v-btn type="submit" variant="tonal">{{ t("common.go") }}</v-btn>
        </template>
      </AdminFilterToolbar>
    </v-card-text>
  </v-card>
</template>
