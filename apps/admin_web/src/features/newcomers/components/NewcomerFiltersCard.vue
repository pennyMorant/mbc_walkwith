<script setup lang="ts">
import type { NewcomerStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

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
    <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
      <v-text-field
        v-model="query"
        class="admin-filter-control"
        :label="t('Search')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="statusItems"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <AdminFilterActions
          :apply-label="t('newcomers.applyFilters')"
          :clear-label="t('newcomers.clearFilters')"
          :loading="fetching"
          icon-only
          align-end
          @clear="$emit('clear')"
        />
      </template>
    </AdminFilterToolbar>
  </v-card>
</template>
