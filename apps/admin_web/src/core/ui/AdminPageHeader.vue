<script setup lang="ts">
defineProps<{
  subtitle?: string;
  title: string;
}>();
</script>

<template>
  <header class="admin-page-header">
    <div class="admin-page-header__copy">
      <h1 class="admin-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="admin-page-header__subtitle">
        {{ subtitle }}
      </p>
    </div>
    <div v-if="$slots.actions" class="admin-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.admin-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 0.55);
}

.admin-page-header__copy {
  min-width: 0;
}

.admin-page-header__title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0;
}

.admin-page-header__subtitle {
  max-width: 820px;
  margin: 7px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.68);
  line-height: 1.5;
}

.admin-page-header__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 600px) {
  .admin-page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 16px;
  }

  .admin-page-header__title {
    font-size: 24px;
  }

  .admin-page-header__subtitle {
    font-size: 14px;
  }

  .admin-page-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
