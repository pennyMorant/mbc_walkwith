import { z } from "zod";

export const supportedLocales = ["en", "es", "zh-Hans", "zh-Hant"] as const;

export const supportedLocaleSchema = z.enum(supportedLocales);

export const publicLandingQuerySchema = z.object({
  locale: supportedLocaleSchema.default("zh-Hans")
});

export const publicLandingActionKindSchema = z.enum([
  "anchor",
  "external_link",
  "map",
  "phone",
  "email"
]);

export const publicLandingActionTargetSchema = z.enum(["same_tab", "new_tab"]);

export const publicLandingActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().default(null),
  href: z.string(),
  iconName: z.string(),
  kind: publicLandingActionKindSchema,
  target: publicLandingActionTargetSchema.default("same_tab")
});

export const publicLandingIdentitySchema = z.object({
  name: z.string(),
  englishName: z.string(),
  brandMark: z.string(),
  logoUrl: z.string(),
  mission: z.string(),
  welcome: z.string()
});

export const publicLandingHeroSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  mission: z.string(),
  body: z.string(),
  imageUrl: z.string(),
  primaryActions: z.array(publicLandingActionSchema),
  quickActions: z.array(publicLandingActionSchema)
});

export const publicLandingPillarSchema = z.object({
  title: z.string(),
  body: z.string(),
  iconName: z.string()
});

export const publicLandingMissionSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  pillars: z.array(publicLandingPillarSchema)
});

export const publicLandingFactSchema = z.object({
  id: z.string(),
  label: z.string(),
  iconName: z.string()
});

export const publicLandingServiceSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  imageUrl: z.string(),
  facts: z.array(publicLandingFactSchema),
  actions: z.array(publicLandingActionSchema)
});

export const publicLandingEntranceSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  actions: z.array(publicLandingActionSchema)
});

export const publicLandingAppSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  previewTitle: z.string(),
  previewItems: z.array(z.string()),
  highlights: z.array(publicLandingPillarSchema),
  actions: z.array(publicLandingActionSchema)
});

export const publicLandingContactSectionSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  links: z.array(publicLandingActionSchema),
  copyright: z.string()
});

export const publicLandingContentSchema = z.object({
  locale: supportedLocaleSchema,
  identity: publicLandingIdentitySchema,
  brandAction: publicLandingActionSchema,
  navigation: z.array(publicLandingActionSchema),
  headerActions: z.array(publicLandingActionSchema),
  mobileActions: z.array(publicLandingActionSchema),
  hero: publicLandingHeroSchema,
  mission: publicLandingMissionSectionSchema,
  service: publicLandingServiceSectionSchema,
  entrance: publicLandingEntranceSectionSchema,
  app: publicLandingAppSectionSchema,
  contact: publicLandingContactSectionSchema,
  footerActions: z.array(publicLandingActionSchema),
  updatedAt: z.string()
});

export const publicLandingResponseSchema = publicLandingContentSchema;

export type SupportedLocale = z.infer<typeof supportedLocaleSchema>;
export type PublicLandingQuery = z.infer<typeof publicLandingQuerySchema>;
export type PublicLandingActionKind = z.infer<
  typeof publicLandingActionKindSchema
>;
export type PublicLandingActionTarget = z.infer<
  typeof publicLandingActionTargetSchema
>;
export type PublicLandingAction = z.infer<typeof publicLandingActionSchema>;
export type PublicLandingIdentity = z.infer<typeof publicLandingIdentitySchema>;
export type PublicLandingHero = z.infer<typeof publicLandingHeroSchema>;
export type PublicLandingPillar = z.infer<typeof publicLandingPillarSchema>;
export type PublicLandingMissionSection = z.infer<
  typeof publicLandingMissionSectionSchema
>;
export type PublicLandingFact = z.infer<typeof publicLandingFactSchema>;
export type PublicLandingServiceSection = z.infer<
  typeof publicLandingServiceSectionSchema
>;
export type PublicLandingEntranceSection = z.infer<
  typeof publicLandingEntranceSectionSchema
>;
export type PublicLandingAppSection = z.infer<
  typeof publicLandingAppSectionSchema
>;
export type PublicLandingContactSection = z.infer<
  typeof publicLandingContactSectionSchema
>;
export type PublicLandingResponse = z.infer<typeof publicLandingResponseSchema>;
