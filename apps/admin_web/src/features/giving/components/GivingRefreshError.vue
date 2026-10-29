<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{ error: unknown }>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-alert v-if="error" type="warning" variant="tonal" class="ma-4">
    <div
      class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
    >
      <span>
        {{ t("giving.refreshFailed") }}
        {{ formatApiErrorMessage(error, t("common.error")) }}
      </span>
      <v-btn
        color="warning"
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        @click="$emit('retry')"
      >
        {{ t("Retry") }}
      </v-btn>
    </div>
  </v-alert>
</template>
