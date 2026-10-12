import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import type {
  AiBudgetPolicy,
  AiCapability,
  AiManagedProviderType,
  AiManagementOverview,
  AiModelPolicy,
  AiModelPolicyUpdate,
  AiProviderConfig,
  AiProviderConfigUpdate,
  AiUsageRecord
} from "@mbc/api-contracts";

import type { AppConfig } from "../../config/env.js";
import type { AuditService } from "../audit/audit.service.js";
import type { SettingsService } from "../settings/settings.service.js";
import { DisabledAiProvider, MisconfiguredAiProvider } from "./disabled-ai.provider.js";
import { GeminiAiProvider } from "./gemini-ai.provider.js";
import { OpenAiCompatibleAiProvider } from "./openai-compatible-ai.provider.js";
import { FallbackAiProvider } from "./fallback-ai.provider.js";
import type { AiProvider } from "./ai.provider.js";
import type { AiService } from "./ai.service.js";
import { appError } from "../../shared/http/app-error.js";

const runtimeSettingKey = "ai.runtime";
const capabilities: AiCapability[] = [
  "content_translation",
  "admin_drafts",
  "member_study"
];

type StoredProvider = Omit<AiProviderConfig, "apiKeyConfigured" | "apiKeySuffix"> & {
  encryptedApiKey: string | null;
};
type StoredRuntime = {
  providers: StoredProvider[];
  policies: AiModelPolicy[];
  budget: AiBudgetPolicy;
};

export class AiManagementService {
  private runtime: StoredRuntime;

  constructor(
    private readonly config: AppConfig,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly aiService: AiService
  ) {
    this.runtime = defaultRuntime(config);
  }

  async initialize() {
    const setting = await this.settings.getByKey(runtimeSettingKey);
    if (setting?.value) {
      this.runtime = parseRuntime(setting.value, this.config);
    }
    this.applyRuntime();
  }

  async overview(): Promise<AiManagementOverview> {
    const allUsage = await this.listUsage();
    const usage = allUsage.slice(0, 200);
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);
    return {
      providers: this.runtime.providers.map((provider) => publicProvider(provider, this.config.authSecret)),
      policies: this.runtime.policies,
      budget: this.runtime.budget,
      usage,
      todayTokens: tokenTotal(allUsage.filter((item) => item.createdAt.startsWith(todayKey))),
      monthTokens: tokenTotal(allUsage.filter((item) => item.createdAt.startsWith(monthKey)))
    };
  }

  async saveProvider(input: AiProviderConfigUpdate): Promise<AiProviderConfig> {
    const existing = this.runtime.providers.find((item) => item.id === input.id);
    const provider: StoredProvider = {
      id: input.id,
      label: input.label,
      type: input.type,
      enabled: input.enabled,
      baseUrl: input.baseUrl ?? defaultBaseUrl(input.type),
      encryptedApiKey: input.apiKey
        ? encrypt(input.apiKey, this.config.authSecret)
        : existing?.encryptedApiKey ?? null,
      defaultModel: input.defaultModel,
      updatedAt: new Date().toISOString()
    };
    this.runtime = {
      ...this.runtime,
      providers: [...this.runtime.providers.filter((item) => item.id !== provider.id), provider]
    };
    await this.persist();
    this.applyRuntime();
    return publicProvider(provider, this.config.authSecret);
  }

  async savePolicy(input: AiModelPolicyUpdate): Promise<AiModelPolicy> {
    this.assertProviderAvailable(input.providerId, "primary");
    if (input.fallbackProviderId) this.assertProviderAvailable(input.fallbackProviderId, "fallback");
    if (input.fallbackProviderId === input.providerId) {
      throw appError({ code: "ai_fallback_provider_invalid", message: "Fallback provider must differ from the primary provider.", statusCode: 400, category: "validation_error", sourceLayer: "feature", retryable: false, nextAction: "review_request" });
    }
    this.runtime = {
      ...this.runtime,
      policies: [...this.runtime.policies.filter((item) => item.capability !== input.capability), input]
    };
    await this.persist();
    this.applyRuntime();
    return input;
  }

  async saveBudget(input: AiBudgetPolicy): Promise<AiBudgetPolicy> {
    this.runtime = { ...this.runtime, budget: input };
    await this.persist();
    return input;
  }

  async assertBudgetForTask(
    task: string,
    reservation: { inputCharacters: number; providerCalls?: number }
  ) {
    const policy = this.runtime.policies.find((item) => item.capability === capabilityForTask(task));
    if (!policy || (this.runtime.budget.dailyTokenLimit === null && this.runtime.budget.monthlyTokenLimit === null)) return;
    const usage = await this.listUsage();
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const month = now.toISOString().slice(0, 7);
    const daily = tokenTotal(usage.filter((item) => item.createdAt.startsWith(day)));
    const monthly = tokenTotal(usage.filter((item) => item.createdAt.startsWith(month)));
    const providerCalls = Math.max(1, Math.trunc(reservation.providerCalls ?? 1));
    const inputTokens = Math.max(0, Math.ceil(reservation.inputCharacters * 2));
    const reservedTokens = inputTokens + policy.maxOutputTokens * providerCalls;
    if ((this.runtime.budget.dailyTokenLimit !== null && daily + reservedTokens > this.runtime.budget.dailyTokenLimit) || (this.runtime.budget.monthlyTokenLimit !== null && monthly + reservedTokens > this.runtime.budget.monthlyTokenLimit)) {
      throw appError({ code: "ai_token_quota_exceeded", message: "AI token quota reached.", statusCode: 429, category: "ai_budget", sourceLayer: "capability", retryable: false, nextAction: "review_budget" });
    }
  }

  async testProvider(id: string) {
    const provider = this.providerFor(id, undefined);
    if (!provider.enabled) {
      return { ok: false, provider: provider.id, model: provider.model, latencyMs: null, errorCode: "ai_provider_disabled" };
    }
    try {
      const result = await provider.generateText({ systemPrompt: "Reply with exactly OK.", userPrompt: "Health check.", temperature: 0, maxOutputTokens: 4 });
      return { ok: true, provider: result.provider ?? provider.id, model: result.model ?? provider.model, latencyMs: result.latencyMs, errorCode: null };
    } catch (error) {
      return { ok: false, provider: provider.id, model: provider.model, latencyMs: null, errorCode: isAppErrorCode(error) };
    }
  }

  private async listUsage(): Promise<AiUsageRecord[]> {
    const records = await this.audit.listAiRecords();
    return records.flatMap((record) => usageRecordFromAudit(record));
  }

  private async persist() {
    await this.settings.update(runtimeSettingKey, { value: this.runtime });
  }

  private applyRuntime() {
    this.aiService.setProviderResolver((task) => {
      const capability = capabilityForTask(task);
      const policy = this.runtime.policies.find((item) => item.capability === capability);
      const primary = this.providerFor(policy?.providerId, policy?.model, policy);
      const fallback = policy?.fallbackProviderId
        ? this.providerFor(policy.fallbackProviderId, policy.fallbackModel ?? undefined, policy)
        : null;
      return new FallbackAiProvider(primary, fallback);
    });
  }

  private providerFor(
    providerId: string | undefined,
    model: string | undefined,
    policy?: Pick<AiModelPolicy, "timeoutMs" | "maxOutputTokens">
  ): AiProvider {
    const configured = this.runtime.providers.find((item) => item.id === providerId);
    if (!configured || !configured.enabled || !configured.encryptedApiKey) {
      return new DisabledAiProvider();
    }
    const apiKey = decrypt(configured.encryptedApiKey, this.config.authSecret);
    const providerModel = model ?? configured.defaultModel;
    const timeoutMs = policy?.timeoutMs ?? this.config.aiTimeoutMs;
    const maxOutputTokens = policy?.maxOutputTokens ?? this.config.aiMaxOutputTokens;
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      return new MisconfiguredAiProvider(configured.type, providerModel, "invalid_timeout_ms");
    }
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens <= 0) {
      return new MisconfiguredAiProvider(configured.type, providerModel, "invalid_max_output_tokens");
    }
    if (configured.type === "openai_compatible" && !configured.baseUrl) {
      return new MisconfiguredAiProvider(configured.type, providerModel, "missing_base_url");
    }
    if (configured.type === "gemini") {
      return new GeminiAiProvider({
        apiKey,
        baseUrl: configured.baseUrl ?? defaultBaseUrl("gemini")!,
        model: providerModel,
        timeoutMs,
        maxOutputTokens
      });
    }
    return new OpenAiCompatibleAiProvider({
      id: configured.type,
      apiKey,
      baseUrl: configured.baseUrl ?? defaultBaseUrl(configured.type)!,
      model: providerModel,
      timeoutMs,
      maxOutputTokens
    });
  }

  private assertProviderAvailable(providerId: string, role: "primary" | "fallback") {
    if (!this.runtime.providers.some((provider) => provider.id === providerId)) {
      throw appError({ code: "ai_policy_provider_not_found", message: `The ${role} provider is not configured.`, statusCode: 400, category: "validation_error", sourceLayer: "feature", retryable: false, nextAction: "configure_provider" });
    }
  }
}

function defaultRuntime(config: AppConfig): StoredRuntime {
  const providerId = "environment";
  const type = config.aiProvider === "gemini" ? "gemini" : config.aiProvider === "openai_compatible" ? "openai_compatible" : "openai";
  const provider: StoredProvider | null = config.aiProvider === "disabled" ? null : {
    id: providerId,
    label: "Environment default",
    type,
    enabled: Boolean(config.aiApiKey),
    baseUrl: config.aiBaseUrl ?? defaultBaseUrl(type),
    encryptedApiKey: config.aiApiKey ? encrypt(config.aiApiKey, config.authSecret) : null,
    defaultModel: config.aiModel ?? (type === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini"),
    updatedAt: new Date().toISOString()
  };
  return {
    providers: provider ? [provider] : [],
    policies: capabilities.map((capability) => ({
      capability,
      providerId,
      model: provider?.defaultModel ?? "gpt-4o-mini",
      fallbackProviderId: null,
      fallbackModel: null,
      maxOutputTokens: config.aiMaxOutputTokens,
      timeoutMs: config.aiTimeoutMs
    })),
    budget: { monthlyTokenLimit: null, dailyTokenLimit: null }
  };
}

function parseRuntime(value: unknown, config: AppConfig): StoredRuntime {
  if (!value || typeof value !== "object") return defaultRuntime(config);
  const candidate = value as Partial<StoredRuntime>;
  if (!Array.isArray(candidate.providers) || !Array.isArray(candidate.policies)) return defaultRuntime(config);
  return {
    providers: candidate.providers as StoredProvider[],
    policies: candidate.policies as AiModelPolicy[],
    budget: normalizeBudget(candidate.budget)
  };
}

function publicProvider(provider: StoredProvider, secret: string): AiProviderConfig {
  return {
    id: provider.id,
    label: provider.label,
    type: provider.type,
    enabled: provider.enabled,
    baseUrl: provider.baseUrl,
    apiKeyConfigured: Boolean(provider.encryptedApiKey),
    apiKeySuffix: provider.encryptedApiKey ? `••••${decrypt(provider.encryptedApiKey, secret).slice(-4)}` : null,
    defaultModel: provider.defaultModel,
    updatedAt: provider.updatedAt
  };
}

function capabilityForTask(task: string): AiCapability {
  if (task === "content_translation") return "content_translation";
  return task === "bible_study_help" || task === "sermon_qa" ? "member_study" : "admin_drafts";
}

function defaultBaseUrl(type: AiManagedProviderType): string | null {
  if (type === "gemini") return "https://generativelanguage.googleapis.com/v1beta";
  if (type === "openai") return "https://api.openai.com/v1";
  return null;
}

function tokenTotal(records: AiUsageRecord[]) {
  return records.reduce((total, item) => total + (item.totalTokens ?? 0), 0);
}

function usageRecordFromAudit(record: { id: string; createdAt: string; actorUserId: string | null; action: string; resourceType: string; resourceId: string; afterJson?: unknown }): AiUsageRecord[] {
  if (!record.action.startsWith("ai.") || !record.action.endsWith(".generate") && !record.action.endsWith(".failed")) return [];
  const after = record.afterJson && typeof record.afterJson === "object" ? record.afterJson as Record<string, unknown> : {};
  const usage = after.usage && typeof after.usage === "object" ? after.usage as Record<string, unknown> : {};
  const succeeded = after.outcome === "generated";
  const inputTokens = numberOrNull(usage.inputTokens);
  const outputTokens = numberOrNull(usage.outputTokens);
  const reportedTotalTokens = numberOrNull(usage.totalTokens);
  return [{
    id: record.id,
    createdAt: record.createdAt,
    actorUserId: record.actorUserId,
    task: typeof after.task === "string" ? after.task : record.action,
    capability: null,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    provider: typeof after.provider === "string" ? after.provider : null,
    model: typeof after.model === "string" ? after.model : null,
    status: succeeded ? "succeeded" : "failed",
    inputTokens,
    outputTokens,
    totalTokens: reportedTotalTokens ?? (inputTokens === null || outputTokens === null ? null : inputTokens + outputTokens),
    latencyMs: numberOrNull(after.latencyMs),
    errorCode: succeeded ? null : errorCode(after.error)
  }];
}

function numberOrNull(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null; }
function errorCode(value: unknown): string | null { return value && typeof value === "object" && typeof (value as Record<string, unknown>).code === "string" ? String((value as Record<string, unknown>).code) : null; }
function normalizeBudget(value: unknown): AiBudgetPolicy {
  if (!value || typeof value !== "object") {
    return { monthlyTokenLimit: null, dailyTokenLimit: null };
  }
  const budget = value as Record<string, unknown>;
  return {
    monthlyTokenLimit: numberOrNull(budget.monthlyTokenLimit),
    dailyTokenLimit: numberOrNull(budget.dailyTokenLimit)
  };
}

function isAppErrorCode(error: unknown) {
  return error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : "internal_error";
}

function encrypt(value: string, secret: string) {
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

function decrypt(value: string, secret: string) {
  const [iv, tag, body] = value.split(".");
  if (!iv || !tag || !body) throw new Error("Invalid encrypted AI credential.");
  const key = createHash("sha256").update(secret).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
