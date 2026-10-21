<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";

const props = defineProps<{
  loaded: number;
  pending: number;
  privateCount: number;
}>();
const { t } = useI18n();
const items = computed(() => [
  { id: "loaded", label: t("Loaded requests"), value: props.loaded, icon: "mdi-hands-pray", tone: "primary" as const },
  { id: "pending", label: t("Pending review"), value: props.pending, icon: "mdi-clock-alert-outline", tone: "warning" as const },
  { id: "private", label: t("Private"), value: props.privateCount, icon: "mdi-lock-outline", tone: "secondary" as const }
]);
</script>

<template>
  <AdminMetricGrid :items="items" />
</template>
