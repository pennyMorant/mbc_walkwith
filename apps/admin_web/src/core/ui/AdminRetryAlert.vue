<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    message: string | undefined;
    retryLabel: string;
    type?: "error" | "warning" | "info";
    density?: "default" | "comfortable" | "compact";
    buttonColor?: string;
    buttonVariant?: "text" | "tonal";
    prependIcon?: string;
    loading?: boolean;
  }>(),
  {
    type: "error",
    density: "default",
    buttonColor: "",
    buttonVariant: "tonal",
    prependIcon: "mdi-refresh",
    loading: false
  }
);

defineEmits<{ retry: [] }>();

const alertType = computed<"error" | "warning" | "info">(
  () => props.type ?? "error"
);
const alertDensity = computed<"default" | "comfortable" | "compact">(
  () => props.density ?? "default"
);
const retryButtonColor = computed(() => props.buttonColor || alertType.value);
const retryButtonVariant = computed<"text" | "tonal">(
  () => props.buttonVariant ?? "tonal"
);
const retryButtonIcon = computed(() => props.prependIcon ?? "mdi-refresh");
const retryLoading = computed(() => props.loading ?? false);
</script>

<template>
  <v-alert
    v-if="message"
    class="admin-retry-alert"
    :type="alertType"
    variant="tonal"
    :density="alertDensity"
  >
    <div class="admin-retry-alert__content">
      <span class="admin-retry-alert__message">{{ message }}</span>
      <v-btn
        class="admin-retry-alert__action"
        :color="retryButtonColor"
        :variant="retryButtonVariant"
        size="small"
        :prepend-icon="retryButtonIcon"
        :loading="retryLoading"
        @click="$emit('retry')"
      >
        {{ retryLabel }}
      </v-btn>
    </div>
  </v-alert>
</template>

<style scoped>
.admin-retry-alert__content {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-retry-alert__message {
  min-width: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.admin-retry-alert__action {
  flex: 0 0 auto;
}

@media (max-width: 600px) {
  .admin-retry-alert__content {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-retry-alert__action {
    width: 100%;
  }
}
</style>
