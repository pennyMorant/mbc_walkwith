<script setup lang="ts">
import type { ReadingPlan } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  errorMessage: string;
  plans: ReadingPlan[];
  selectedPlanId: string | null;
  pending: boolean;
}>();
defineEmits<{ retry: []; select: [plan: ReadingPlan] }>();

const { t } = useI18n();
</script>

<template>
  <v-card variant="outlined">
    <AdminDataState
      :pending="pending"
      :error-message="errorMessage"
      :empty="plans.length === 0"
      :empty-title="t('No reading plans match the current filters.')"
      empty-icon="mdi-book-open-page-variant-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-list lines="three">
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
    </AdminDataState>
  </v-card>
</template>
