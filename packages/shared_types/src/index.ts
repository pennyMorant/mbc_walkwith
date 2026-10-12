export const contentStatuses = [
  "draft",
  "processing",
  "needs_review",
  "published",
  "archived",
  "failed"
] as const;

export type ContentStatus = (typeof contentStatuses)[number];

export const lifePostStatuses = [
  "draft",
  "needs_review",
  "published",
  "archived"
] as const;

export type LifePostStatus = (typeof lifePostStatuses)[number];

export const visibilityLevels = ["public", "members", "group", "private"] as const;

export type VisibilityLevel = (typeof visibilityLevels)[number];

export const supportedLocales = ["en", "es", "zh-Hans", "zh-Hant"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const bibleTranslationIds = ["web", "cuvs", "cuvt"] as const;

export type BibleTranslationId = (typeof bibleTranslationIds)[number];

export const adminRoles = [
  "owner",
  "admin",
  "pastor",
  "content_editor",
  "finance",
  "viewer"
] as const;

export type AdminRole = (typeof adminRoles)[number];

export const adminUserStatuses = ["active", "disabled"] as const;

export type AdminUserStatus = (typeof adminUserStatuses)[number];
