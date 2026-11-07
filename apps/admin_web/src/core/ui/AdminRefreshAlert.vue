<script setup lang="ts">
import AdminRetryAlert from "./AdminRetryAlert.vue";

defineProps<{
  message: string | undefined;
  retryLabel: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <AdminRetryAlert
    :message="message"
    :retry-label="retryLabel"
    type="warning"
    density="compact"
    button-variant="text"
    prepend-icon=""
    @retry="$emit('retry')"
  />
</template>
