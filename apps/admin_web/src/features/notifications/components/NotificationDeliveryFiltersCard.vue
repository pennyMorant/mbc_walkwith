<script setup lang="ts">
import type { NotificationDeliveryStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminFilterActions from "@/core/ui/AdminFilterActions.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";

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
    <AdminFilterToolbar class="pa-5" @apply="$emit('apply')">
      <v-select
        v-model="filters.status"
        class="admin-filter-control"
        :items="optionItems(statuses)"
        :label="t('notifications.statusFilter')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-text-field
        v-model="filters.type"
        class="admin-filter-control"
        :label="t('notifications.typeFilter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
      />
      <template #actions>
        <AdminFilterActions
          :apply-label="t('notifications.applyFilters')"
          :clear-label="t('notifications.clearFilters')"
          :loading="pending"
          @clear="$emit('clear')"
        />
      </template>
      <template #meta>
        <v-chip color="primary" variant="tonal">
          {{ t("notifications.loaded") }} {{ loadedCount }}
        </v-chip>
      </template>
    </AdminFilterToolbar>
  </v-card>
</template>
