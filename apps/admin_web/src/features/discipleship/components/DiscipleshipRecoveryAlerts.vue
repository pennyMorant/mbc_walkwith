<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  errorMessage?: string;
  refreshErrorMessage?: string;
}>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <v-alert
    v-if="refreshErrorMessage"
    class="mb-4"
    type="warning"
    variant="tonal"
  >
    <div class="d-flex align-center justify-space-between ga-3">
      <span>{{ refreshErrorMessage }}</span>
      <v-btn size="small" variant="text" @click="$emit('retry')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
  </v-alert>
  <v-alert
    v-if="errorMessage"
    class="mb-4"
    type="error"
    variant="tonal"
  >
    {{ errorMessage }}
  </v-alert>
</template>
