<script setup lang="ts">
defineEmits<{ activate: [] }>();
</script>

<template>
  <tr
    class="admin-table-action-row"
    role="button"
    tabindex="0"
    @click="$emit('activate')"
    @keydown.enter="$emit('activate')"
    @keydown.space.prevent="$emit('activate')"
  >
    <slot />
  </tr>
</template>

<style scoped>
.admin-table-action-row {
  cursor: pointer;
}

.admin-table-action-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.admin-table-action-row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
</style>
