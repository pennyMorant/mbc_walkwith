<script setup lang="ts">
import type { ReadingPlanStatus, ReadingPlanVisibility } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

type ReadingPlanFilters = {
  query: string;
  status: ReadingPlanStatus | "";
  visibility: ReadingPlanVisibility | "";
  locale: string;
};

const filters = defineModel<ReadingPlanFilters>({ required: true });
defineProps<{
  statusItems: unknown[];
  visibilityItems: unknown[];
  localeItems: Array<{ title: string; value: string }>;
}>();
defineEmits<{ apply: [] }>();
const { t } = useI18n();
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field v-model="filters.query" :label="t('Search')" density="compact" variant="outlined" hide-details @keyup.enter="$emit('apply')" />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="filters.status" :label="t('Status')" :items="statusItems" density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="filters.visibility" :label="t('Visibility')" :items="visibilityItems" density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="filters.locale" :label="t('Locale')" :items="[{ title: t('common.all'), value: '' }, ...localeItems]" density="compact" variant="outlined" hide-details />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn block variant="tonal" @click="$emit('apply')">{{ t("common.go") }}</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
