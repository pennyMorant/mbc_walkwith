<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  refreshErrorMessage: string;
  commandErrorMessage: string;
  inset?: boolean;
}>();
const emit = defineEmits<{ retry: [] }>();
const { t } = useI18n();
</script>

<template>
  <div :class="inset ? 'mx-4' : undefined">
    <v-alert
      v-if="refreshErrorMessage"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex align-center ga-3">
        <span class="flex-grow-1">{{ refreshErrorMessage }}</span>
        <v-btn size="small" variant="text" @click="emit('retry')">
          {{ t("common.retry") }}
        </v-btn>
      </div>
    </v-alert>
    <v-alert
      v-if="commandErrorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ commandErrorMessage }}
    </v-alert>
  </div>
</template>
