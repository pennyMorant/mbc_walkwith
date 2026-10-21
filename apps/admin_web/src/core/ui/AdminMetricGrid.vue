<script setup lang="ts">
type AdminMetricItem = {
  icon: string;
  id: string;
  label: string;
  tone?: "error" | "info" | "primary" | "secondary" | "success" | "warning";
  value: number | string;
};

defineProps<{ items: AdminMetricItem[] }>();
</script>

<template>
  <div class="admin-metric-grid">
    <v-card
      v-for="item in items"
      :key="item.id"
      class="admin-metric-card"
    >
      <div class="admin-metric-card__copy">
        <div class="admin-metric-card__label">{{ item.label }}</div>
        <div class="admin-metric-card__value">{{ item.value }}</div>
      </div>
      <div
        :class="[
          'admin-metric-card__icon',
          `admin-metric-card__icon--${item.tone ?? 'primary'}`
        ]"
      >
        <v-icon :icon="item.icon" size="22" />
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.admin-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.admin-metric-card {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.admin-metric-card__copy { min-width: 0; }
.admin-metric-card__label { color: rgba(var(--v-theme-on-surface), 0.64); font-size: 13px; font-weight: 600; }
.admin-metric-card__value { margin-top: 6px; overflow-wrap: anywhere; font-size: 28px; line-height: 1.1; font-weight: 800; }
.admin-metric-card__icon { display: flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.1); }
.admin-metric-card__icon--secondary { color: rgb(var(--v-theme-secondary)); background: rgba(var(--v-theme-secondary), 0.1); }
.admin-metric-card__icon--info { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.1); }
.admin-metric-card__icon--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.11); }
.admin-metric-card__icon--success { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.1); }
.admin-metric-card__icon--error { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.1); }
</style>
