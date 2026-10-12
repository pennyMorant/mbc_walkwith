import { describe, expect, it } from "vitest";

import { AnnualStatementService } from "../src/modules/giving/annual_statement.service.js";
import { InMemoryGivingRepository } from "../src/modules/giving/in-memory-giving.repository.js";

describe("annual statement service", () => {
  it("uses every exact confirmed gift without the admin list limit", async () => {
    const repository = new InMemoryGivingRepository();
    const service = new AnnualStatementService(repository);
    const userId = "member-many-gifts";
    for (let index = 0; index < 205; index += 1) {
      await repository.createTransaction({
        userId,
        donorName: "Many Gifts",
        donorEmail: "many-gifts@example.com",
        provider: "stripe",
        providerTransactionId: `pi_many_gifts_${index}`,
        amountCents: 100,
        currency: "USD",
        category: "offering",
        status: "succeeded",
        givenAt: new Date(`2040-06-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`)
      });
    }
    await repository.createTransaction({
      userId: "member-similar-email",
      donorName: "Many Gifts Other",
      donorEmail: "many-gifts+other@example.com",
      provider: "stripe",
      providerTransactionId: "pi_similar_email",
      amountCents: 9999,
      currency: "USD",
      category: "offering",
      status: "succeeded",
      givenAt: new Date("2040-06-01T12:00:00.000Z")
    });

    const statement = await service.generate(2040, {
      userId,
      donorName: "Many Gifts",
      donorEmail: "many-gifts@example.com"
    });
    expect(statement.totalAmountCents).toBe(20500);
    expect(statement.pdfObjectKey).toBeNull();
    const exported = await service.exportById(statement.id);
    expect(exported?.csv).toContain("pi_many_gifts_204");
    expect(exported?.csv).not.toContain("pi_similar_email");
    const pdf = Buffer.from(exported?.pdfBase64 ?? "", "base64").toString(
      "utf8"
    );
    expect(pdf).toContain("/Count 6");
    expect(pdf).toContain("pi_many_gifts_204");
  });

  it("requires regeneration when confirmed gifts change", async () => {
    const repository = new InMemoryGivingRepository();
    const service = new AnnualStatementService(repository);
    const transaction = await repository.createTransaction({
      userId: "member-stale-statement",
      donorName: "Stale Statement",
      donorEmail: "stale-statement@example.com",
      provider: "stripe",
      providerTransactionId: "pi_stale_statement",
      amountCents: 4200,
      currency: "USD",
      category: "offering",
      status: "succeeded",
      givenAt: new Date("2041-06-01T12:00:00.000Z")
    });
    const statement = await service.generate(2041, {
      userId: transaction.userId,
      donorName: transaction.donorName,
      donorEmail: transaction.donorEmail
    });
    await repository.updateTransactionStatusByProviderTransactionId(
      "stripe",
      "pi_stale_statement",
      { status: "refunded", refundedAmountCents: 4200 }
    );

    await expect(service.exportById(statement.id)).rejects.toMatchObject({
      code: "statement_stale",
      nextAction: "regenerate_statement"
    });
  });

  it("does not combine different currencies", async () => {
    const repository = new InMemoryGivingRepository();
    const service = new AnnualStatementService(repository);
    for (const [currency, providerTransactionId] of [
      ["USD", "pi_currency_usd"],
      ["EUR", "pi_currency_eur"]
    ] as const) {
      await repository.createTransaction({
        userId: "member-multi-currency",
        donorName: "Multi Currency",
        donorEmail: "multi-currency@example.com",
        provider: "stripe",
        providerTransactionId,
        amountCents: 1000,
        currency,
        category: "offering",
        status: "succeeded",
        givenAt: new Date("2042-06-01T12:00:00.000Z")
      });
    }

    await expect(
      service.generate(2042, { userId: "member-multi-currency" })
    ).rejects.toMatchObject({
      code: "statement_currency_mismatch",
      nextAction: "review_giving_records"
    });
  });
});
