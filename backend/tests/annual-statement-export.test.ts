import { describe, expect, it } from "vitest";

import {
  buildAnnualStatementPdfBase64,
  buildStatementCsv
} from "../src/modules/giving/annual-statement-export.js";

describe("annual statement export", () => {
  it("builds donor statement CSV and PDF content", () => {
    const statement = {
      id: "statement-2025",
      userId: "member-1",
      donorName: "MBC Member",
      donorEmail: "member@example.com",
      taxYear: 2025,
      totalAmountCents: 12345,
      currency: "USD",
      status: "ready",
      pdfObjectKey: null,
      downloadUrl: null,
      generatedAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z"
    } as const;
    const transactions = [
      {
        id: "gift-1",
        userId: "member-1",
        donorName: "MBC Member",
        donorEmail: "member@example.com",
        provider: "stripe",
        providerTransactionId: "pi_123",
        providerCheckoutSessionId: "cs_123",
        amountCents: 12345,
        feeCents: 345,
        netAmountCents: 12000,
        refundedAmountCents: 0,
        currency: "USD",
        category: "offering",
        status: "succeeded",
        reconciliationStatus: "reconciled",
        payoutId: "po_123",
        availableOn: "2026-01-06T00:00:00.000Z",
        disputeId: null,
        disputeStatus: "none",
        disputedAmountCents: 0,
        givenAt: "2025-12-24T20:00:00.000Z",
        createdAt: "2025-12-24T20:00:00.000Z"
      }
    ] as const;

    const csv = buildStatementCsv(statement, [...transactions]);
    expect(csv).toContain("statementId,statement-2025");
    expect(csv).toContain("totalAmountCents,12345");
    expect(csv).toContain("gift-1,2025-12-24T20:00:00.000Z,offering,12345");

    const pdf = Buffer.from(
      buildAnnualStatementPdfBase64(statement, [...transactions]),
      "base64"
    ).toString("utf8");
    expect(pdf).toContain("%PDF-1.4");
    expect(pdf).toContain("Annual Giving Statement");
    expect(pdf).toContain("Total gifts: 123.45");
  });
});
