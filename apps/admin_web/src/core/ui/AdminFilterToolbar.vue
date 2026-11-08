<script setup lang="ts">
defineEmits<{ apply: [] }>();
</script>

<template>
  <div class="admin-filter-toolbar">
    <div v-if="$slots.heading" class="admin-filter-toolbar__heading">
      <slot name="heading" />
    </div>
    <v-form
      class="admin-filter-toolbar__controls"
      @submit.prevent="$emit('apply')"
    >
      <slot />
      <div v-if="$slots.actions" class="admin-filter-toolbar__actions">
        <slot name="actions" />
      </div>
    </v-form>
  </div>
</template>

<style scoped>
.admin-filter-toolbar {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

.admin-filter-toolbar__heading {
  min-width: 0;
}

.admin-filter-toolbar__controls {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.admin-filter-toolbar__controls :deep(.admin-filter-control) {
  width: 100%;
  min-width: 0;
}

.admin-filter-toolbar__actions {
  width: 100%;
  flex: 0 0 auto;
}

.admin-filter-toolbar__actions > :deep(.v-btn) {
  width: 100%;
}

@media (min-width: 600px) {
  .admin-filter-toolbar__controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .admin-filter-toolbar__controls :deep(.admin-filter-control) {
    flex: 1 1 180px;
  }

  .admin-filter-toolbar__actions,
  .admin-filter-toolbar__actions > :deep(.v-btn) {
    width: auto;
  }
}

@media (min-width: 1280px) {
  .admin-filter-toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .admin-filter-toolbar__heading {
    flex: 1 1 260px;
  }

  .admin-filter-toolbar__controls {
    width: auto;
    flex: 0 1 auto;
    flex-wrap: nowrap;
  }

  .admin-filter-toolbar__controls :deep(.admin-filter-control) {
    width: 180px;
    flex: 0 1 180px;
  }
}
</style>
