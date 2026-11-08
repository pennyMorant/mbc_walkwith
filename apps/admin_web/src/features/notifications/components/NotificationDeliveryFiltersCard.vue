<script setup lang="ts">
import type { NotificationDeliveryStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";

import type { NotificationDeliveryFilterForm } from "../notification_delivery_workspace_models";

defineProps<{
  filters: NotificationDeliveryFilterForm;
  statuses: Array<NotificationDeliveryStatus | "">;
  loadedCount: number;
  pending: boolean;
}>();

defineEmits<{ apply: []; clear: [] }>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card>
    <v-form class="pa-5" @submit.prevent="$emit('apply')">
      <div class="d-flex flex-column flex-lg-row align-lg-end ga-4">
        <v-select
          v-model="filters.status"
          :items="optionItems(statuses)"
          :label="t('notifications.statusFilter')"
          density="compact"
          variant="outlined"
          hide-details
          class="filter-control"
        />
        <v-text-field
          v-model="filters.type"
          :label="t('notifications.typeFilter')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="filter-control"
        />
        <AdminFilterActions
          :apply-label="t('notifications.applyFilters')"
          :clear-label="t('notifications.clearFilters')"
          :loading="pending"
          @clear="$emit('clear')"
        />
        <v-spacer class="d-none d-lg-block" />
        <v-chip color="primary" variant="tonal">
          {{ t("notifications.loaded") }} {{ loadedCount }}
        </v-chip>
      </div>
    </v-form>
  </v-card>
</template>

<style scoped>
.filter-control {
  width: 100%;
  min-width: 0;
}

@media (min-width: 1280px) {
  .filter-control {
    min-width: 220px;
    flex: 1 1 220px;
  }
}
</style>
