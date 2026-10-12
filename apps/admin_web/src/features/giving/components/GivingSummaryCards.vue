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
  <v-row class="mt-5" dense>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">
          {{ t("Succeeded total") }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">
          {{ dollars(summary?.totalAmountCents) }}
        </div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">
          {{ t("Transactions") }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">
          {{ summary?.transactionCount ?? 0 }}
        </div>
      </v-card>
    </v-col>
    <v-col cols="12" md="4">
      <v-card class="pa-4">
        <div class="text-caption text-medium-emphasis">
          {{ t("Donors") }}
        </div>
        <div class="text-h5 font-weight-bold mt-1">
          {{ summary?.donorCount ?? 0 }}
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
