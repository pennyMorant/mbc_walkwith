<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

defineProps<{
  errorMessage?: string;
  refreshErrorMessage?: string;
}>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <AdminRefreshAlert
    class="mb-4"
    :message="refreshErrorMessage"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  />
  <v-alert
    v-if="errorMessage"
    class="mb-4"
    type="error"
    variant="tonal"
  >
    {{ errorMessage }}
  </v-alert>
</template>
