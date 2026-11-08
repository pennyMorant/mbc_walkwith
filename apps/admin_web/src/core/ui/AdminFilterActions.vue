<script setup lang="ts">
withDefaults(
  defineProps<{
    applyLabel: string;
    clearLabel: string;
    loading: boolean;
    iconOnly?: boolean;
    alignEnd?: boolean;
  }>(),
  {
    iconOnly: false,
    alignEnd: false
  }
);

defineEmits<{ clear: [] }>();
</script>

<template>
  <div
    class="admin-filter-actions"
    :class="{
      'admin-filter-actions--end': alignEnd,
      'admin-filter-actions--icon-only': iconOnly
    }"
  >
    <template v-if="iconOnly">
      <v-btn
        type="submit"
        icon="mdi-filter-check-outline"
        color="primary"
        variant="tonal"
        :loading="loading"
        :aria-label="applyLabel"
        :title="applyLabel"
      />
      <v-btn
        type="button"
        icon="mdi-filter-remove-outline"
        variant="text"
        :disabled="loading"
        :aria-label="clearLabel"
        :title="clearLabel"
        @click="$emit('clear')"
      />
    </template>
    <template v-else>
      <v-btn
        type="submit"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-filter-outline"
        :loading="loading"
      >
        {{ applyLabel }}
      </v-btn>
      <v-btn
        type="button"
        variant="text"
        prepend-icon="mdi-filter-remove-outline"
        :disabled="loading"
        @click="$emit('clear')"
      >
        {{ clearLabel }}
      </v-btn>
    </template>
  </div>
</template>

<style scoped>
.admin-filter-actions {
  display: flex;
  min-width: 0;
  min-height: 40px;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

@media (min-width: 960px) {
  .admin-filter-actions--end {
    justify-content: flex-end;
  }
}

@media (max-width: 420px) {
  .admin-filter-actions {
    width: 100%;
  }

  .admin-filter-actions:not(.admin-filter-actions--icon-only) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-filter-actions:not(.admin-filter-actions--icon-only) :deep(.v-btn) {
    width: 100%;
  }
}
</style>
