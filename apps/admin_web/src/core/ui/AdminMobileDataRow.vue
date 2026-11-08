<template>
  <article class="admin-mobile-data-row">
    <div class="admin-mobile-data-row__heading">
      <div class="admin-mobile-data-row__main">
        <slot />
      </div>
      <div v-if="$slots.trailing" class="admin-mobile-data-row__trailing">
        <slot name="trailing" />
      </div>
    </div>
    <div v-if="$slots.meta" class="admin-mobile-data-row__meta">
      <slot name="meta" />
    </div>
    <div v-if="$slots.actions" class="admin-mobile-data-row__actions">
      <slot name="actions" />
    </div>
  </article>
</template>

<style scoped>
.admin-mobile-data-row {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(var(--v-theme-outline-variant), 0.48);
  padding: 16px 0;
}

.admin-mobile-data-row:first-child {
  border-top: 0;
  padding-top: 4px;
}

.admin-mobile-data-row__heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.admin-mobile-data-row__main,
.admin-mobile-data-row__trailing,
.admin-mobile-data-row__meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.admin-mobile-data-row__main {
  flex: 1;
}

.admin-mobile-data-row__meta {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
  line-height: 1.45;
}

.admin-mobile-data-row__actions {
  width: 100%;
}
</style>
