import type { AppSetting } from "@mbc/api-contracts";

type Translate = (key: string) => string;

const orderedCategories = [
  "church",
  "legal",
  "public_landing",
  "app",
  "member",
  "features",
  "sermons"
];

export const baseSettingCategories = [
  "app",
  "church",
  "legal",
  "member",
  "features",
  "public_landing",
  "sermons"
];

export function categorySort(category: string) {
  return orderedCategories.indexOf(category) >= 0
    ? orderedCategories.indexOf(category)
    : 99;
}

export function categoryTitle(category: string, t: Translate) {
  if (category === "app") return t("settings.categories.app.title");
  if (category === "church") return t("settings.categories.church.title");
  if (category === "legal") return t("settings.categories.legal.title");
  if (category === "member") return t("settings.categories.member.title");
  if (category === "public_landing") {
    return t("settings.categories.publicLanding.title");
  }
  if (category === "features") return t("settings.categories.features.title");
  if (category === "sermons") return t("settings.categories.sermons.title");
  return category;
}

export function categoryDescription(category: string, t: Translate) {
  if (category === "app") return t("settings.categories.app.description");
  if (category === "church") return t("settings.categories.church.description");
  if (category === "legal") {
    return t("settings.categories.legal.description");
  }
  if (category === "member") {
    return t("settings.categories.member.description");
  }
  if (category === "public_landing") {
    return t("settings.categories.publicLanding.description");
  }
  if (category === "features") {
    return t("settings.categories.features.description");
  }
  if (category === "sermons") {
    return t("settings.categories.sermons.description");
  }
  return "";
}

export function categoryIcon(category: string) {
  if (category === "app") return "mdi-cellphone-cog";
  if (category === "church") return "mdi-church";
  if (category === "legal") return "mdi-file-document-outline";
  if (category === "member") return "mdi-account-group";
  if (category === "public_landing") return "mdi-web";
  if (category === "features") return "mdi-toggle-switch";
  if (category === "sermons") return "mdi-microphone";
  return "mdi-cog";
}

export function categoryColor(category: string) {
  if (category === "features") return "secondary";
  if (category === "member") return "warning";
  if (category === "legal") return "indigo";
  if (category === "public_landing") return "success";
  if (category === "sermons") return "info";
  return "primary";
}

export function settingTitle(setting: AppSetting, t: Translate) {
  if (setting.key === "app.defaultLocale") {
    return t("settings.keys.app.defaultLocale.label");
  }
  if (setting.key === "church.name") {
    return t("settings.keys.church.name.label");
  }
  if (setting.key === "church.timezone") {
    return t("settings.keys.church.timezone.label");
  }
  if (setting.key === "features.givingEnabled") {
    return t("settings.keys.features.givingEnabled.label");
  }
  if (setting.key === "features.prayerEnabled") {
    return t("settings.keys.features.prayerEnabled.label");
  }
  if (setting.key === "member.registrationMode") {
    return t("settings.keys.member.registrationMode.label");
  }
  if (setting.key === "member.requireEmailVerification") {
    return t("settings.keys.member.requireEmailVerification.label");
  }
  if (setting.key === "member.requireAdminApproval") {
    return t("settings.keys.member.requireAdminApproval.label");
  }
  if (setting.key === "member.registrationHelpText") {
    return t("settings.keys.member.registrationHelpText.label");
  }
  return setting.label;
}

export function settingDescription(setting: AppSetting, t: Translate) {
  if (setting.key === "app.defaultLocale") {
    return t("settings.keys.app.defaultLocale.description");
  }
  if (setting.key === "church.name") {
    return t("settings.keys.church.name.description");
  }
  if (setting.key === "church.timezone") {
    return t("settings.keys.church.timezone.description");
  }
  if (setting.key === "features.givingEnabled") {
    return t("settings.keys.features.givingEnabled.description");
  }
  if (setting.key === "features.prayerEnabled") {
    return t("settings.keys.features.prayerEnabled.description");
  }
  if (setting.key === "member.registrationMode") {
    return t("settings.keys.member.registrationMode.description");
  }
  if (setting.key === "member.requireEmailVerification") {
    return t("settings.keys.member.requireEmailVerification.description");
  }
  if (setting.key === "member.requireAdminApproval") {
    return t("settings.keys.member.requireAdminApproval.description");
  }
  if (setting.key === "member.registrationHelpText") {
    return t("settings.keys.member.registrationHelpText.description");
  }
  return setting.description;
}
