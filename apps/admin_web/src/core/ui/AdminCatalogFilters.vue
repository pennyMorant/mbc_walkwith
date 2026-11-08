<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "./AdminFilterActions.vue";

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
  <v-card class="admin-catalog-filters mt-5" variant="outlined">
    <v-card-text class="pa-4">
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
          <v-col cols="12" md="2">
            <AdminFilterActions
              :apply-label="t('catalog.applyFilters')"
              :clear-label="t('catalog.clearFilters')"
              :loading="fetching"
              icon-only
              align-end
              @clear="emit('clear')"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
