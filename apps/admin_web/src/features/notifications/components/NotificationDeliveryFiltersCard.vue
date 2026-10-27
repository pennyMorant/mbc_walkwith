<script setup lang="ts">
import type { NotificationDeliveryStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

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
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            type="submit"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-filter-outline"
            :loading="pending"
          >
            {{ t("notifications.applyFilters") }}
          </v-btn>
          <v-btn
            variant="text"
            prepend-icon="mdi-filter-remove-outline"
            :disabled="pending"
            @click="$emit('clear')"
          >
            {{ t("notifications.clearFilters") }}
          </v-btn>
        </div>
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
  flex: 1 1 220px;
  min-width: min(100%, 220px);
}
</style>
