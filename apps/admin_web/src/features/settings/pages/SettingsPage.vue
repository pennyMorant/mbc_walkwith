<script setup lang="ts">
import type { AppSetting } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listSettings, updateSetting } from "@/core/api/settings";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n, type AppLocale } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import SettingsEditorDrawer from "../components/SettingsEditorDrawer.vue";
import SettingsFiltersCard from "../components/SettingsFiltersCard.vue";
import SettingsGroupGrid from "../components/SettingsGroupGrid.vue";
import { cloneLandingSettingValue, isPublicLandingStructuredSetting } from "../public_landing_editor";
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

type SettingEditorType = "boolean" | "number" | "select" | "string" | "json" | "landing";

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

const filters = reactive({
  category: "",
  query: ""
});

const activeFilters = computed(() => ({ ...filters, limit: 100 }));
const settingsQuery = useQuery({
  queryKey: ["settings", activeFilters],
  queryFn: () => listSettings(activeFilters.value)
});

const updateMutation = useMutation({
  mutationFn: (input: { key: string; value: unknown }) =>
    updateSetting(input.key, { value: input.value }),
  onSuccess: async (setting) => {
    if (setting.key === "app.defaultLocale") {
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
    openSetting(setting);
    await queryClient.invalidateQueries({ queryKey: ["settings"] });
  }
});

const settings = computed(() => settingsQuery.data.value ?? []);
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
  () =>
    parseError.value ||
    formatApiErrorMessage(updateMutation.error.value, t("common.error"))
);

function settingEditorType(setting: AppSetting): SettingEditorType {
  if (isPublicLandingStructuredSetting(setting.key)) return "landing";
  if (
    setting.key === "app.defaultLocale" ||
    setting.key === "church.timezone" ||
    setting.key === "member.registrationMode"
  ) {
    return "select";
  }
  if (typeof setting.value === "boolean") return "boolean";
  if (typeof setting.value === "number") return "number";
  if (
    typeof setting.value === "string" ||
    setting.value === null ||
    setting.value === undefined
  ) {
    return "string";
  }
  return "json";
}

function settingIcon(setting: AppSetting) {
  const editorType = settingEditorType(setting);
  if (editorType === "boolean") return "mdi-toggle-switch-outline";
  if (editorType === "select") return "mdi-format-list-bulleted";
  if (editorType === "number") return "mdi-numeric";
  if (editorType === "json") return "mdi-code-json";
  return "mdi-form-textbox";
}

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

function settingPreview(setting: AppSetting) {
  if (typeof setting.value === "boolean") {
    return setting.value ? t("common.enabled") : t("common.disabled");
  }
  if (setting.value === null || setting.value === undefined || setting.value === "") {
    return t("common.notSet");
  }
  if (setting.key === "app.defaultLocale") {
    return (
      localeSettingItems.value.find((item) => item.value === setting.value)
        ?.title ?? String(setting.value)
    );
  }
  if (setting.key === "member.registrationMode") {
    return (
      memberRegistrationModeItems.value.find(
        (item) => item.value === setting.value
      )?.title ?? String(setting.value)
    );
  }
  if (typeof setting.value === "object") {
    if (Array.isArray(setting.value)) {
      return `${setting.value.length} ${t("settings.arrayItems")}`;
    }
    const preview = objectPreview(setting.value);
    if (preview) {
      return preview;
    }
    return t("settings.objectValue");
  }
  return String(setting.value);
}

function objectPreview(value: object) {
  if ("title" in value && typeof value.title === "string") {
    return value.title;
  }
  if ("name" in value && typeof value.name === "string") {
    return value.name;
  }
  if ("eyebrow" in value && typeof value.eyebrow === "string") {
    return value.eyebrow;
  }
  return "";
}

function settingPreviewColor(setting: AppSetting) {
  if (typeof setting.value !== "boolean") {
    return "primary";
  }
  return setting.value ? "success" : "grey";
}

function openSetting(setting: AppSetting) {
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
  drawer.value = true;
}

function saveSetting() {
  if (!selectedSetting.value || !canUpdate.value) {
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
  updateMutation.mutate({ key: selectedSetting.value.key, value });
}

function formattedUpdatedAt(setting: AppSetting) {
  return new Intl.DateTimeFormat(dateTimeLocale(locale.value), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(setting.updatedAt));
}

function dateTimeLocale(value: AppLocale) {
  return {
    en: "en-US",
    es: "es-US",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW"
  }[value];
}

function currentEditorType() {
  return selectedSetting.value ? settingEditorType(selectedSetting.value) : "string";
}

function currentSelectItems() {
  return selectedSetting.value ? selectItems(selectedSetting.value) : [];
}
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
          @click="settingsQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <SettingsFiltersCard
      :filters="filters"
      :category-filter-items="categoryFilterItems"
      :refetch="settingsQuery.refetch"
    />

    <AdminDataState
      class="mt-6"
      :pending="settingsQuery.isPending.value"
      :error-message="settingsQuery.error.value ? formatApiErrorMessage(settingsQuery.error.value, t('common.error')) : ''"
      :empty="settings.length === 0"
      :empty-title="t('settings.empty')"
      empty-icon="mdi-tune-variant"
      :retry-label="t('common.refresh')"
      @retry="settingsQuery.refetch()"
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
        :setting-preview="settingPreview"
        :setting-preview-color="settingPreviewColor"
        :edit-label="t('common.edit')"
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
