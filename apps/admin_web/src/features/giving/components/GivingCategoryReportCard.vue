<script setup lang="ts">
import type { GivingSummary } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  summary: GivingSummary | undefined;
  dollars: (amountCents: number | undefined) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <v-card class="pa-5 mt-4">
    <div class="text-subtitle-1 font-weight-bold">
      {{ t("Category report") }}
    </div>
    <v-list density="compact" class="mt-3">
      <v-list-item
        v-for="row in summary?.byCategory ?? []"
        :key="row.category"
        :title="t(row.category)"
        :subtitle="`${row.count} ${t('Transactions')}`"
      >
        <template #append>
          <span class="font-weight-bold">{{ dollars(row.amountCents) }}</span>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
