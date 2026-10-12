import type { AppSetting } from "@mbc/api-contracts";

import { publicLandingDefaultSettings } from "../public/public_landing_defaults.js";

export const seedSettings: AppSetting[] = [
  {
    key: "church.name",
    category: "church",
    label: "Church name",
    description: "Display name used by app and admin surfaces.",
    value: "MBC WalkWith",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.timezone",
    category: "church",
    label: "Church timezone",
    description: "Default timezone for schedules and reporting.",
    value: "America/Los_Angeles",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.about",
    category: "church",
    label: "About church",
    description: "Short church description shown in the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.address",
    category: "church",
    label: "Church address",
    description: "Address shown in the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.mapUrl",
    category: "church",
    label: "Map URL",
    description: "External map link opened from the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.contactPhone",
    category: "church",
    label: "Church phone",
    description: "Phone number opened from the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "church.contactEmail",
    category: "church",
    label: "Church email",
    description: "Email address opened from the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "app.defaultLocale",
    category: "app",
    label: "Default locale",
    description: "Fallback locale for member-facing app copy.",
    value: "system",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "ai.runtime",
    category: "ai",
    label: "AI runtime configuration",
    description: "Encrypted provider credentials and enabled model policy.",
    value: null,
    updatedAt: "2026-08-10T00:00:00.000Z"
  },
  {
    key: "features.prayerEnabled",
    category: "features",
    label: "Prayer enabled",
    description: "Controls whether prayer submission surfaces are shown.",
    value: true,
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "features.givingEnabled",
    category: "features",
    label: "Giving enabled",
    description: "Controls whether giving surfaces are shown.",
    value: true,
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "member.registrationMode",
    category: "member",
    label: "Member registration mode",
    description: "Controls whether members can register from the App.",
    value: "open",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "member.requireEmailVerification",
    category: "member",
    label: "Require email verification",
    description: "Controls whether App registration must verify email first.",
    value: true,
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "member.requireAdminApproval",
    category: "member",
    label: "Require admin approval",
    description: "Controls whether newly registered members wait for review.",
    value: false,
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "member.registrationHelpText",
    category: "member",
    label: "Registration help text",
    description: "Optional note shown near member registration surfaces.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "legal.privacyPolicyUrl",
    category: "legal",
    label: "Privacy policy URL",
    description: "External privacy policy link shown in the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    key: "legal.termsOfUseUrl",
    category: "legal",
    label: "Terms of use URL",
    description: "External terms link shown in the App About card.",
    value: "",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  ...publicLandingDefaultSettings
];

export const seedSettingByKey = new Map(
  seedSettings.map((setting) => [setting.key, setting])
);
