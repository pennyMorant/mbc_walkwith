<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message?: string;
    confirmLabel: string;
    cancelLabel: string;
    color?: string;
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    maxWidth?: number | string;
  }>(),
  {
    color: "primary",
    icon: "mdi-alert-circle-outline",
    message: "",
    loading: false,
    disabled: false,
    maxWidth: 440
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();

const dialogColor = computed(() => props.color ?? "primary");
const dialogIcon = computed(() => props.icon ?? "mdi-alert-circle-outline");
const dialogLoading = computed(() => props.loading ?? false);
const confirmDisabled = computed(
  () => dialogLoading.value || (props.disabled ?? false)
);
const dialogMaxWidth = computed(() => props.maxWidth ?? 440);

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (open: boolean) => {
    if (open || !dialogLoading.value) {
      emit("update:modelValue", open);
    }
  }
});

function confirm() {
  if (!confirmDisabled.value) {
    emit("confirm");
  }
}
</script>

<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="dialogMaxWidth"
    :persistent="dialogLoading"
  >
    <v-card class="admin-confirm-dialog">
      <div class="admin-confirm-dialog__header">
        <v-avatar :color="dialogColor" variant="tonal" rounded="lg" size="42">
          <v-icon :icon="dialogIcon" size="22" aria-hidden="true" />
        </v-avatar>
        <div class="admin-confirm-dialog__title">{{ title }}</div>
      </div>

      <v-card-text class="admin-confirm-dialog__message">
        <slot>{{ message }}</slot>
      </v-card-text>

      <v-card-actions class="admin-confirm-dialog__actions">
        <v-btn
          variant="text"
          :disabled="dialogLoading"
          @click="dialogOpen = false"
        >
          {{ cancelLabel }}
        </v-btn>
        <v-btn
          :color="dialogColor"
          variant="tonal"
          :loading="dialogLoading"
          :disabled="confirmDisabled"
          @click="confirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.admin-confirm-dialog {
  overflow: hidden;
}

.admin-confirm-dialog__header {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  padding: 24px 24px 0;
}

.admin-confirm-dialog__title {
  min-width: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.admin-confirm-dialog__message {
  padding: 18px 24px 8px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.admin-confirm-dialog__actions {
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 24px;
}

@media (max-width: 420px) {
  .admin-confirm-dialog__header {
    padding: 20px 20px 0;
  }

  .admin-confirm-dialog__message {
    padding: 16px 20px 6px;
  }

  .admin-confirm-dialog__actions {
    display: grid;
    grid-template-columns: 1fr;
    padding: 14px 20px 20px;
  }

  .admin-confirm-dialog__actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
