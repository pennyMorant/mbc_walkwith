<script setup lang="ts">
defineEmits<{ activate: [] }>();
</script>

<template>
  <button
    class="admin-mobile-record"
    type="button"
    @click="$emit('activate')"
  >
    <span class="admin-mobile-record__main">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="admin-mobile-record__trailing">
      <slot name="trailing" />
    </span>
    <v-icon icon="mdi-chevron-right" size="20" />
  </button>
</template>

<style scoped>
.admin-mobile-record {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border: 0;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 14px 16px;
  color: inherit;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.admin-mobile-record:first-child {
  border-top: 0;
}

.admin-mobile-record:hover {
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.admin-mobile-record:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.admin-mobile-record__main,
.admin-mobile-record__trailing {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.admin-mobile-record__main :slotted(span),
.admin-mobile-record__trailing :slotted(span) {
  max-width: 100%;
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
