<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    closeLabel: string;
    subtitle?: string;
    icon?: string;
    iconColor?: string;
    closeDisabled?: boolean;
  }>(),
  {
    subtitle: "",
    icon: "",
    iconColor: "primary",
    closeDisabled: false
  }
);

defineEmits<{ close: [] }>();

const closeButtonDisabled = computed(() => props.closeDisabled ?? false);
</script>

<template>
  <header class="admin-dialog-header">
    <v-avatar
      v-if="icon"
      class="admin-dialog-header__icon"
      :color="iconColor"
      variant="tonal"
      rounded="lg"
      size="42"
    >
      <v-icon :icon="icon" size="22" aria-hidden="true" />
    </v-avatar>

    <div class="admin-dialog-header__copy">
      <h2 class="admin-dialog-header__title">{{ title }}</h2>
      <div v-if="subtitle" class="admin-dialog-header__subtitle">
        {{ subtitle }}
      </div>
    </div>

    <v-btn
      class="admin-dialog-header__close"
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
.admin-dialog-header {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
  padding: 24px 24px 0;
}

.admin-dialog-header__icon {
  flex: none;
}

.admin-dialog-header__copy {
  min-width: 0;
  align-self: center;
}

.admin-dialog-header__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.admin-dialog-header__subtitle {
  margin-top: 3px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.875rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.admin-dialog-header__close {
  margin-top: -4px;
}

@media (max-width: 420px) {
  .admin-dialog-header {
    gap: 12px;
    padding: 20px 20px 0;
  }

  .admin-dialog-header__icon {
    display: none;
  }
}
</style>
