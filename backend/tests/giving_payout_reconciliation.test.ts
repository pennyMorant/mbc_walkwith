import { describe, expect, it } from "vitest";

import { GivingService } from "../src/modules/giving/giving.service.js";
import { InMemoryGivingRepository } from "../src/modules/giving/in-memory-giving.repository.js";
import { createStripeGivingProvider } from "../src/modules/giving/stripe-giving.provider.js";
import { testConfig } from "./route_test_harness.js";

describe("giving payout reconciliation", () => {
  it("links a reconciled payout by charge id and reopens review when it fails", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-payout",
      donorName: "Payout Member",
      donorEmail: "payout@example.com",
      provider: "stripe",
      providerTransactionId: "pi_payout",
      amountCents: 5200,
      currency: "USD",
      category: "offering",
      status: "succeeded",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });
    await repository.updateTransactionFinanceByProviderTransactionId(
      "stripe",
      "pi_payout",
      {
        providerChargeId: "ch_payout",
        feeCents: 181,
        netAmountCents: 5019
      }
    );
    const stripeProvider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    })!;
    const service = new GivingService(repository, stripeProvider);

    await expect(
      service.handleStripeWebhook(
        eventPayload("evt_payout_reconciled", "payout.reconciliation_completed", {
          id: "po_payout",
          charge_ids: ["ch_payout"]
        }),
        undefined
      )
    ).resolves.toEqual({ handled: true });
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      payoutId: "po_payout",
      reconciliationStatus: "reconciled"
    });

    await expect(
      service.handleStripeWebhook(
        eventPayload("evt_payout_failed", "payout.failed", {
          id: "po_payout"
        }),
        undefined
      )
    ).resolves.toEqual({ handled: true });
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      payoutId: "po_payout",
      reconciliationStatus: "needs_review"
    });
  });
});

function eventPayload(
  id: string,
  type: string,
  object: Record<string, unknown>
) {
  return Buffer.from(JSON.stringify({ id, type, data: { object } }));
}
