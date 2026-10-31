import type { AiModelPolicy } from "@mbc/api-contracts";
import { describe, expect, test } from "bun:test";

import {
  budgetMatchesIntent,
  budgetSaveIntent,
  policyMatchesIntent,
  policySaveIntent,
  providerFormMatchesIntent,
  providerSaveIntent,
  type AiProviderForm
} from "../src/features/ai/ai_management_models";

describe("AI management command intents", () => {
  test("omits a blank API key so an existing credential is preserved", () => {
    const form = providerForm();
    const intent = providerSaveIntent(form, 4);

    expect(intent).toEqual({
      editorSession: 4,
      provider: {
        id: "provider-main",
        label: "Primary provider",
        type: "openai",
        enabled: true,
        baseUrl: null,
        defaultModel: "gpt-4o-mini"
      }
    });
    expect("apiKey" in intent.provider).toBe(false);
  });

  test("freezes provider values and rejects a result after further edits", () => {
    const form = providerForm();
    form.apiKey = "  secret-key  ";
    const intent = providerSaveIntent(form, 2);

    expect(intent.provider.apiKey).toBe("secret-key");
    expect(providerFormMatchesIntent(form, intent)).toBe(true);

    form.defaultModel = "new-model";
    expect(intent.provider.defaultModel).toBe("gpt-4o-mini");
    expect(providerFormMatchesIntent(form, intent)).toBe(false);
  });

  test("freezes policy and budget commands independently from their forms", () => {
    const policy: AiModelPolicy = {
      capability: "admin_drafts",
      providerId: "provider-main",
      model: "gpt-4o-mini",
      fallbackProviderId: null,
      fallbackModel: null,
      maxOutputTokens: 1200,
      timeoutMs: 30_000
    };
    const budget = {
      dailyTokenLimit: 10_000,
      monthlyTokenLimit: 100_000
    };
    const policyIntent = policySaveIntent(policy);
    const budgetIntent = budgetSaveIntent(budget);

    policy.model = "edited-model";
    budget.dailyTokenLimit = 20_000;

    expect(policyIntent.policy.model).toBe("gpt-4o-mini");
    expect(policyMatchesIntent(policy, policyIntent)).toBe(false);
    expect(budgetIntent.budget.dailyTokenLimit).toBe(10_000);
    expect(budgetMatchesIntent(budget, budgetIntent)).toBe(false);
  });
});

function providerForm(): AiProviderForm {
  return {
    id: " provider-main ",
    label: " Primary provider ",
    type: "openai",
    enabled: true,
    baseUrl: " ",
    apiKey: " ",
    defaultModel: " gpt-4o-mini "
  };
}
