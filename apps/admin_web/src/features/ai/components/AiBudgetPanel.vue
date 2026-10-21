<script setup lang="ts">
import type { AiBudgetPolicy } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

const budget = defineModel<AiBudgetPolicy>({ required: true });
defineProps<{ canManage: boolean; pending: boolean }>();
defineEmits<{ save: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-card class="ai-budget-panel">
    <div class="ai-budget-panel__heading">
      <div class="ai-budget-panel__icon">
        <v-icon icon="mdi-speedometer" />
      </div>
      <div>
        <div class="section-heading">{{ t("ai.tokenLimits") }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ t("ai.tokenLimitsHelp") }}
        </div>
      </div>
    </div>

    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="budget.dailyTokenLimit"
            type="number"
            min="0"
            clearable
            prepend-inner-icon="mdi-calendar-today-outline"
            :label="t('ai.dailyTokenLimit')"
            :disabled="!canManage"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="budget.monthlyTokenLimit"
            type="number"
            min="0"
            clearable
            prepend-inner-icon="mdi-calendar-month-outline"
            :label="t('ai.monthlyTokenLimit')"
            :disabled="!canManage"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions class="justify-end px-4 pb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-content-save-outline"
        :loading="pending"
        :disabled="!canManage"
        @click="$emit('save')"
      >
        {{ t("common.save") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.ai-budget-panel { max-width: 920px; border: 1px solid rgba(var(--v-theme-on-surface), 0.07); }
.ai-budget-panel__heading { display: flex; align-items: center; gap: 14px; padding: 18px 18px 4px; }
.ai-budget-panel__icon { display: flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; color: rgb(var(--v-theme-secondary)); background: rgba(var(--v-theme-secondary), 0.1); }

@media (max-width: 599px) {
  .ai-budget-panel :deep(.v-card-actions .v-btn) { width: 100%; }
}
</style>
