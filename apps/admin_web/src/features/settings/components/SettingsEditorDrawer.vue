<script setup lang="ts">
import type { AppSetting } from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import PublicLandingStructuredEditor from "./PublicLandingStructuredEditor.vue";

type SettingEditorType = "boolean" | "number" | "select" | "string" | "json" | "landing";

const open = defineModel<boolean>({ required: true });
const valueText = defineModel<string>("valueText", { required: true });
const valueBoolean = defineModel<boolean>("valueBoolean", { required: true });
const valueNumber = defineModel<number | null>("valueNumber", { required: true });
const structuredValue = defineModel<unknown>("structuredValue", { required: true });

const props = defineProps<{
  setting: AppSetting | null;
  editorType: SettingEditorType;
  selectItems: Array<{ title: string; value: string }>;
  canUpdate: boolean;
  savePending: boolean;
  errorMessage: string;
  updatedAt: string;
  settingTitle: (setting: AppSetting) => string;
  settingDescription: (setting: AppSetting) => string;
  categoryTitle: (category: string) => string;
}>();

defineEmits<{ save: [] }>();
const { t } = useI18n();
const drawerProxy = computed({
  get: () => open.value,
  set: (value: boolean) => {
    if (value || !props.savePending) {
      open.value = value;
    }
  }
});
</script>

<template>
  <AdminResponsiveDrawer v-model="drawerProxy" :desktop-width="560">
    <div v-if="setting" class="pa-4 pa-sm-5">
      <AdminDrawerHeader
        :title="settingTitle(setting)"
        :subtitle="settingDescription(setting)"
        :close-label="t('common.close')"
        :close-disabled="savePending"
        @close="drawerProxy = false"
      />

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-chip size="small" variant="tonal">{{ categoryTitle(setting.category) }}</v-chip>
        <v-chip size="small" variant="tonal" color="secondary">
          {{ t("common.internalKey") }}: {{ setting.key }}
        </v-chip>
      </div>

      <v-form class="mt-5" @submit.prevent="$emit('save')">
        <v-switch
          v-if="editorType === 'boolean'"
          v-model="valueBoolean"
          :label="valueBoolean ? t('settings.featureOn') : t('settings.featureOff')"
          color="primary"
          inset
        />
        <v-select
          v-else-if="editorType === 'select'"
          v-model="valueText"
          :items="selectItems"
          :label="t('settings.value')"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-else-if="editorType === 'number'"
          v-model.number="valueNumber"
          :label="t('settings.value')"
          type="number"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-else-if="editorType === 'string'"
          v-model="valueText"
          :label="t('settings.value')"
          density="comfortable"
          variant="outlined"
        />
        <PublicLandingStructuredEditor
          v-else-if="editorType === 'landing'"
          v-model="structuredValue"
          :setting-key="setting.key"
        />
        <v-textarea
          v-else
          v-model="valueText"
          :label="t('settings.jsonAdvanced')"
          rows="10"
          density="comfortable"
          variant="outlined"
        />

        <div class="text-caption text-medium-emphasis mb-4">
          {{ t("settings.lastUpdated") }}: {{ updatedAt }}
        </div>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <div class="d-flex flex-column flex-sm-row justify-end ga-3">
          <v-btn
            variant="text"
            :disabled="savePending"
            @click="drawerProxy = false"
          >
            {{ t("common.cancel") }}
          </v-btn>
          <v-btn type="submit" color="primary" :disabled="!canUpdate" :loading="savePending">
            {{ t("common.save") }}
          </v-btn>
        </div>
      </v-form>
    </div>
  </AdminResponsiveDrawer>
</template>
