<script setup lang="ts">
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
  <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-4">
    <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
      <span>{{ errorMessage }}</span>
      <v-btn
        v-if="retryLabel"
        color="error"
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        @click="$emit('retry')"
      >
        {{ retryLabel }}
      </v-btn>
    </div>
  </v-alert>
  <v-empty-state
    v-else-if="empty"
    :icon="emptyIcon"
    :title="emptyTitle"
    class="py-8"
  />
  <slot v-else />
</template>
