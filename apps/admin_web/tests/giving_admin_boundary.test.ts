import { describe, expect, test } from "bun:test";

describe("admin giving boundary", () => {
  test("passes fund allocation into reconciliation requests", async () => {
    const source = await Bun.file(
      new URL("../src/core/api/giving.ts", import.meta.url)
    ).text();
    const start = source.indexOf("export async function getGivingReconciliation");
    const end = source.indexOf("export async function generateGivingStatement", start);
    const reconciliationHelper = source.slice(start, end);

    expect(reconciliationHelper).toContain(
      'appendParam(params, "fundId", filters.fundId);'
    );
  });

  test("defines giving workspace vocabulary for every locale", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();
    for (const key of requiredKeys) {
      const marker = `${JSON.stringify(key)}:`;
      expect(source.split(marker).length - 1).toBeGreaterThanOrEqual(4);
    }
  });

  test("keeps finance filters explicit and export aligned to applied data", async () => {
    const [controller, commands, queries, page, ...cards] = await Promise.all([
      Bun.file(
        new URL(
          "../src/features/giving/composables/use_giving_page_controller.ts",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/giving/composables/use_giving_commands.ts",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL(
          "../src/features/giving/composables/use_giving_queries.ts",
          import.meta.url
        )
      ).text(),
      Bun.file(
        new URL("../src/features/giving/pages/GivingPage.vue", import.meta.url)
      ).text(),
      ...[
        "GivingReconciliationCard.vue",
        "GivingTransactionsCard.vue",
        "GivingFundsCard.vue",
        "GivingStatementsCard.vue",
        "GivingProviderEventsCard.vue"
      ].map((file) =>
        Bun.file(
          new URL(`../src/features/giving/components/${file}`, import.meta.url)
        ).text()
      )
    ]);

    expect(queries).toContain("appliedTransactionFilters");
    expect(queries).toContain("sameGivingFilters");
    expect(controller).toContain("useGivingCommands");
    expect(commands).toContain("...options.appliedTransactionFilters.value");
    expect(page).toContain('@apply="applyTransactionFilters"');
    expect(page).toContain('@retry="refreshTransactions"');
    expect(page).toContain('@retry="refreshFundDirectory"');
    expect(page).toContain("AdminRetryAlert");
    expect(page).toContain(':refresh-error="transactionsRefreshError"');
    expect(page).toContain(':error="statementsError"');
    expect(page).not.toContain(
      ':error="statementsError || downloadStatementError"'
    );
    expect(page).toContain('v-if="downloadStatementError"');
    for (const card of cards) {
      expect(card).not.toContain("refetch:");
      expect(card).not.toContain("@update:model-value=\"refetch\"");
      expect(card).not.toContain("@keyup.enter=\"refetch\"");
      expect(card).not.toContain("@retry=\"$emit('apply')\"");
      expect(card).not.toContain("@/core/api/giving");
    }
  });
});

const requiredKeys = [
  "All funds",
  "Fund",
  "Fund code must use lowercase letters, numbers, hyphens, or underscores.",
  "No giving funds match the current filters.",
  "No giving transactions match the current filters.",
  "No payment provider events match the current filters.",
  "giving.applyFilters",
  "giving.clearFilters",
  "giving.fundDirectoryFailed",
  "giving.noStatements",
  "giving.refreshFailed"
] as const;
