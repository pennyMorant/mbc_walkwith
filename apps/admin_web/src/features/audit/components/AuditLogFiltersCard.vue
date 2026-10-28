<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

import type { AuditLogFilterForm } from "../audit_log_workspace_models";

defineProps<{
  filters: AuditLogFilterForm;
  loadedCount: number;
  pending: boolean;
}>();

defineEmits<{ apply: []; clear: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card>
    <v-form class="pa-5" @submit.prevent="$emit('apply')">
      <v-row dense>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.action"
            :label="t('audit.actionFilter')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.resourceType"
            :label="t('audit.resourceTypeFilter')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.resourceId"
            :label="t('audit.resourceIdFilter')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            v-model="filters.actorUserId"
            :label="t('audit.actorFilter')"
            density="compact"
            variant="outlined"
            hide-details
            clearable
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
          {{ t("audit.applyFilters") }}
        </v-btn>
        <v-btn
          variant="text"
          prepend-icon="mdi-filter-remove-outline"
          :disabled="pending"
          @click="$emit('clear')"
        >
          {{ t("audit.clearFilters") }}
        </v-btn>
        <v-spacer />
        <v-chip color="primary" variant="tonal">
          {{ t("audit.loaded") }} {{ loadedCount }}
        </v-chip>
      </div>
    </v-form>
  </v-card>
</template>
