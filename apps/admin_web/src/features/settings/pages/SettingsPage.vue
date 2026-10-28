<script setup lang="ts">
import type { AppSetting } from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { updateSetting } from "@/core/api/settings";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { formatAdminDateTime } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import SettingsEditorDrawer from "../components/SettingsEditorDrawer.vue";
import SettingsFiltersCard from "../components/SettingsFiltersCard.vue";
import SettingsGroupGrid from "../components/SettingsGroupGrid.vue";
import { useSettingsQuery } from "../composables/use_settings_query";
import { cloneLandingSettingValue, isPublicLandingStructuredSetting } from "../public_landing_editor";
import {
  settingEditorType,
  settingIcon,
  settingPreview,
  settingPreviewColor
} from "../settings_editor_presenters";
import {
  baseSettingCategories,
  categoryColor,
  categoryDescription,
  categoryIcon,
  categorySort,
  categoryTitle,
  settingDescription,
  settingTitle
} from "../settings_presenters";
import {
  isCurrentSettingEditorContext,
  type SettingEditorContext
} from "../settings_workspace_models";

type SettingUpdateIntent = SettingEditorContext & { value: unknown };

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { locale, resetLocaleToSystem, setLocale, t } = useI18n();

const selectedSetting = ref<AppSetting | null>(null);
const drawer = ref(false);
const valueText = ref("");
const valueBoolean = ref(false);
const valueNumber = ref<number | null>(null);
const structuredValue = ref<unknown>(null);
const parseError = ref("");
const editorCommandError = ref("");
let editorContextVersion = 0;

const {
  filters,
  settingsQuery,
  settings,
  applyFilters,
  clearFilters,
  refreshList
} = useSettingsQuery(queryClient);

const updateMutation = useMutation({
  onMutate: (intent: SettingUpdateIntent) => {
    if (isCurrentEditorContext(intent)) {
      editorCommandError.value = "";
    }
    return intent;
  },
  mutationFn: (intent: SettingUpdateIntent) =>
    updateSetting(intent.settingKey, { value: intent.value }),
  onSuccess: async (setting, _intent, context) => {
    applyLocaleSideEffect(setting);
    if (isCurrentEditorContext(context)) {
      syncSettingEditor(setting);
    }
    await queryClient.invalidateQueries({ queryKey: ["settings"] });
  },
  onError: (error, _intent, context) => {
    if (isCurrentEditorContext(context)) {
      editorCommandError.value = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }
});

const canUpdate = computed(() => authStore.can("settings:update"));
const groupedSettings = computed(() => {
  const groups = new Map<string, AppSetting[]>();
  for (const setting of settings.value) {
    const group = groups.get(setting.category) ?? [];
    group.push(setting);
    groups.set(setting.category, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => categorySort(a) - categorySort(b) || a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      items
    }));
});

const categoryFilterItems = computed(() => {
  const categories = new Set([
    ...baseSettingCategories,
    ...settings.value.map((setting) => setting.category)
  ]);
  return [
    { title: t("common.all"), value: "" },
    ...[...categories].sort((a, b) => categorySort(a) - categorySort(b)).map(
      (category) => ({
        title: categoryTitle(category, t),
        value: category
      })
    )
  ];
});

const localeSettingItems = computed(() => [
  { title: t("locale.system"), value: "system" },
  { title: t("locale.en"), value: "en" },
  { title: t("locale.es"), value: "es" },
  { title: t("locale.zh-Hans"), value: "zh-Hans" },
  { title: t("locale.zh-Hant"), value: "zh-Hant" }
]);

const timezoneItems = computed(() => [
  { title: t("settings.timezone.pacific"), value: "America/Los_Angeles" },
  { title: t("settings.timezone.eastern"), value: "America/New_York" },
  { title: t("settings.timezone.central"), value: "America/Chicago" },
  { title: t("settings.timezone.mountain"), value: "America/Denver" },
  { title: "UTC", value: "UTC" }
]);

const memberRegistrationModeItems = computed(() => [
  { title: t("settings.memberRegistrationMode.open"), value: "open" },
  { title: t("settings.memberRegistrationMode.closed"), value: "closed" },
  { title: t("settings.memberRegistrationMode.adminOnly"), value: "admin_only" }
]);

const errorMessage = computed(
  () => parseError.value || editorCommandError.value
);
const queryError = computed(() =>
  settingsQuery.error.value
    ? formatApiErrorMessage(settingsQuery.error.value, t("common.error"))
    : ""
);
const initialQueryError = computed(() =>
  settings.value.length === 0 ? queryError.value : ""
);
const backgroundQueryError = computed(() =>
  settings.value.length > 0 ? queryError.value : ""
);

function selectItems(setting: AppSetting) {
  if (setting.key === "app.defaultLocale") {
    return localeSettingItems.value;
  }
  if (setting.key === "church.timezone") {
    return timezoneItems.value;
  }
  if (setting.key === "member.registrationMode") {
    return memberRegistrationModeItems.value;
  }
  return [];
}

function settingPreviewText(setting: AppSetting) {
  return settingPreview(setting, {
    localeItems: localeSettingItems.value,
    registrationModeItems: memberRegistrationModeItems.value,
    t
  });
}

function openSetting(setting: AppSetting) {
  if (updateMutation.isPending.value) {
    return;
  }
  editorContextVersion += 1;
  updateMutation.reset();
  editorCommandError.value = "";
  syncSettingEditor(setting);
  drawer.value = true;
}

function syncSettingEditor(setting: AppSetting) {
  selectedSetting.value = setting;
  valueText.value =
    typeof setting.value === "string"
      ? setting.value
      : setting.value === null || setting.value === undefined
        ? ""
        : JSON.stringify(setting.value, null, 2);
  valueBoolean.value =
    typeof setting.value === "boolean" ? setting.value : false;
  valueNumber.value = typeof setting.value === "number" ? setting.value : null;
  parseError.value = "";
  structuredValue.value = isPublicLandingStructuredSetting(setting.key)
    ? cloneLandingSettingValue(setting.value)
    : null;
}

function saveSetting() {
  if (
    !selectedSetting.value ||
    !canUpdate.value ||
    updateMutation.isPending.value
  ) {
    return;
  }
  parseError.value = "";
  const editorType = settingEditorType(selectedSetting.value);
  let value: unknown;
  if (editorType === "boolean") {
    value = valueBoolean.value;
  } else if (editorType === "number") {
    if (valueNumber.value === null || Number.isNaN(valueNumber.value)) {
      parseError.value = t("settings.valueNumberError");
      return;
    }
    value = valueNumber.value;
  } else if (editorType === "landing") {
    value = structuredValue.value;
  } else if (editorType === "json") {
    try {
      value = JSON.parse(valueText.value);
    } catch {
      parseError.value = t("settings.valueJsonError");
      return;
    }
  } else {
    value = valueText.value;
  }
  updateMutation.mutate({
    settingKey: selectedSetting.value.key,
    contextVersion: editorContextVersion,
    value
  });
}

function formattedUpdatedAt(setting: AppSetting) {
  return formatAdminDateTime(setting.updatedAt, locale.value);
}

function isCurrentEditorContext(context: SettingEditorContext | undefined) {
  return isCurrentSettingEditorContext(
    context,
    selectedSetting.value?.key,
    editorContextVersion
  );
}

function applyLocaleSideEffect(setting: AppSetting) {
  if (setting.key !== "app.defaultLocale") {
    return;
  }
  if (setting.value === "system") {
    resetLocaleToSystem();
  } else if (
    setting.value === "en" ||
    setting.value === "es" ||
    setting.value === "zh-Hans" ||
    setting.value === "zh-Hant"
  ) {
    setLocale(setting.value);
  }
}

function currentEditorType() {
  return selectedSetting.value ? settingEditorType(selectedSetting.value) : "string";
}

function currentSelectItems() {
  return selectedSetting.value ? selectItems(selectedSetting.value) : [];
}

watch(drawer, (open) => {
  if (!open) {
    editorContextVersion += 1;
    editorCommandError.value = "";
    parseError.value = "";
  }
});
</script>

<template>
  <div>
    <AdminPageHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="settingsQuery.isFetching.value"
          @click="refreshList"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert
      v-if="backgroundQueryError"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <div
        class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3"
      >
        <span>{{ t("settings.refreshFailed") }}</span>
        <v-btn
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refreshList"
        >
          {{ t("Retry") }}
        </v-btn>
      </div>
    </v-alert>

    <SettingsFiltersCard
      :filters="filters"
      :category-filter-items="categoryFilterItems"
      :loaded-count="settings.length"
      :pending="settingsQuery.isFetching.value"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <AdminDataState
      class="mt-6"
      :pending="settingsQuery.isPending.value"
      :error-message="initialQueryError"
      :empty="settings.length === 0"
      :empty-title="t('settings.empty')"
      empty-icon="mdi-tune-variant"
      :retry-label="t('common.refresh')"
      @retry="refreshList"
    >
      <SettingsGroupGrid
        :groups="groupedSettings"
        :category-title="(category) => categoryTitle(category, t)"
        :category-description="(category) => categoryDescription(category, t)"
        :category-color="categoryColor"
        :category-icon="categoryIcon"
        :setting-title="(setting) => settingTitle(setting, t)"
        :setting-description="(setting) => settingDescription(setting, t)"
        :setting-icon="settingIcon"
        :setting-preview="settingPreviewText"
        :setting-preview-color="settingPreviewColor"
        :edit-label="t('common.edit')"
        :disabled="updateMutation.isPending.value"
        @open="openSetting"
      />
    </AdminDataState>

    <SettingsEditorDrawer
      v-model="drawer"
      v-model:value-text="valueText"
      v-model:value-boolean="valueBoolean"
      v-model:value-number="valueNumber"
      v-model:structured-value="structuredValue"
      :setting="selectedSetting"
      :editor-type="currentEditorType()"
      :select-items="currentSelectItems()"
      :can-update="canUpdate"
      :save-pending="updateMutation.isPending.value"
      :error-message="errorMessage"
      :updated-at="selectedSetting ? formattedUpdatedAt(selectedSetting) : ''"
      :setting-title="(setting) => settingTitle(setting, t)"
      :setting-description="(setting) => settingDescription(setting, t)"
      :category-title="(category) => categoryTitle(category, t)"
      @save="saveSetting"
    />
  </div>
</template>
