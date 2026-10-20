<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{ fetching: boolean; canCreate: boolean }>();
defineEmits<{ refresh: []; create: [] }>();

const { locale, t } = useI18n();
const greetingKey = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greeting.morning";
  if (hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
});
const currentDate = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  }).format(new Date())
);
</script>

<template>
  <header class="dashboard-header d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-4">
    <div>
      <h1 class="dashboard-header__title">{{ t(greetingKey) }}</h1>
      <div class="text-body-2 text-medium-emphasis mt-1">{{ currentDate }}</div>
    </div>
    <div class="d-flex align-center ga-2">
      <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-pencil-outline" @click="$emit('create')">
        {{ t("dashboard.newLifePost") }}
      </v-btn>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" :loading="fetching" :aria-label="t('common.refresh')" @click="$emit('refresh')" />
    </div>
  </header>
</template>

<style scoped>
.dashboard-header__title { margin: 0; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: 0; }
</style>
