import type { AppConfig } from "../../config/env.js";
import { appError } from "../../shared/http/app-error.js";
import { StripeGivingFinanceClient } from "./stripe_giving_finance_client.js";
import { normalizeStripeGivingEvent } from "./stripe_giving_webhook_parser.js";
import { verifyStripeWebhookSignature } from "./stripe_giving_webhook_signature.js";

export type StripeCheckoutSessionInput = {
  amountCents: number;
  currency: string;
  category: string;
  donorEmail: string | null;
  transactionId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string | null;
};

export type StripeCheckoutSession = {
  id: string;
  url: string;
};

export type StripeGivingWebhookEvent =
  | {
      id: string;
      type: "checkout.session.completed";
      checkoutSessionId: string;
      transactionId: string | null;
      paymentIntentId: string | null;
      amountCents: number;
      currency: string;
      donorEmail: string | null;
      donorName: string;
      category: string;
      paymentStatus: string | null;
      paidAt: Date;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type:
        | "checkout.session.async_payment_succeeded"
        | "checkout.session.async_payment_failed";
      checkoutSessionId: string;
      transactionId: string | null;
      paymentIntentId: string | null;
      amountCents: number;
      currency: string;
      donorEmail: string | null;
      donorName: string;
      category: string;
      paymentStatus: string | null;
      paidAt: Date;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "checkout.session.expired" | "payment_intent.payment_failed";
      checkoutSessionId: string | null;
      transactionId: string | null;
      paymentIntentId: string | null;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "charge.refunded";
      chargeId: string;
      paymentIntentId: string | null;
      amountCents: number;
      currency: string;
      refundedAmountCents: number;
      fullyRefunded: boolean;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "charge.succeeded" | "charge.updated";
      chargeId: string;
      paymentIntentId: string | null;
      amountCents: number;
      currency: string;
      balanceTransactionId: string | null;
      balanceGrossAmountCents: number | null;
      balanceCurrency: string | null;
      feeCents: number | null;
      netAmountCents: number | null;
      availableOn: Date | null;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type:
        | "charge.dispute.created"
        | "charge.dispute.updated"
        | "charge.dispute.closed";
      paymentIntentId: string | null;
      disputeId: string | null;
      disputeStatus: "warning" | "open" | "won" | "lost" | "closed";
      disputedAmountCents: number;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "payout.reconciliation_completed";
      payoutId: string;
      chargeIds: string[];
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "payout.failed";
      payoutId: string;
      raw: Record<string, unknown>;
    }
  | {
      id: string;
      type: "ignored";
      raw: Record<string, unknown>;
    };

export interface StripeGivingProvider {
  createCheckoutSession(
    input: StripeCheckoutSessionInput
  ): Promise<StripeCheckoutSession>;
  parseWebhookEvent(payload: Buffer, signature: string | undefined): StripeGivingWebhookEvent;
  resolveWebhookEvent(event: StripeGivingWebhookEvent): Promise<StripeGivingWebhookEvent>;
}

export function createStripeGivingProvider(
  config: AppConfig
): StripeGivingProvider | undefined {
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    return config.useMockData ? new MockStripeGivingProvider() : undefined;
  }
  return new RestStripeGivingProvider(config);
}

class MockStripeGivingProvider implements StripeGivingProvider {
  async createCheckoutSession(
    input: StripeCheckoutSessionInput
  ): Promise<StripeCheckoutSession> {
    return {
      id: `cs_test_${input.transactionId}`,
      url: `https://checkout.stripe.test/session/${input.transactionId}`
    };
  }

  parseWebhookEvent(payload: Buffer): StripeGivingWebhookEvent {
    return normalizeStripeGivingEvent(JSON.parse(payload.toString("utf8")));
  }

  async resolveWebhookEvent(
    event: StripeGivingWebhookEvent
  ): Promise<StripeGivingWebhookEvent> {
    if (event.type === "payout.reconciliation_completed") {
      return {
        ...event,
        chargeIds: stringArrayField(
          objectField(objectField(event.raw, "data"), "object"),
          "charge_ids"
        )
      };
    }
    return event;
  }
}

class RestStripeGivingProvider implements StripeGivingProvider {
  private readonly financeClient: StripeGivingFinanceClient;

  constructor(private readonly config: AppConfig) {
    this.financeClient = new StripeGivingFinanceClient(config);
  }

  async createCheckoutSession(
    input: StripeCheckoutSessionInput
  ): Promise<StripeCheckoutSession> {
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", input.successUrl);
    body.set("cancel_url", input.cancelUrl);
    body.set("payment_method_types[0]", "card");
    body.set("payment_method_types[1]", "us_bank_account");
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
    body.set("line_items[0][price_data][product_data][name]", "Church giving");
    body.set("line_items[0][price_data][product_data][metadata][category]", input.category);
    body.set("metadata[transactionId]", input.transactionId);
    body.set("metadata[category]", input.category);
    if (input.userId) {
      body.set("metadata[userId]", input.userId);
    }
    if (input.donorEmail) {
      body.set("customer_email", input.donorEmail);
    }

    const response = await fetch(`${this.config.stripeApiBaseUrl}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.stripeSecretKey}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw appError({
        code: "checkout_session_failed",
        category: "external_dependency_failed",
        sourceLayer: "capability",
        statusCode: 502,
        message: stripeErrorMessage(data),
        recoverable: true,
        retryable: true,
        nextAction: "retry",
        evidence: { provider: "stripe" }
      });
    }
    const id = stringField(data, "id");
    const url = stringField(data, "url");
    if (!id || !url) {
      throw appError({
        code: "checkout_session_failed",
        category: "external_dependency_failed",
        sourceLayer: "capability",
        statusCode: 502,
        message: "Stripe checkout session response is incomplete.",
        recoverable: true,
        retryable: true,
        nextAction: "retry",
        evidence: { provider: "stripe" }
      });
    }
    return { id, url };
  }

  parseWebhookEvent(
    payload: Buffer,
    signature: string | undefined
  ): StripeGivingWebhookEvent {
    verifyStripeWebhookSignature(
      payload,
      signature,
      this.config.stripeWebhookSecret
    );
    return normalizeStripeGivingEvent(JSON.parse(payload.toString("utf8")));
  }

  async resolveWebhookEvent(
    event: StripeGivingWebhookEvent
  ): Promise<StripeGivingWebhookEvent> {
    if (
      (event.type === "charge.succeeded" || event.type === "charge.updated") &&
      event.balanceTransactionId &&
      (event.balanceGrossAmountCents === null ||
        event.balanceCurrency === null ||
        event.feeCents === null ||
        event.netAmountCents === null)
    ) {
      const balanceTransaction =
        await this.financeClient.retrieveBalanceTransaction(
          event.balanceTransactionId
        );
      return {
        ...event,
        balanceGrossAmountCents: balanceTransaction.grossAmountCents,
        balanceCurrency: balanceTransaction.currency,
        feeCents: balanceTransaction.feeCents,
        netAmountCents: balanceTransaction.netAmountCents,
        availableOn: balanceTransaction.availableOn
      };
    }
    if (event.type === "payout.reconciliation_completed") {
      return {
        ...event,
        chargeIds: await this.financeClient.listPayoutChargeIds(event.payoutId)
      };
    }
    return event;
  }
}

function stripeErrorMessage(data: Record<string, unknown>) {
  return stringField(objectField(data, "error"), "message") ?? "Stripe request failed.";
}

function objectField(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "string" ? value : null;
}

function stringArrayField(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
