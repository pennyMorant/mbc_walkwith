<script setup lang="ts">
import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

defineProps<{ error: unknown }>();
defineEmits<{ retry: [] }>();

const { t } = useI18n();
</script>

<template>
  <AdminRetryAlert
    :message="error
      ? `${t('giving.refreshFailed')} ${formatApiErrorMessage(error, t('common.error'))}`
      : ''"
    :retry-label="t('Retry')"
    type="warning"
    button-color="warning"
    class="ma-4"
    @retry="$emit('retry')"
  />
</template>
