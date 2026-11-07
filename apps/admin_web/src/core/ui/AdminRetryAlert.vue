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
    :type="alertType"
    variant="tonal"
    :density="alertDensity"
  >
    <div
      class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
    >
      <span>{{ message }}</span>
      <v-btn
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
