<script setup lang="ts">
defineProps<{
  subtitle?: string;
  title: string;
}>();
</script>

<template>
  <header class="admin-panel-header">
    <div class="admin-panel-header__copy">
      <h2 class="admin-panel-header__title">{{ title }}</h2>
      <div v-if="subtitle" class="admin-panel-header__subtitle">
        {{ subtitle }}
      </div>
    </div>
    <div v-if="$slots.actions" class="admin-panel-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.admin-panel-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.admin-panel-header__copy {
  min-width: 0;
}

.admin-panel-header__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
}

.admin-panel-header__subtitle {
  margin-top: 3px;
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: 14px;
  line-height: 1.45;
}

.admin-panel-header__actions {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 600px) {
  .admin-panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-panel-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
