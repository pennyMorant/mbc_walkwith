import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createStripeGivingProvider } from "../src/modules/giving/stripe-giving.provider.js";
import { testConfig } from "./route_test_harness.js";

describe("createStripeGivingProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses mock Stripe only in mock data mode", () => {
    expect(
      createStripeGivingProvider({
        ...testConfig,
        useMockData: true,
        stripeSecretKey: undefined,
        stripeWebhookSecret: undefined
      })
    ).toBeDefined();

    expect(
      createStripeGivingProvider({
        ...testConfig,
        useMockData: false,
        stripeSecretKey: undefined,
        stripeWebhookSecret: undefined
      })
    ).toBeUndefined();
  });

  it("accepts a valid Stripe webhook signature when multiple v1 signatures are present", () => {
    const secret = "whsec_test_signature_secret";
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_test_valid",
        type: "checkout.session.expired",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_test_expired",
            payment_intent: "pi_test_expired"
          }
        }
      })
    );
    const timestamp = Math.floor(Date.now() / 1000);
    const validSignature = signStripePayload(secret, timestamp, payload);
    const provider = createStripeGivingProvider({
      ...testConfig,
      useMockData: false,
      stripeSecretKey: "sk_test_configured",
      stripeWebhookSecret: secret
    });

    const event = provider!.parseWebhookEvent(
      payload,
      `t=${timestamp},v1=${"0".repeat(64)},v1=${validSignature}`
    );

    expect(event).toMatchObject({
      id: "evt_test_valid",
      type: "checkout.session.expired",
      checkoutSessionId: "cs_test_expired",
      paymentIntentId: "pi_test_expired"
    });
  });

  it("rejects stale Stripe webhook signatures", () => {
    const secret = "whsec_test_signature_secret";
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_test_stale",
        type: "checkout.session.expired",
        data: { object: { id: "cs_test_stale" } }
      })
    );
    const timestamp = Math.floor(Date.now() / 1000) - 600;
    const provider = createStripeGivingProvider({
      ...testConfig,
      useMockData: false,
      stripeSecretKey: "sk_test_configured",
      stripeWebhookSecret: secret
    });

    expect(() =>
      provider!.parseWebhookEvent(
        payload,
        `t=${timestamp},v1=${signStripePayload(secret, timestamp, payload)}`
      )
    ).toThrow("timestamp is outside tolerance");
  });

  it("rejects webhook payloads without a stable provider event id", () => {
    const provider = createStripeGivingProvider({
      ...testConfig,
      useMockData: true
    });
    if (!provider) {
      throw new Error("Expected mock Stripe provider.");
    }

    expect(() =>
      provider.parseWebhookEvent(
        Buffer.from(
          JSON.stringify({
            type: "checkout.session.completed",
            data: { object: { id: "cs_missing_event_id" } }
          })
        ),
        undefined
      )
    ).toThrowError(
      expect.objectContaining({
        code: "provider_event_unhandled",
        category: "validation_error",
        nextAction: "check_provider_payload"
      })
    );
  });

  it("resolves charge finance from a Stripe balance transaction id", async () => {
    const secret = "whsec_test_finance_secret";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_test_charge_finance",
        type: "charge.succeeded",
        created: timestamp,
        data: {
          object: {
            id: "ch_test_finance",
            payment_intent: "pi_test_finance",
            amount: 4800,
            amount_captured: 4800,
            currency: "usd",
            balance_transaction: "txn_test_finance"
          }
        }
      })
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      async json() {
        return {
          id: "txn_test_finance",
          amount: 4800,
          currency: "usd",
          fee: 169,
          net: 4631,
          available_on: 1770163200
        };
      }
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createStripeGivingProvider({
      ...testConfig,
      useMockData: false,
      stripeSecretKey: "sk_test_finance",
      stripeWebhookSecret: secret,
      stripeApiBaseUrl: "https://api.stripe.test"
    })!;

    const parsed = provider.parseWebhookEvent(
      payload,
      `t=${timestamp},v1=${signStripePayload(secret, timestamp, payload)}`
    );
    const resolved = await provider.resolveWebhookEvent(parsed);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.stripe.test/v1/balance_transactions/txn_test_finance",
      expect.objectContaining({
        headers: { authorization: "Bearer sk_test_finance" }
      })
    );
    expect(resolved).toMatchObject({
      type: "charge.succeeded",
      chargeId: "ch_test_finance",
      balanceTransactionId: "txn_test_finance",
      balanceGrossAmountCents: 4800,
      balanceCurrency: "USD",
      feeCents: 169,
      netAmountCents: 4631,
      availableOn: new Date(1770163200 * 1000)
    });
  });

  it("paginates payout balance transactions and keeps only charge sources", async () => {
    const secret = "whsec_test_payout_secret";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_test_payout_reconciliation",
        type: "payout.reconciliation_completed",
        created: timestamp,
        data: { object: { id: "po_test_finance" } }
      })
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        async json() {
          return {
            data: [
              { id: "txn_charge_1", type: "charge", source: "ch_test_1" },
              { id: "txn_refund_1", type: "refund", source: "re_test_1" }
            ],
            has_more: true
          };
        }
      })
      .mockResolvedValueOnce({
        ok: true,
        async json() {
          return {
            data: [
              { id: "txn_charge_2", type: "charge", source: "ch_test_2" }
            ],
            has_more: false
          };
        }
      });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createStripeGivingProvider({
      ...testConfig,
      useMockData: false,
      stripeSecretKey: "sk_test_payout",
      stripeWebhookSecret: secret,
      stripeApiBaseUrl: "https://api.stripe.test"
    })!;

    const parsed = provider.parseWebhookEvent(
      payload,
      `t=${timestamp},v1=${signStripePayload(secret, timestamp, payload)}`
    );
    const resolved = await provider.resolveWebhookEvent(parsed);

    expect(resolved).toMatchObject({
      type: "payout.reconciliation_completed",
      payoutId: "po_test_finance",
      chargeIds: ["ch_test_1", "ch_test_2"]
    });
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "starting_after=txn_refund_1"
    );
  });
});

function signStripePayload(secret: string, timestamp: number, payload: Buffer) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${payload.toString("utf8")}`)
    .digest("hex");
}
