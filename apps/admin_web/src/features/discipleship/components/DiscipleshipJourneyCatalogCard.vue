<script setup lang="ts">
import type { DiscipleshipJourney } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import { discipleshipJourneyStatusColor } from "../discipleship_workspace_models";

defineProps<{
  errorMessage: string;
  journeys: DiscipleshipJourney[];
  pending: boolean;
  selectedJourneyId: string | null;
}>();

defineEmits<{
  retry: [];
  select: [journey: DiscipleshipJourney];
}>();

const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="journeys.length === 0"
      :empty-title="t('No discipleship journeys match the current filters.')"
      empty-icon="mdi-map-marker-path"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-list lines="three">
        <v-list-item
          v-for="journey in journeys"
          :key="journey.id"
          :active="selectedJourneyId === journey.id"
          @click="$emit('select', journey)"
        >
          <template #title>
            <div class="font-weight-bold">{{ journey.title }}</div>
          </template>
          <template #subtitle>
            <div>{{ journey.description || t("common.notSet") }}</div>
            <div class="d-flex align-center ga-2 mt-1">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="discipleshipJourneyStatusColor(journey.status)"
              >
                {{ t(journey.status) }}
              </v-chip>
              <span class="text-caption">{{ journey.id }}</span>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </AdminDataState>
  </v-card>
</template>
