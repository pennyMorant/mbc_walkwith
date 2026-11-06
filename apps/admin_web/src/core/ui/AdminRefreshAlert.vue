<script setup lang="ts">
defineProps<{
  message: string;
  retryLabel: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <v-alert
    v-if="message"
    type="warning"
    variant="tonal"
    density="compact"
  >
    <div
      class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
    >
      <span>{{ message }}</span>
      <v-btn size="small" variant="text" @click="$emit('retry')">
        {{ retryLabel }}
      </v-btn>
    </div>
  </v-alert>
</template>
