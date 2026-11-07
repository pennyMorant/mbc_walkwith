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
  <div v-if="pending" class="admin-data-state__pending" aria-busy="true">
    <v-progress-circular indeterminate color="primary" size="30" width="3" />
  </div>
  <AdminRetryAlert
    v-else-if="errorMessage && retryLabel"
    class="admin-data-state__alert ma-4"
    :message="errorMessage"
    :retry-label="retryLabel"
    @retry="$emit('retry')"
  />
  <v-alert
    v-else-if="errorMessage"
    type="error"
    variant="tonal"
    class="admin-data-state__alert ma-4"
  >
    {{ errorMessage }}
  </v-alert>
  <v-empty-state
    v-else-if="empty"
    :icon="emptyIcon"
    :title="emptyTitle"
    class="admin-data-state__empty py-10 px-4"
  />
  <slot v-else />
</template>

<style scoped>
.admin-data-state__pending {
  display: grid;
  min-height: 112px;
  place-items: center;
}

.admin-data-state__alert {
  min-width: 0;
}

.admin-data-state__empty {
  min-height: 180px;
}

@media (max-width: 600px) {
  .admin-data-state__pending {
    min-height: 96px;
  }

  .admin-data-state__empty {
    min-height: 150px;
  }
}
</style>
