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
});

const requiredKeys = [
  "All funds",
  "Fund",
  "Fund code must use lowercase letters, numbers, hyphens, or underscores.",
  "No giving funds match the current filters.",
  "No giving transactions match the current filters.",
  "No payment provider events match the current filters."
] as const;
