<script setup lang="ts">
import type { GivingSummary } from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";

const props = defineProps<{
  summary: GivingSummary | undefined;
  dollars: (amountCents: number | undefined) => string;
}>();

const { t } = useI18n();
const items = computed(() => [
  { id: "total", label: t("Succeeded total"), value: props.dollars(props.summary?.totalAmountCents), icon: "mdi-hand-heart-outline", tone: "success" as const },
  { id: "transactions", label: t("Transactions"), value: props.summary?.transactionCount ?? 0, icon: "mdi-receipt-text-outline", tone: "primary" as const },
  { id: "donors", label: t("Donors"), value: props.summary?.donorCount ?? 0, icon: "mdi-account-group-outline", tone: "info" as const }
]);
</script>

<template>
  <AdminMetricGrid :items="items" />
</template>
