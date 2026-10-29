<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  statusItems: Array<{ title: string; value: string }>;
  visibilityItems: Array<{ title: string; value: string }>;
  fetching: boolean;
}>();

const query = defineModel<string>("query", { required: true });
const status = defineModel<string>("status", { required: true });
const visibility = defineModel<string>("visibility", { required: true });
const emit = defineEmits<{ apply: []; clear: [] }>();
const { t } = useI18n();
</script>

<template>
  <v-card class="mt-5" variant="outlined">
    <v-card-text>
      <v-form @submit.prevent="emit('apply')">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="status"
              :label="t('Status')"
              :items="statusItems"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="visibility"
              :label="t('Visibility')"
              :items="visibilityItems"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-md-end ga-2">
            <v-btn
              type="submit"
              color="primary"
              variant="tonal"
              icon="mdi-filter-outline"
              :loading="fetching"
              :aria-label="t('catalog.applyFilters')"
              :title="t('catalog.applyFilters')"
            />
            <v-btn
              type="button"
              variant="text"
              icon="mdi-filter-remove-outline"
              :disabled="fetching"
              :aria-label="t('catalog.clearFilters')"
              :title="t('catalog.clearFilters')"
              @click="emit('clear')"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
