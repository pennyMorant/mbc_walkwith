<script setup lang="ts">
import type { AppSetting } from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { listSettings, updateSetting } from "@/core/api/settings";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n, type AppLocale } from "@/core/i18n/i18n";
import SettingsFiltersCard from "../components/SettingsFiltersCard.vue";
import SettingsPageHeader from "../components/SettingsPageHeader.vue";
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

type SettingEditorType = "boolean" | "number" | "select" | "string" | "json";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { locale, resetLocaleToSystem, setLocale, t } = useI18n();

const selectedSetting = ref<AppSetting | null>(null);
const drawer = ref(false);
const valueText = ref("");
const valueBoolean = ref(false);
const valueNumber = ref<number | null>(null);
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
    <SettingsPageHeader
      :is-fetching="settingsQuery.isFetching.value"
      :refetch="settingsQuery.refetch"
    />

    <SettingsFiltersCard
      :filters="filters"
      :category-filter-items="categoryFilterItems"
      :refetch="settingsQuery.refetch"
    />

    <v-progress-linear
      v-if="settingsQuery.isPending.value"
      indeterminate
      color="primary"
      class="mt-6"
    />

    <v-alert
      v-else-if="settingsQuery.error.value"
      type="error"
      variant="tonal"
      class="mt-6"
    >
      {{ formatApiErrorMessage(settingsQuery.error.value, t("common.error")) }}
    </v-alert>

    <v-alert
      v-else-if="settings.length === 0"
      type="info"
      variant="tonal"
      class="mt-6"
    >
      {{ t("settings.empty") }}
    </v-alert>

    <v-row v-else class="mt-4" dense>
      <v-col
        v-for="group in groupedSettings"
        :key="group.category"
        cols="12"
        lg="6"
      >
        <v-card class="h-100">
          <div class="pa-4 pa-sm-5">
            <div class="d-flex align-start ga-3">
              <v-avatar
                :color="categoryColor(group.category)"
                variant="tonal"
                rounded="lg"
              >
                <v-icon :icon="categoryIcon(group.category)" />
              </v-avatar>
              <div class="min-w-0">
                <div class="text-subtitle-1 font-weight-bold">
                  {{ categoryTitle(group.category, t) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ categoryDescription(group.category, t) }}
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
              @click="openSetting(setting)"
            >
              <template #prepend>
                <v-avatar color="secondary" variant="tonal" size="36">
                  <v-icon :icon="settingIcon(setting)" size="20" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">
                {{ settingTitle(setting, t) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ settingDescription(setting, t) }}
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
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    :aria-label="t('common.edit')"
                  />
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-navigation-drawer v-model="drawer" location="right" temporary width="560">
      <div v-if="selectedSetting" class="pa-4 pa-sm-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">
              {{ settingTitle(selectedSetting, t) }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ settingDescription(selectedSetting, t) }}
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('common.close')"
            @click="drawer = false"
          />
        </div>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-chip size="small" variant="tonal">
            {{ categoryTitle(selectedSetting.category, t) }}
          </v-chip>
          <v-chip size="small" variant="tonal" color="secondary">
            {{ t("common.internalKey") }}: {{ selectedSetting.key }}
          </v-chip>
        </div>

        <v-form class="mt-5" @submit.prevent="saveSetting">
          <v-switch
            v-if="currentEditorType() === 'boolean'"
            v-model="valueBoolean"
            :label="
              valueBoolean ? t('settings.featureOn') : t('settings.featureOff')
            "
            color="primary"
            inset
          />
          <v-select
            v-else-if="currentEditorType() === 'select'"
            v-model="valueText"
            :items="currentSelectItems()"
            :label="t('settings.value')"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-else-if="currentEditorType() === 'number'"
            v-model.number="valueNumber"
            :label="t('settings.value')"
            type="number"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-else-if="currentEditorType() === 'string'"
            v-model="valueText"
            :label="t('settings.value')"
            density="comfortable"
            variant="outlined"
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
            {{ t("settings.lastUpdated") }}:
            {{ formattedUpdatedAt(selectedSetting) }}
          </div>

          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex flex-column flex-sm-row justify-end ga-3">
            <v-btn variant="text" @click="drawer = false">
              {{ t("common.cancel") }}
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :disabled="!canUpdate"
              :loading="updateMutation.isPending.value"
            >
              {{ t("common.save") }}
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-navigation-drawer>
  </div>
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
