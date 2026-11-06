<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

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
    <AdminRefreshAlert
      class="mb-3"
      :message="refreshErrorMessage"
      :retry-label="t('common.retry')"
      @retry="emit('retry')"
    />
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
