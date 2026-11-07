<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    loading: false,
    disabled: false
  }
);

defineEmits<{ refresh: [] }>();
</script>

<template>
  <v-btn
    color="primary"
    variant="tonal"
    prepend-icon="mdi-refresh"
    :loading="loading ?? false"
    :disabled="disabled ?? false"
    @click="$emit('refresh')"
  >
    {{ label }}
  </v-btn>
</template>
