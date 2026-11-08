<script setup lang="ts">
import AdminRetryAlert from "./AdminRetryAlert.vue";

defineProps<{
  pending: boolean;
  errorMessage: string;
  retryLabel: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <v-progress-linear
    v-if="pending"
    class="admin-deep-link-state mb-4"
    indeterminate
    color="primary"
    aria-busy="true"
  />
  <AdminRetryAlert
    v-else-if="errorMessage"
    class="admin-deep-link-state mb-4"
    :message="errorMessage"
    :retry-label="retryLabel"
    @retry="$emit('retry')"
  />
</template>

<style scoped>
.admin-deep-link-state {
  min-width: 0;
}
</style>
