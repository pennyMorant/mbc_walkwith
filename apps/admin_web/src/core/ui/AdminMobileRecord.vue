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
    <span class="admin-mobile-record__chevron" aria-hidden="true">
      <v-icon icon="mdi-chevron-right" size="19" />
    </span>
  </button>
</template>

<style scoped>
.admin-mobile-record {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  border: 0;
  border-top: 1px solid rgba(var(--v-theme-outline-variant), 0.48);
  padding: 16px;
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
  background: rgba(var(--v-theme-primary), 0.04);
}

.admin-mobile-record:active {
  background: rgba(var(--v-theme-primary), 0.08);
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

.admin-mobile-record__main :slotted(strong) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-mobile-record__chevron {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 10px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  background: rgba(var(--v-theme-surface-variant), 0.58);
}

@media (max-width: 420px) {
  .admin-mobile-record {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .admin-mobile-record__trailing {
    grid-column: 1;
    grid-row: 2;
  }

  .admin-mobile-record__chevron {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
}
</style>
