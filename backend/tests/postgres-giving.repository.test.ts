import { describe, expect, it } from "vitest";

import { PostgresGivingRepository } from "../src/modules/giving/postgres-giving.repository.js";
import type { AppDb } from "../src/shared/db/client.js";

describe("PostgresGivingRepository", () => {
  it("does not summarize succeeded gifts when a non-succeeded status is requested", async () => {
    const throwingDb = {
      select() {
        throw new Error("summary should not query succeeded gifts");
      }
    } as unknown as AppDb;
    const repository = new PostgresGivingRepository(throwingDb);

    const adminSummary = await repository.summarize({
      status: "refunded",
      year: 2026,
      limit: 50
    });
    const memberSummary = await repository.summarizeForUser("member-lee", {
      status: "refunded",
      year: 2026,
      limit: 50
    });

    expect(adminSummary).toMatchObject({
      year: 2026,
      totalAmountCents: 0,
      transactionCount: 0
    });
    expect(memberSummary).toMatchObject({
      year: 2026,
      totalAmountCents: 0,
      transactionCount: 0
    });
  });
});
