<script setup lang="ts">
import type { NewcomerStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  fetching: boolean;
  statusItems: Array<{ title: string; value: string }>;
}>();
defineEmits<{ apply: []; clear: [] }>();

const query = defineModel<string>("query", { required: true });
const status = defineModel<NewcomerStatus | "">("status", {
  required: true
});
const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <v-form class="pa-5" @submit.prevent="$emit('apply')">
      <v-row dense align="center">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="8" md="4">
          <v-select
            v-model="status"
            :label="t('Status')"
            :items="statusItems"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <div class="d-flex justify-end ga-2">
            <v-btn
              icon="mdi-filter-remove-outline"
              variant="text"
              :aria-label="t('newcomers.clearFilters')"
              :title="t('newcomers.clearFilters')"
              @click="$emit('clear')"
            />
            <v-btn
              type="submit"
              icon="mdi-filter-check-outline"
              color="primary"
              variant="tonal"
              :loading="fetching"
              :aria-label="t('newcomers.applyFilters')"
              :title="t('newcomers.applyFilters')"
            />
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-card>
</template>
