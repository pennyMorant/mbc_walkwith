<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

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
    <v-alert
      v-if="refreshErrorMessage"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex align-center ga-3">
        <span class="flex-grow-1">{{ refreshErrorMessage }}</span>
        <v-btn size="small" variant="text" @click="$emit('retry')">
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
    <slot />
  </AdminDataState>
</template>
