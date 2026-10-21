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
const messages = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("AI management workspace", () => {
  test("uses shared metrics and stable tab identifiers", () => {
    expect(page).toContain("<AdminMetricGrid :items=\"overviewMetrics\"");
    expect(page).toContain('value="providers"');
    expect(page).toContain('value="policies"');
    expect(page).toContain('value="usage"');
    expect(page).toContain('value="budget"');
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

  test("provides the empty usage message in every supported locale", () => {
    expect(messages.match(/ai\.noUsage/g)).toHaveLength(4);
  });
});
