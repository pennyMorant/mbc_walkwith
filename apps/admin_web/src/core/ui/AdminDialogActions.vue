<script setup lang="ts">
import { computed } from "vue";

type ButtonVariant =
  | "flat"
  | "text"
  | "elevated"
  | "tonal"
  | "outlined"
  | "plain";

const props = withDefaults(
  defineProps<{
    cancelLabel: string;
    confirmLabel: string;
    confirmColor?: string;
    confirmVariant?: ButtonVariant;
    loading?: boolean;
    cancelDisabled?: boolean;
    confirmDisabled?: boolean;
  }>(),
  {
    confirmColor: "primary",
    confirmVariant: "flat",
    loading: false,
    cancelDisabled: false,
    confirmDisabled: false
  }
);

defineEmits<{
  cancel: [];
  confirm: [];
}>();

const actionLoading = computed(() => props.loading ?? false);
const actionColor = computed(() => props.confirmColor ?? "primary");
const actionVariant = computed(() => props.confirmVariant ?? "flat");
const cancelButtonDisabled = computed(
  () => actionLoading.value || (props.cancelDisabled ?? false)
);
const confirmButtonDisabled = computed(
  () => actionLoading.value || (props.confirmDisabled ?? false)
);
</script>

<template>
  <v-card-actions class="admin-dialog-actions">
    <div v-if="$slots.leading" class="admin-dialog-actions__leading">
      <slot name="leading" />
    </div>
    <div class="admin-dialog-actions__primary">
      <v-btn
        variant="text"
        :disabled="cancelButtonDisabled"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </v-btn>
      <v-btn
        :color="actionColor"
        :variant="actionVariant"
        :loading="actionLoading"
        :disabled="confirmButtonDisabled"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </v-btn>
    </div>
  </v-card-actions>
</template>

<style scoped>
.admin-dialog-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 24px 24px;
}

.admin-dialog-actions__leading,
.admin-dialog-actions__primary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.admin-dialog-actions__primary {
  grid-column: 2;
  justify-content: flex-end;
}

@media (max-width: 420px) {
  .admin-dialog-actions {
    grid-template-columns: 1fr;
    padding: 8px 20px 20px;
  }

  .admin-dialog-actions__leading,
  .admin-dialog-actions__primary {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-dialog-actions__leading {
    grid-column: 1;
  }

  .admin-dialog-actions__leading :deep(.v-btn:only-child) {
    grid-column: 1 / -1;
  }

  .admin-dialog-actions__primary {
    grid-column: 1;
  }

  .admin-dialog-actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
