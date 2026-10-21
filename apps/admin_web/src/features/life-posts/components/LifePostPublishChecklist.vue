<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  ready: boolean;
  checks: Array<{ label: string; detail: string; ok: boolean }>;
}>();

const { t } = useI18n();
</script>

<template>
  <v-sheet class="life-publish-checklist mb-4" rounded border>
    <div class="pa-4">
      <div class="d-flex align-center justify-space-between ga-3">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ t("Publish checklist") }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ t("Review required fields before sending content to the app.") }}
          </div>
        </div>
        <v-chip :color="ready ? 'success' : 'warning'" size="small" variant="tonal">
          {{ ready ? t("Ready to publish") : t("Incomplete") }}
        </v-chip>
      </div>
      <v-list density="compact" class="mt-2 pa-0">
        <v-list-item v-for="check in checks" :key="check.label" class="px-0">
          <template #prepend>
            <v-icon :color="check.ok ? 'success' : 'warning'" :icon="check.ok ? 'mdi-check-circle' : 'mdi-alert-circle'" />
          </template>
          <v-list-item-title>{{ check.label }}</v-list-item-title>
          <v-list-item-subtitle>{{ check.detail }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>
  </v-sheet>
</template>

<style scoped>
.life-publish-checklist { background: rgb(var(--v-theme-surface)); }
</style>
