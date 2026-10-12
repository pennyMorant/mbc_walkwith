import { appError } from "../../shared/http/app-error.js";
import type { StripeGivingWebhookEvent } from "./stripe-giving.provider.js";

export function normalizeStripeGivingEvent(
  event: Record<string, unknown>
): StripeGivingWebhookEvent {
  const type = stringField(event, "type");
  const id = requireString(event, "id", type);
  const object = nestedObject(event, ["data", "object"]);
  if (
    type === "checkout.session.completed" ||
    type === "checkout.session.async_payment_succeeded" ||
    type === "checkout.session.async_payment_failed"
  ) {
    const metadata = objectField(object, "metadata");
    return {
      type,
      id,
      checkoutSessionId: requireString(object, "id", type),
      transactionId: stringField(metadata, "transactionId"),
      paymentIntentId: stringField(object, "payment_intent"),
      amountCents: numberField(object, "amount_total") ?? 0,
      currency: stringField(object, "currency")?.toUpperCase() ?? "USD",
      donorEmail:
        stringField(object, "customer_email") ??
        stringField(objectField(object, "customer_details"), "email"),
      donorName:
        stringField(objectField(object, "customer_details"), "name") ?? "",
      category: stringField(metadata, "category") ?? "offering",
      paymentStatus: stringField(object, "payment_status"),
      paidAt: new Date((numberField(event, "created") ?? Date.now() / 1000) * 1000),
      raw: event
    };
  }
  if (type === "checkout.session.expired") {
    const metadata = objectField(object, "metadata");
    return {
      type,
      id,
      checkoutSessionId: requireString(object, "id", type),
      transactionId: stringField(metadata, "transactionId"),
      paymentIntentId: stringField(object, "payment_intent"),
      raw: event
    };
  }
  if (type === "payment_intent.payment_failed") {
    return {
      type,
      id,
      checkoutSessionId: null,
      transactionId: null,
      paymentIntentId: stringField(object, "id"),
      raw: event
    };
  }
  if (type === "charge.refunded") {
    const amountCents = requireNumber(object, "amount", type);
    const refundedAmountCents = requireNumber(object, "amount_refunded", type);
    return {
      type,
      id,
      chargeId: requireString(object, "id", type),
      paymentIntentId: stringField(object, "payment_intent"),
      amountCents,
      currency: requireString(object, "currency", type).toUpperCase(),
      refundedAmountCents,
      fullyRefunded:
        booleanField(object, "refunded") ?? refundedAmountCents >= amountCents,
      raw: event
    };
  }
  if (type === "charge.succeeded" || type === "charge.updated") {
    const balanceTransaction = objectField(object, "balance_transaction");
    return {
      type,
      id,
      chargeId: requireString(object, "id", type),
      paymentIntentId: stringField(object, "payment_intent"),
      amountCents:
        numberField(object, "amount_captured") ??
        requireNumber(object, "amount", type),
      currency: requireString(object, "currency", type).toUpperCase(),
      balanceTransactionId:
        stringField(object, "balance_transaction") ??
        stringField(balanceTransaction, "id"),
      balanceGrossAmountCents: numberField(balanceTransaction, "amount"),
      balanceCurrency:
        stringField(balanceTransaction, "currency")?.toUpperCase() ?? null,
      feeCents: numberField(balanceTransaction, "fee"),
      netAmountCents: numberField(balanceTransaction, "net"),
      availableOn: timestampDate(numberField(balanceTransaction, "available_on")),
      raw: event
    };
  }
  if (
    type === "charge.dispute.created" ||
    type === "charge.dispute.updated" ||
    type === "charge.dispute.closed"
  ) {
    return {
      type,
      id,
      paymentIntentId: stringField(object, "payment_intent"),
      disputeId: stringField(object, "id"),
      disputeStatus: normalizeDisputeStatus(stringField(object, "status")),
      disputedAmountCents: numberField(object, "amount") ?? 0,
      raw: event
    };
  }
  if (type === "payout.reconciliation_completed") {
    return {
      type,
      id,
      payoutId: requireString(object, "id", type),
      chargeIds: [],
      raw: event
    };
  }
  if (type === "payout.failed") {
    return {
      type,
      id,
      payoutId: requireString(object, "id", type),
      raw: event
    };
  }
  return { type: "ignored", id, raw: event };
}

function requireString(
  input: Record<string, unknown>,
  field: string,
  eventType: string | null
) {
  const value = stringField(input, field);
  if (value) {
    return value;
  }
  throw missingFieldError(field, eventType);
}

function requireNumber(
  input: Record<string, unknown>,
  field: string,
  eventType: string | null
) {
  const value = numberField(input, field);
  if (value !== null) {
    return value;
  }
  throw missingFieldError(field, eventType);
}

function missingFieldError(field: string, eventType: string | null) {
  return appError({
    code: "provider_event_unhandled",
    category: "validation_error",
    sourceLayer: "external",
    statusCode: 400,
    message: `Stripe event is missing ${field}.`,
    recoverable: false,
    retryable: false,
    evidence: { provider: "stripe", eventType, field },
    nextAction: "check_provider_payload"
  });
}

function nestedObject(input: Record<string, unknown>, path: string[]) {
  return path.reduce<Record<string, unknown>>(
    (current, key) => objectField(current, key),
    input
  );
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

function numberField(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "number" ? value : null;
}

function booleanField(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "boolean" ? value : null;
}

function timestampDate(value: number | null) {
  return value === null ? null : new Date(value * 1000);
}

function normalizeDisputeStatus(
  status: string | null
): "warning" | "open" | "won" | "lost" | "closed" {
  if (status === "warning_needs_response" || status === "warning_under_review") {
    return "warning";
  }
  if (status === "won") {
    return "won";
  }
  if (status === "lost") {
    return "lost";
  }
  return status === "warning_closed" ? "closed" : "open";
}
