import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const page = readFileSync(
  new URL("../src/features/ai/pages/AiManagementPage.vue", import.meta.url),
  "utf8"
);
const usagePanel = readFileSync(
  new URL("../src/features/ai/components/AiUsagePanel.vue", import.meta.url),
  "utf8"
);
const providerWorkspace = readFileSync(
  new URL("../src/features/ai/components/AiProviderWorkspace.vue", import.meta.url),
  "utf8"
);
const policyPanel = readFileSync(
  new URL("../src/features/ai/components/AiPolicyPanel.vue", import.meta.url),
  "utf8"
);
const budgetPanel = readFileSync(
  new URL("../src/features/ai/components/AiBudgetPanel.vue", import.meta.url),
  "utf8"
);
const messages = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("AI management workspace", () => {
  test("uses shared metrics and stable tab identifiers", () => {
    expect(page).toContain("AdminDataState");
    expect(page).toContain('@retry="managementQuery.refetch()"');
    expect(page).toContain(":error-message=\"queryErrorMessage\"");
    expect(page).toContain("<AdminMetricGrid :items=\"overviewMetrics\"");
    expect(page).toContain('value="providers"');
    expect(page).toContain('value="policies"');
    expect(page).toContain('value="usage"');
    expect(page).toContain('value="budget"');
  });

  test("keeps management query errors separate from command errors", () => {
    expect(page).toContain("managementQuery.error.value");
    expect(page).toContain('v-if="errorMessage"');
    expect(page).toContain("providerMutation.error.value");
  });

  test("keeps usage presentation responsive and outside transport ownership", () => {
    expect(page).toContain("<AiUsagePanel");
    expect(usagePanel).toContain("d-none d-md-block");
    expect(usagePanel).toContain("d-md-none");
    expect(usagePanel).not.toContain("@/core/api");
    expect(usagePanel).not.toContain("auth_store");
  });

  test("keeps provider commands page-owned and tests only persisted providers", () => {
    expect(page).toContain("<AiProviderWorkspace");
    expect(page).toContain("providerTestMutation.reset()");
    expect(page).toContain("selectedProviderId.value = provider.id");
    expect(page).toContain("providerTestTargetId.value === selectedProviderId.value");
    expect(page).toContain('@test="testSelectedProvider"');
    expect(providerWorkspace).toContain('!canManage || !selectedProviderId');
    expect(providerWorkspace).not.toContain("@/core/api");
    expect(providerWorkspace).not.toContain("auth_store");
  });

  test("uses responsive policy and token limit panels without transport ownership", () => {
    expect(page).toContain("<AiPolicyPanel");
    expect(page).toContain("<AiBudgetPanel");
    expect(page).not.toContain("<v-table");
    expect(policyPanel).toContain("ai.capability.${capability}");
    expect(policyPanel).not.toContain("@/core/api");
    expect(budgetPanel).not.toContain("@/core/api");
  });

  test("localizes AI capability and policy guidance in every locale", () => {
    expect(messages.match(/ai\.capability\.content_translation/g)).toHaveLength(4);
    expect(messages.match(/ai\.capability\.admin_drafts/g)).toHaveLength(4);
    expect(messages.match(/ai\.capability\.member_study/g)).toHaveLength(4);
    expect(messages.match(/ai\.policyHelp/g)).toHaveLength(4);
    expect(messages.match(/ai\.tokenLimitsHelp/g)).toHaveLength(4);
  });

  test("provides the empty usage message in every supported locale", () => {
    expect(messages.match(/ai\.noUsage/g)).toHaveLength(4);
  });
});
