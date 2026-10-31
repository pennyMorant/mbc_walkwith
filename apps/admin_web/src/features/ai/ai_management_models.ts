import type {
  AiBudgetPolicy,
  AiManagedProviderType,
  AiModelPolicy,
  AiProviderConfigUpdate
} from "@mbc/api-contracts";

export type AiProviderForm = {
  id: string;
  label: string;
  type: AiManagedProviderType;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
};

export type AiProviderSaveIntent = Readonly<{
  editorSession: number;
  provider: AiProviderConfigUpdate;
}>;

export type AiPolicySaveIntent = Readonly<{
  policy: AiModelPolicy;
}>;

export type AiBudgetSaveIntent = Readonly<{
  budget: AiBudgetPolicy;
}>;

export function providerSaveIntent(
  form: AiProviderForm,
  editorSession: number
): AiProviderSaveIntent {
  const apiKey = form.apiKey.trim();
  return {
    editorSession,
    provider: {
      id: form.id.trim(),
      label: form.label.trim(),
      type: form.type,
      enabled: form.enabled,
      baseUrl: form.baseUrl.trim() || null,
      ...(apiKey ? { apiKey } : {}),
      defaultModel: form.defaultModel.trim()
    }
  };
}

export function providerFormMatchesIntent(
  form: AiProviderForm,
  intent: AiProviderSaveIntent
) {
  const current = providerSaveIntent(form, intent.editorSession).provider;
  return JSON.stringify(current) === JSON.stringify(intent.provider);
}

export function policySaveIntent(policy: AiModelPolicy): AiPolicySaveIntent {
  return { policy: { ...policy } };
}

export function policyMatchesIntent(
  policy: AiModelPolicy,
  intent: AiPolicySaveIntent
) {
  return JSON.stringify(policy) === JSON.stringify(intent.policy);
}

export function budgetSaveIntent(
  budget: AiBudgetPolicy
): AiBudgetSaveIntent {
  return {
    budget: {
      dailyTokenLimit: budget.dailyTokenLimit,
      monthlyTokenLimit: budget.monthlyTokenLimit
    }
  };
}

export function budgetMatchesIntent(
  budget: AiBudgetPolicy,
  intent: AiBudgetSaveIntent
) {
  return (
    budget.dailyTokenLimit === intent.budget.dailyTokenLimit &&
    budget.monthlyTokenLimit === intent.budget.monthlyTokenLimit
  );
}
