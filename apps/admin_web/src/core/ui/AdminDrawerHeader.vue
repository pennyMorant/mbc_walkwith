<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    closeLabel: string;
    closeDisabled?: boolean;
  }>(),
  {
    subtitle: "",
    closeDisabled: false
  }
);

defineEmits<{ close: [] }>();

const closeButtonDisabled = computed(() => props.closeDisabled ?? false);
</script>

<template>
  <header class="admin-drawer-header">
    <div class="admin-drawer-header__main">
      <h2 class="admin-drawer-header__title">{{ title }}</h2>
      <div v-if="subtitle" class="admin-drawer-header__subtitle">
        {{ subtitle }}
      </div>
    </div>

    <div v-if="$slots.meta" class="admin-drawer-header__meta">
      <slot name="meta" />
    </div>

    <v-btn
      class="admin-drawer-header__close"
      icon="mdi-close"
      variant="text"
      size="small"
      :aria-label="closeLabel"
      :disabled="closeButtonDisabled"
      @click="$emit('close')"
    />
  </header>
</template>

<style scoped>
.admin-drawer-header {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 12px;
}

.admin-drawer-header__main {
  min-width: 0;
}

.admin-drawer-header__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.admin-drawer-header__subtitle {
  margin-top: 4px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.875rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.admin-drawer-header__meta {
  display: flex;
  max-width: 220px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.admin-drawer-header__close {
  margin-top: -4px;
}

@media (max-width: 520px) {
  .admin-drawer-header {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .admin-drawer-header__meta {
    max-width: none;
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
  }

  .admin-drawer-header__close {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
