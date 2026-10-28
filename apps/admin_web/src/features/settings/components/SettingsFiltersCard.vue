<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

import type { SettingsFilterForm } from "../settings_workspace_models";

defineProps<{
  filters: SettingsFilterForm;
  categoryFilterItems: Array<{ title: string; value: string }>;
  loadedCount: number;
  pending: boolean;
}>();

defineEmits<{ apply: []; clear: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <v-form class="pa-4 pa-sm-5" @submit.prevent="$emit('apply')">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.query"
            :label="t('common.search')"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.category"
            :label="t('settings.category')"
            :items="categoryFilterItems"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
      </v-row>
      <div class="d-flex flex-wrap align-center ga-2 mt-4">
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-filter-outline"
          :loading="pending"
        >
          {{ t("settings.applyFilters") }}
        </v-btn>
        <v-btn
          variant="text"
          prepend-icon="mdi-filter-remove-outline"
          :disabled="pending"
          @click="$emit('clear')"
        >
          {{ t("settings.clearFilters") }}
        </v-btn>
        <v-spacer />
        <v-chip color="primary" variant="tonal">
          {{ t("settings.loaded") }} {{ loadedCount }}
        </v-chip>
      </div>
    </v-form>
  </v-card>
</template>
