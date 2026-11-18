<script setup lang="ts">
import type { ReadingPlanStatus, ReadingPlanVisibility } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

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
      <AdminFilterToolbar @apply="$emit('apply')">
        <v-text-field
          v-model="filters.query"
          class="admin-filter-control"
          :label="t('Search')"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="filters.status"
          class="admin-filter-control"
          :label="t('Status')"
          :items="statusItems"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="filters.visibility"
          class="admin-filter-control"
          :label="t('Visibility')"
          :items="visibilityItems"
          density="compact"
          variant="outlined"
          hide-details
        />
        <v-select
          v-model="filters.locale"
          class="admin-filter-control"
          :label="t('Locale')"
          :items="[{ title: t('common.all'), value: '' }, ...localeItems]"
          density="compact"
          variant="outlined"
          hide-details
        />
        <template #actions>
          <v-btn type="submit" variant="tonal">{{ t("common.go") }}</v-btn>
        </template>
      </AdminFilterToolbar>
    </v-card-text>
  </v-card>
</template>
