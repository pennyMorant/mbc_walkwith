<script setup lang="ts">
import AdminRetryAlert from "./AdminRetryAlert.vue";

withDefaults(
  defineProps<{
    pending: boolean;
    errorMessage: string;
    empty: boolean;
    emptyTitle: string;
    emptyIcon?: string;
    retryLabel?: string;
  }>(),
  {
    emptyIcon: "mdi-database-off-outline",
    retryLabel: ""
  }
);

defineEmits<{ retry: [] }>();
</script>

<template>
  <v-progress-linear v-if="pending" indeterminate color="primary" />
  <AdminRetryAlert
    v-else-if="errorMessage && retryLabel"
    class="ma-4"
    :message="errorMessage"
    :retry-label="retryLabel"
    @retry="$emit('retry')"
  />
  <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-4">
    {{ errorMessage }}
  </v-alert>
  <v-empty-state
    v-else-if="empty"
    :icon="emptyIcon"
    :title="emptyTitle"
    class="py-8"
  />
  <slot v-else />
</template>
