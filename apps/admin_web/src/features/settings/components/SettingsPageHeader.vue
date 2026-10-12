<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  isFetching: boolean;
  refetch: () => unknown;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4"
  >
    <div>
      <div class="page-title">{{ t("settings.title") }}</div>
      <div class="page-subtitle">
        {{ t("settings.subtitle") }}
      </div>
    </div>
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-refresh"
      :loading="isFetching"
      @click="refetch"
    >
      {{ t("common.refresh") }}
    </v-btn>
  </div>
</template>
