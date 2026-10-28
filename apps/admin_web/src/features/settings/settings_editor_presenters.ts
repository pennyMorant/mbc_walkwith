import type { AppSetting } from "@mbc/api-contracts";

import { isPublicLandingStructuredSetting } from "./public_landing_editor";

export type SettingEditorType =
  | "boolean"
  | "number"
  | "select"
  | "string"
  | "json"
  | "landing";

type PreviewOption = { title: string; value: string };
type SettingPreviewOptions = {
  localeItems: PreviewOption[];
  registrationModeItems: PreviewOption[];
  t: (key: string) => string;
};

export function settingEditorType(setting: AppSetting): SettingEditorType {
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

export function settingIcon(setting: AppSetting) {
  const editorType = settingEditorType(setting);
  if (editorType === "boolean") return "mdi-toggle-switch-outline";
  if (editorType === "select") return "mdi-format-list-bulleted";
  if (editorType === "number") return "mdi-numeric";
  if (editorType === "json") return "mdi-code-json";
  return "mdi-form-textbox";
}

export function settingPreview(
  setting: AppSetting,
  options: SettingPreviewOptions
) {
  if (typeof setting.value === "boolean") {
    return setting.value
      ? options.t("common.enabled")
      : options.t("common.disabled");
  }
  if (
    setting.value === null ||
    setting.value === undefined ||
    setting.value === ""
  ) {
    return options.t("common.notSet");
  }
  if (setting.key === "app.defaultLocale") {
    return previewOptionTitle(setting.value, options.localeItems);
  }
  if (setting.key === "member.registrationMode") {
    return previewOptionTitle(setting.value, options.registrationModeItems);
  }
  if (typeof setting.value === "object") {
    if (Array.isArray(setting.value)) {
      return `${setting.value.length} ${options.t("settings.arrayItems")}`;
    }
    return objectPreview(setting.value) || options.t("settings.objectValue");
  }
  return String(setting.value);
}

export function settingPreviewColor(setting: AppSetting) {
  if (typeof setting.value !== "boolean") {
    return "primary";
  }
  return setting.value ? "success" : "grey";
}

function previewOptionTitle(value: unknown, items: PreviewOption[]) {
  return items.find((item) => item.value === value)?.title ?? String(value);
}

function objectPreview(value: object) {
  if ("title" in value && typeof value.title === "string") return value.title;
  if ("name" in value && typeof value.name === "string") return value.name;
  if ("eyebrow" in value && typeof value.eyebrow === "string") {
    return value.eyebrow;
  }
  return "";
}
