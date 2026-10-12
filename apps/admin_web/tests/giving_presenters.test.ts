import { describe, expect, test } from "bun:test";

import {
  formatGivingCurrency,
  formatGivingDateTime,
  givingFundFilterItems,
  givingFundName,
  givingFundProgress
} from "../src/features/giving/giving_presenters";

const fund = {
  id: "fund-missions",
  code: "missions",
  name: "Missions",
  description: "Global missions.",
  status: "active" as const,
  targetAmountCents: 20000,
  displayOrder: 1,
  totalAmountCents: 5000,
  transactionCount: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z"
};

describe("giving presenters", () => {
  test("formats money and time using the active locale", () => {
    expect(formatGivingCurrency(123456, "USD", "en-US")).toBe("$1,234.56");
    expect(formatGivingCurrency(123456, "USD", "es")).toContain("1234,56");
    expect(formatGivingDateTime(fund.createdAt, "zh-Hans")).toContain("2026");
    expect(formatGivingDateTime(null, "en-US")).toBe("—");
  });

  test("builds canonical fund filters and labels", () => {
    expect(givingFundFilterItems([fund], "All funds")).toEqual([
      { title: "All funds", value: "" },
      { title: "Missions", value: "fund-missions" }
    ]);
    expect(givingFundName([fund], fund.id, "Not set")).toBe("Missions");
    expect(givingFundName([fund], null, "Not set")).toBe("Not set");
  });

  test("presents target progress without exceeding the bar", () => {
    expect(givingFundProgress(fund)).toBe(25);
    expect(
      givingFundProgress({ ...fund, totalAmountCents: 30000 })
    ).toBe(100);
    expect(
      givingFundProgress({ ...fund, targetAmountCents: null })
    ).toBeNull();
  });
});
