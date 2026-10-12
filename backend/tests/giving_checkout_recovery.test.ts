import { describe, expect, it } from "vitest";

import { GivingService } from "../src/modules/giving/giving.service.js";
import { InMemoryGivingRepository } from "../src/modules/giving/in-memory-giving.repository.js";
import type { GivingTransactionStatusUpdateInput } from "../src/modules/giving/giving.repository.js";
import {
  createStripeGivingProvider,
  type StripeGivingProvider
} from "../src/modules/giving/stripe-giving.provider.js";
import { testConfig } from "./route_test_harness.js";

describe("giving checkout recovery", () => {
  it("marks the pending transaction failed when Stripe session creation fails", async () => {
    const repository = new InMemoryGivingRepository();
    const service = new GivingService(repository, failingStripeProvider);

    await expect(
      service.createCheckoutSession("member-checkout-failure", {
        amountCents: 2500,
        currency: "USD",
        category: "offering",
        donorName: "Checkout Failure",
        donorEmail: "checkout-failure@example.com"
      })
    ).rejects.toThrow("Stripe checkout unavailable");

    const transactions = await repository.listTransactionsForUser(
      "member-checkout-failure",
      { status: "failed", limit: 20 }
    );
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      status: "failed",
      providerCheckoutSessionId: null
    });
  });

  it("surfaces a repository error when failed checkout compensation is lost", async () => {
    const repository = new MissingCompensationRepository();
    const service = new GivingService(repository, failingStripeProvider);

    await expect(
      service.createCheckoutSession("member-missing-compensation", {
        amountCents: 2500,
        currency: "USD",
        category: "offering"
      })
    ).rejects.toMatchObject({
      code: "checkout_session_failed",
      category: "repository_write_failed",
      sourceLayer: "repository",
      nextAction: "inspect_pending_transaction"
    });
  });

  it("recovers an unlinked Stripe session from signed event metadata", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-checkout-recovery",
      donorName: "Checkout Recovery",
      donorEmail: "checkout-recovery@example.com",
      provider: "stripe",
      amountCents: 4200,
      currency: "USD",
      category: "missions",
      fundId: "fund-missions",
      status: "pending",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });
    const stripeProvider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    });
    if (!stripeProvider) {
      throw new Error("Expected mock Stripe provider.");
    }
    const service = new GivingService(repository, stripeProvider);
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_checkout_recovery",
        type: "checkout.session.completed",
        created: 1770000000,
        data: {
          object: {
            id: "cs_checkout_recovery",
            payment_intent: "pi_checkout_recovery",
            payment_status: "paid",
            amount_total: 4200,
            currency: "usd",
            customer_email: "checkout-recovery@example.com",
            customer_details: {
              name: "Checkout Recovery",
              email: "checkout-recovery@example.com"
            },
            metadata: {
              transactionId: transaction.id,
              category: "missions"
            }
          }
        }
      })
    );

    await expect(service.handleStripeWebhook(payload, undefined)).resolves.toEqual({
      handled: true
    });
    const recovered =
      await repository.getTransactionByProviderCheckoutSessionId(
        "stripe",
        "cs_checkout_recovery"
      );
    expect(recovered).toMatchObject({
      id: transaction.id,
      status: "succeeded",
      providerTransactionId: "pi_checkout_recovery",
      providerCheckoutSessionId: "cs_checkout_recovery"
    });

    await expect(service.handleStripeWebhook(payload, undefined)).resolves.toEqual({
      handled: true,
      duplicate: true
    });
  });

  it("reprocesses received events and rejects checkout amount mismatches", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-received-replay",
      donorName: "Received Replay",
      donorEmail: "received-replay@example.com",
      provider: "stripe",
      amountCents: 5200,
      currency: "USD",
      category: "offering",
      status: "pending",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });
    await repository.updateTransactionStatusById("stripe", transaction.id, {
      status: "pending",
      providerCheckoutSessionId: "cs_received_replay"
    });
    const stripeProvider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    });
    if (!stripeProvider) {
      throw new Error("Expected mock Stripe provider.");
    }
    const service = new GivingService(repository, stripeProvider);
    const raw = {
      id: "evt_received_replay",
      type: "checkout.session.completed",
      created: 1770000000,
      data: {
        object: {
          id: "cs_received_replay",
          payment_intent: "pi_received_replay",
          payment_status: "paid",
          amount_total: 5100,
          currency: "usd",
          metadata: { transactionId: transaction.id }
        }
      }
    };
    await repository.recordProviderEvent({
      provider: "stripe",
      providerEventId: raw.id,
      eventType: raw.type,
      payload: raw
    });

    await expect(
      service.handleStripeWebhook(Buffer.from(JSON.stringify(raw)), undefined)
    ).rejects.toMatchObject({
      code: "provider_event_transaction_mismatch",
      category: "state_conflict",
      nextAction: "inspect_provider_event"
    });
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      status: "pending",
      amountCents: 5200
    });
    const [event] = await repository.listProviderEvents({
      provider: "stripe",
      status: "failed",
      limit: 20
    });
    expect(event?.providerEventId).toBe(raw.id);
  });

  it("does not let late checkout events reverse a refund", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-refund-order",
      donorName: "Refund Order",
      donorEmail: "refund-order@example.com",
      provider: "stripe",
      amountCents: 6300,
      currency: "USD",
      category: "offering",
      status: "pending",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });
    await repository.updateTransactionStatusById("stripe", transaction.id, {
      status: "pending",
      providerCheckoutSessionId: "cs_refund_order"
    });
    const stripeProvider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    });
    if (!stripeProvider) {
      throw new Error("Expected mock Stripe provider.");
    }
    const service = new GivingService(repository, stripeProvider);
    const completed = (id: string) =>
      Buffer.from(
        JSON.stringify({
          id,
          type: "checkout.session.completed",
          created: 1770000000,
          data: {
            object: {
              id: "cs_refund_order",
              payment_intent: "pi_refund_order",
              payment_status: "paid",
              amount_total: 6300,
              currency: "usd",
              metadata: { transactionId: transaction.id }
            }
          }
        })
      );
    await service.handleStripeWebhook(completed("evt_refund_order_paid"), undefined);
    await service.handleStripeWebhook(
      Buffer.from(
        JSON.stringify({
          id: "evt_refund_order_refunded",
          type: "charge.refunded",
          data: {
            object: {
              id: "ch_refund_order",
              payment_intent: "pi_refund_order",
              amount: 6300,
              currency: "usd",
              amount_refunded: 2300,
              refunded: false
            }
          }
        })
      ),
      undefined
    );
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      status: "succeeded",
      refundedAmountCents: 2300,
      netAmountCents: 0,
      reconciliationStatus: "needs_review"
    });
    await service.handleStripeWebhook(
      Buffer.from(
        JSON.stringify({
          id: "evt_refund_order_fully_refunded",
          type: "charge.refunded",
          data: {
            object: {
              id: "ch_refund_order",
              payment_intent: "pi_refund_order",
              amount: 6300,
              currency: "usd",
              amount_refunded: 6300,
              refunded: true
            }
          }
        })
      ),
      undefined
    );
    await service.handleStripeWebhook(completed("evt_refund_order_late"), undefined);

    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      status: "refunded",
      refundedAmountCents: 6300,
      netAmountCents: 0,
      reconciliationStatus: "needs_review"
    });
  });

  it("lets a verified provider success recover a locally failed checkout", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-provider-recovery",
      donorName: "Provider Recovery",
      donorEmail: "provider-recovery@example.com",
      provider: "stripe",
      amountCents: 7100,
      currency: "USD",
      category: "offering",
      status: "failed",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });

    const recovered = await repository.updateTransactionStatusById(
      "stripe",
      transaction.id,
      {
        status: "succeeded",
        providerCheckoutSessionId: "cs_provider_recovery",
        providerTransactionId: "pi_provider_recovery"
      }
    );

    expect(recovered).toMatchObject({
      status: "succeeded",
      providerCheckoutSessionId: "cs_provider_recovery",
      providerTransactionId: "pi_provider_recovery"
    });
  });

  it("keeps an early full refund retryable until the paid state exists", async () => {
    const repository = new InMemoryGivingRepository();
    const transaction = await repository.createTransaction({
      userId: "member-early-refund",
      donorName: "Early Refund",
      donorEmail: "early-refund@example.com",
      provider: "stripe",
      providerTransactionId: "pi_early_refund",
      amountCents: 3400,
      currency: "USD",
      category: "offering",
      status: "pending",
      givenAt: new Date("2026-07-13T12:00:00.000Z")
    });
    const stripeProvider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    })!;
    const service = new GivingService(repository, stripeProvider);
    const refundPayload = Buffer.from(
      JSON.stringify({
        id: "evt_early_full_refund",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_early_refund",
            payment_intent: "pi_early_refund",
            amount: 3400,
            currency: "usd",
            amount_refunded: 3400,
            refunded: true
          }
        }
      })
    );

    await expect(
      service.handleStripeWebhook(refundPayload, undefined)
    ).rejects.toMatchObject({
      code: "provider_event_unhandled",
      category: "state_conflict"
    });
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      status: "pending",
      refundedAmountCents: 0
    });

    await repository.updateTransactionStatusById("stripe", transaction.id, {
      status: "succeeded"
    });
    await expect(
      service.handleStripeWebhook(refundPayload, undefined)
    ).resolves.toEqual({ handled: true });
    expect(await repository.getTransactionById(transaction.id)).toMatchObject({
      status: "refunded",
      refundedAmountCents: 3400
    });
  });
});

const failingStripeProvider: StripeGivingProvider = {
  async createCheckoutSession() {
    throw new Error("Stripe checkout unavailable");
  },
  parseWebhookEvent() {
    return {
      id: "evt_unused",
      type: "ignored",
      raw: {}
    };
  },
  async resolveWebhookEvent(event) {
    return event;
  }
};

class MissingCompensationRepository extends InMemoryGivingRepository {
  override async updateTransactionStatusById(
    _provider: string,
    _id: string,
    _input: GivingTransactionStatusUpdateInput
  ): Promise<null> {
    return null;
  }
}
