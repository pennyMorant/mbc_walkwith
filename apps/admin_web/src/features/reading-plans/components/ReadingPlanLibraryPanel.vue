<script setup lang="ts">
import type { ReadingPlan } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  plans: ReadingPlan[];
  selectedPlanId: string | null;
  pending: boolean;
}>();
defineEmits<{ select: [plan: ReadingPlan] }>();

const { t } = useI18n();
</script>

<template>
    <v-card variant="outlined">
      <v-list lines="three">
        <v-list-item v-if="pending"><v-progress-linear indeterminate color="primary" /></v-list-item>
        <v-list-item v-else-if="plans.length === 0">
          {{ t("No reading plans match the current filters.") }}
        </v-list-item>
        <v-list-item
          v-for="plan in plans"
          :key="plan.id"
          :active="selectedPlanId === plan.id"
          @click="$emit('select', plan)"
        >
          <template #title><div class="font-weight-bold">{{ plan.title }}</div></template>
          <template #subtitle>
            <div class="text-caption text-medium-emphasis">
              {{ t(plan.status) }} · {{ t(plan.visibility) }} · {{ plan.durationDays }} {{ t("days") }}
            </div>
            <div>{{ plan.description || t("common.notSet") }}</div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
</template>
