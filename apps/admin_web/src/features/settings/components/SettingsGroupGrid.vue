<script setup lang="ts">
import type { AppSetting } from "@mbc/api-contracts";

defineProps<{
  groups: Array<{ category: string; items: AppSetting[] }>;
  categoryTitle: (category: string) => string;
  categoryDescription: (category: string) => string;
  categoryColor: (category: string) => string;
  categoryIcon: (category: string) => string;
  settingTitle: (setting: AppSetting) => string;
  settingDescription: (setting: AppSetting) => string;
  settingIcon: (setting: AppSetting) => string;
  settingPreview: (setting: AppSetting) => string;
  settingPreviewColor: (setting: AppSetting) => string;
  editLabel: string;
}>();

defineEmits<{ open: [setting: AppSetting] }>();
</script>

<template>
  <v-row class="mt-4" dense>
    <v-col v-for="group in groups" :key="group.category" cols="12" lg="6">
      <v-card class="h-100">
        <div class="pa-4 pa-sm-5">
          <div class="d-flex align-start ga-3">
            <v-avatar :color="categoryColor(group.category)" variant="tonal" rounded="lg">
              <v-icon :icon="categoryIcon(group.category)" />
            </v-avatar>
            <div class="min-w-0">
              <div class="text-subtitle-1 font-weight-bold">
                {{ categoryTitle(group.category) }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ categoryDescription(group.category) }}
              </div>
            </div>
          </div>
        </div>

        <v-divider />
        <v-list lines="three" class="pa-0">
          <v-list-item
            v-for="setting in group.items"
            :key="setting.key"
            class="setting-item"
            @click="$emit('open', setting)"
          >
            <template #prepend>
              <v-avatar color="secondary" variant="tonal" size="36">
                <v-icon :icon="settingIcon(setting)" size="20" />
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">
              {{ settingTitle(setting) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ settingDescription(setting) }}
            </v-list-item-subtitle>
            <template #append>
              <div class="setting-actions">
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="settingPreviewColor(setting)"
                  class="setting-chip"
                >
                  {{ settingPreview(setting) }}
                </v-chip>
                <v-btn icon="mdi-pencil" size="small" variant="text" :aria-label="editLabel" />
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.min-w-0 {
  min-width: 0;
}

.setting-item {
  cursor: pointer;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
}

.setting-chip {
  max-width: 160px;
}

@media (max-width: 600px) {
  .setting-actions {
    align-items: flex-end;
    flex-direction: column;
    max-width: 120px;
  }

  .setting-chip {
    max-width: 112px;
  }
}
</style>
