<script setup lang="ts">
import type {
  SermonDiscussionAudienceType,
  SermonDiscussionGuideStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

type GuideFilters = {
  query: string;
  sermonId: string;
  status: SermonDiscussionGuideStatus | "";
  audienceType: SermonDiscussionAudienceType | "";
};

const filters = defineModel<GuideFilters>({ required: true });
defineProps<{ statusItems: unknown[]; audienceItems: unknown[] }>();
defineEmits<{ refresh: [] }>();
const { t } = useI18n();
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field v-model="filters.query" :label="t('Search')" density="compact" hide-details variant="outlined" @keyup.enter="$emit('refresh')" />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="filters.sermonId" :label="t('Sermon ID')" density="compact" hide-details variant="outlined" @keyup.enter="$emit('refresh')" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="filters.status" :items="statusItems" :label="t('Status')" density="compact" hide-details variant="outlined" @update:model-value="$emit('refresh')" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="filters.audienceType" :items="audienceItems" :label="t('Audience')" density="compact" hide-details variant="outlined" @update:model-value="$emit('refresh')" />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="$emit('refresh')">{{ t("common.go") }}</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
