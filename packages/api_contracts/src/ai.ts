import { z } from "zod";

export const aiProviderSchema = z.enum([
  "disabled",
  "openai",
  "gemini",
  "openai_compatible"
]);

export const aiManagedProviderTypeSchema = z.enum([
  "openai",
  "gemini",
  "openai_compatible"
]);

export const aiCapabilitySchema = z.enum([
  "content_translation",
  "admin_drafts",
  "member_study"
]);

export const aiProviderConfigSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  type: aiManagedProviderTypeSchema,
  enabled: z.boolean().default(true),
  baseUrl: z.string().url().nullable().default(null),
  apiKeyConfigured: z.boolean(),
  apiKeySuffix: z.string().nullable().default(null),
  defaultModel: z.string().trim().min(1).max(160),
  updatedAt: z.string()
});

export const aiProviderConfigUpdateSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  type: aiManagedProviderTypeSchema,
  enabled: z.boolean().default(true),
  baseUrl: z.string().url().nullable().optional(),
  apiKey: z.string().trim().min(1).max(2000).optional(),
  defaultModel: z.string().trim().min(1).max(160)
});

export const aiModelPolicySchema = z.object({
  capability: aiCapabilitySchema,
  providerId: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(160),
  fallbackProviderId: z.string().trim().min(1).max(80).nullable().default(null),
  fallbackModel: z.string().trim().min(1).max(160).nullable().default(null),
  maxOutputTokens: z.number().int().positive().max(32000),
  timeoutMs: z.number().int().positive().max(180000)
});

export const aiModelPolicyUpdateSchema = aiModelPolicySchema;

export const aiBudgetPolicySchema = z.object({
  monthlyTokenLimit: z.number().int().nonnegative().nullable().default(null),
  dailyTokenLimit: z.number().int().nonnegative().nullable().default(null)
});

export const aiUsageRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  actorUserId: z.string().nullable(),
  task: z.string(),
  capability: aiCapabilitySchema.nullable(),
  resourceType: z.string(),
  resourceId: z.string(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  status: z.enum(["succeeded", "failed"]),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  errorCode: z.string().nullable()
});

export const aiManagementOverviewSchema = z.object({
  providers: z.array(aiProviderConfigSchema),
  policies: z.array(aiModelPolicySchema),
  budget: aiBudgetPolicySchema,
  usage: z.array(aiUsageRecordSchema),
  todayTokens: z.number().int().nonnegative(),
  monthTokens: z.number().int().nonnegative()
});

export const aiProviderTestResultSchema = z.object({
  ok: z.boolean(),
  provider: aiProviderSchema,
  model: z.string().nullable(),
  latencyMs: z.number().int().nonnegative().nullable(),
  errorCode: z.string().nullable()
});

export const adminAiTaskSchema = z.enum([
  "sermon_summary",
  "sermon_outline",
  "life_post_draft",
  "notification_draft"
]);

export const memberAiTaskSchema = z.enum([
  "bible_study_help",
  "sermon_qa"
]);

export const aiTaskSchema = z.union([adminAiTaskSchema, memberAiTaskSchema]);

export const aiLocaleSchema = z
  .enum(["zh-Hans", "zh-Hant", "en", "es"])
  .default("zh-Hans");

export const aiTaskInputLimits = {
  title: 200,
  body: 12000,
  reference: 200,
  question: 1000,
  audience: 200,
  contextItems: 12,
  contextLabel: 80,
  contextValue: 3000,
  resourceId: 120
} as const;

export const aiContextItemSchema = z.object({
  label: z.string().trim().min(1).max(aiTaskInputLimits.contextLabel),
  value: z.string().trim().min(1).max(aiTaskInputLimits.contextValue)
});

export const aiTaskInputSchema = z.object({
  title: z.string().trim().max(aiTaskInputLimits.title).optional(),
  body: z.string().trim().max(aiTaskInputLimits.body).optional(),
  reference: z.string().trim().max(aiTaskInputLimits.reference).optional(),
  question: z.string().trim().max(aiTaskInputLimits.question).optional(),
  audience: z.string().trim().max(aiTaskInputLimits.audience).optional(),
  context: z
    .array(aiContextItemSchema)
    .max(aiTaskInputLimits.contextItems)
    .default([])
});

export const aiResourceReferenceSchema = z.object({
  resourceType: z
    .enum(["sermon", "life_post", "notification", "bible_passage", "other"])
    .default("other"),
  resourceId: z
    .string()
    .trim()
    .min(1)
    .max(aiTaskInputLimits.resourceId)
    .optional()
});

const biblePassageAiResourceSchema = z.object({
  resourceType: z.literal("bible_passage"),
  resourceId: z.string().trim().min(1).max(aiTaskInputLimits.resourceId)
});

const sermonAiResourceSchema = z.object({
  resourceType: z.literal("sermon"),
  resourceId: z.string().trim().min(1).max(aiTaskInputLimits.resourceId)
});

const optionalAiResourceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(aiTaskInputLimits.resourceId)
  .optional();

const adminSermonAiResourceSchema = z.object({
  resourceType: z.literal("sermon"),
  resourceId: optionalAiResourceIdSchema
});

const adminLifePostAiResourceSchema = z.object({
  resourceType: z.literal("life_post"),
  resourceId: optionalAiResourceIdSchema
});

const adminNotificationAiResourceSchema = z.discriminatedUnion(
  "resourceType",
  [
    z.object({
      resourceType: z.literal("notification"),
      resourceId: optionalAiResourceIdSchema
    }),
    adminLifePostAiResourceSchema
  ]
);

const adminAiDraftRequestFields = {
  locale: aiLocaleSchema,
  input: aiTaskInputSchema
};

const requiredMemberAiQuestionSchema = z
  .string()
  .trim()
  .min(1)
  .max(aiTaskInputLimits.question);

const bibleStudyAiTaskInputSchema = aiTaskInputSchema.extend({
  reference: z
    .string()
    .trim()
    .min(1)
    .max(aiTaskInputLimits.reference),
  question: requiredMemberAiQuestionSchema
});

const sermonQaAiTaskInputSchema = aiTaskInputSchema.extend({
  question: requiredMemberAiQuestionSchema
});

export const adminAiDraftRequestSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("sermon_summary"),
    ...adminAiDraftRequestFields,
    resource: adminSermonAiResourceSchema.optional()
  }),
  z.object({
    task: z.literal("sermon_outline"),
    ...adminAiDraftRequestFields,
    resource: adminSermonAiResourceSchema.optional()
  }),
  z.object({
    task: z.literal("life_post_draft"),
    ...adminAiDraftRequestFields,
    resource: adminLifePostAiResourceSchema.optional()
  }),
  z.object({
    task: z.literal("notification_draft"),
    ...adminAiDraftRequestFields,
    resource: adminNotificationAiResourceSchema.optional()
  })
]);

export const memberAiStudyRequestSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("bible_study_help"),
    locale: aiLocaleSchema,
    input: bibleStudyAiTaskInputSchema,
    resource: biblePassageAiResourceSchema
  }),
  z.object({
    task: z.literal("sermon_qa"),
    locale: aiLocaleSchema,
    input: sermonQaAiTaskInputSchema,
    resource: sermonAiResourceSchema
  })
]);

export const aiUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative().nullable().default(null),
  outputTokens: z.number().int().nonnegative().nullable().default(null),
  totalTokens: z.number().int().nonnegative().nullable().default(null)
});

export const aiDraftResponseSchema = z.object({
  task: aiTaskSchema,
  markdown: z.string().trim().min(1),
  provider: aiProviderSchema,
  model: z.string().trim().min(1),
  safetyNotice: z.string().trim().min(1),
  usage: aiUsageSchema,
  latencyMs: z.number().int().nonnegative()
});

export const aiStatusResponseSchema = z.object({
  enabled: z.boolean(),
  provider: aiProviderSchema,
  model: z.string().nullable(),
  auditEnabled: z.boolean(),
  supportedAdminTasks: z.array(adminAiTaskSchema),
  supportedMemberTasks: z.array(memberAiTaskSchema)
});

export type AiProviderId = z.infer<typeof aiProviderSchema>;
export type AiManagedProviderType = z.infer<typeof aiManagedProviderTypeSchema>;
export type AiCapability = z.infer<typeof aiCapabilitySchema>;
export type AiProviderConfig = z.infer<typeof aiProviderConfigSchema>;
export type AiProviderConfigUpdate = z.infer<typeof aiProviderConfigUpdateSchema>;
export type AiModelPolicy = z.infer<typeof aiModelPolicySchema>;
export type AiModelPolicyUpdate = z.infer<typeof aiModelPolicyUpdateSchema>;
export type AiBudgetPolicy = z.infer<typeof aiBudgetPolicySchema>;
export type AiUsageRecord = z.infer<typeof aiUsageRecordSchema>;
export type AiManagementOverview = z.infer<typeof aiManagementOverviewSchema>;
export type AiProviderTestResult = z.infer<typeof aiProviderTestResultSchema>;
export type AdminAiTask = z.infer<typeof adminAiTaskSchema>;
export type MemberAiTask = z.infer<typeof memberAiTaskSchema>;
export type AiTask = z.infer<typeof aiTaskSchema>;
export type AiLocale = z.infer<typeof aiLocaleSchema>;
export type AiContextItem = z.infer<typeof aiContextItemSchema>;
export type AiTaskInput = z.infer<typeof aiTaskInputSchema>;
export type AiResourceReference = z.infer<typeof aiResourceReferenceSchema>;
export type AdminAiDraftRequest = z.infer<typeof adminAiDraftRequestSchema>;
export type MemberAiStudyRequest = z.infer<typeof memberAiStudyRequestSchema>;
export type AiUsage = z.infer<typeof aiUsageSchema>;
export type AiDraftResponse = z.infer<typeof aiDraftResponseSchema>;
export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;
