<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminRefreshAlert from "@/core/ui/AdminRefreshAlert.vue";

defineProps<{
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
}>();
defineEmits<{ retry: [] }>();
const { t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="pending"
    :error-message="errorMessage"
    :empty="false"
    empty-title=""
    :retry-label="t('common.retry')"
    @retry="$emit('retry')"
  >
    <AdminRefreshAlert
      class="mb-3"
      :message="refreshErrorMessage"
      :retry-label="t('common.retry')"
      @retry="$emit('retry')"
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
    <slot />
  </AdminDataState>
</template>
