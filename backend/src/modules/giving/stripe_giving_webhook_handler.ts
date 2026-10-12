import type { GivingTransaction } from "@mbc/api-contracts";

import { appError } from "../../shared/http/app-error.js";
import type { GivingRepository } from "./giving.repository.js";
import type { StripeGivingProvider } from "./stripe-giving.provider.js";

type StripeWebhookEvent = ReturnType<StripeGivingProvider["parseWebhookEvent"]>;

export async function applyStripeWebhookEvent(
  repository: GivingRepository,
  event: StripeWebhookEvent
) {
  if (event.type === "ignored") {
    return { handled: false };
  }
  if (event.type === "checkout.session.expired" && event.checkoutSessionId) {
    requireStripeWebhookTransaction(
      await updateStripeCheckoutTransaction(
        repository,
        {
          checkoutSessionId: event.checkoutSessionId,
          transactionId: event.transactionId
        },
        {
          status: "failed",
          providerTransactionId: event.paymentIntentId,
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { checkoutSessionId: event.checkoutSessionId }
    );
    return { handled: true };
  }
  if (event.type === "checkout.session.completed") {
    if (event.paymentStatus !== "paid") {
      requireStripeWebhookTransaction(
        await updateStripeCheckoutTransaction(
          repository,
          event,
          {
            status: "pending",
            providerTransactionId: event.paymentIntentId,
            donorEmail: event.donorEmail,
            donorName: event.donorName,
            metadata: stripeEventMetadata(event.raw)
          }
        ),
        event,
        { checkoutSessionId: event.checkoutSessionId }
      );
      return { handled: true, pending: true };
    }
    await markStripeCheckoutSucceeded(repository, event);
    return { handled: true };
  }
  if (event.type === "checkout.session.async_payment_succeeded") {
    await markStripeCheckoutSucceeded(repository, event);
    return { handled: true };
  }
  if (event.type === "checkout.session.async_payment_failed") {
    requireStripeWebhookTransaction(
      await updateStripeCheckoutTransaction(
        repository,
        event,
        {
          status: "failed",
          providerTransactionId: event.paymentIntentId,
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { checkoutSessionId: event.checkoutSessionId }
    );
    return { handled: true };
  }
  if (event.type === "payment_intent.payment_failed" && event.paymentIntentId) {
    requireStripeWebhookTransaction(
      await repository.updateTransactionStatusByProviderTransactionId(
        "stripe",
        event.paymentIntentId,
        {
          status: "failed",
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    return { handled: true };
  }
  if (event.type === "charge.refunded" && event.paymentIntentId) {
    const transaction = requireStripeWebhookTransaction(
      await repository.getTransactionByProviderTransactionId(
        "stripe",
        event.paymentIntentId
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    validateStripeChargeTransaction(transaction, event);
    const updated = requireStripeWebhookTransaction(
      await repository.updateTransactionStatusByProviderTransactionId(
        "stripe",
        event.paymentIntentId,
        {
          status: event.fullyRefunded ? "refunded" : "succeeded",
          refundedAmountCents: event.refundedAmountCents,
          reconciliationStatus: "needs_review",
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    requireStripeRefundStatus(updated, event);
    return { handled: true };
  }
  if (
    (event.type === "charge.succeeded" || event.type === "charge.updated") &&
    event.paymentIntentId
  ) {
    const transaction = requireStripeWebhookTransaction(
      await repository.getTransactionByProviderTransactionId(
        "stripe",
        event.paymentIntentId
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    validateStripeChargeTransaction(transaction, event);
    const finance = requireStripeChargeFinance(event, transaction);
    requireStripeWebhookTransaction(
      await repository.updateTransactionFinanceByProviderTransactionId(
        "stripe",
        event.paymentIntentId,
        {
          providerChargeId: event.chargeId,
          feeCents: finance.feeCents,
          netAmountCents: finance.netAmountCents,
          availableOn: event.availableOn,
          reconciliationStatus: "unreconciled",
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    return { handled: true };
  }
  if (
    (event.type === "charge.dispute.created" ||
      event.type === "charge.dispute.updated" ||
      event.type === "charge.dispute.closed") &&
    event.paymentIntentId
  ) {
    const disputeClosed =
      event.disputeStatus === "won" || event.disputeStatus === "closed";
    requireStripeWebhookTransaction(
      await repository.updateTransactionFinanceByProviderTransactionId(
        "stripe",
        event.paymentIntentId,
        {
          disputeId: event.disputeId,
          disputeStatus: event.disputeStatus,
          disputedAmountCents: disputeClosed ? 0 : event.disputedAmountCents,
          reconciliationStatus: disputeClosed ? "unreconciled" : "needs_review",
          metadata: stripeEventMetadata(event.raw)
        }
      ),
      event,
      { paymentIntentId: event.paymentIntentId }
    );
    return { handled: true };
  }
  if (event.type === "payout.reconciliation_completed") {
    if (event.chargeIds.length === 0) {
      return { handled: false };
    }
    const transactions =
      await repository.updateTransactionsFinanceByProviderChargeIds(
        "stripe",
        event.chargeIds,
        {
          payoutId: event.payoutId,
          reconciliationStatus: "reconciled",
          metadata: stripeEventMetadata(event.raw)
        }
      );
    requireStripeWebhookTransactions(transactions, event, {
      payoutId: event.payoutId,
      providerChargeCount: event.chargeIds.length
    });
    return { handled: true };
  }
  if (event.type === "payout.failed") {
    const transactions = await repository.updateTransactionsFinanceByPayoutId(
      "stripe",
      event.payoutId,
      {
        reconciliationStatus: "needs_review",
        metadata: stripeEventMetadata(event.raw)
      }
    );
    requireStripeWebhookTransactions(transactions, event, {
      payoutId: event.payoutId
    });
    return { handled: true };
  }
  return { handled: false };
}

async function markStripeCheckoutSucceeded(
  repository: GivingRepository,
  event: {
    id: string;
    type: string;
    checkoutSessionId: string;
    transactionId: string | null;
    paymentIntentId: string | null;
    amountCents: number;
    paidAt: Date;
    donorEmail: string | null;
    donorName: string;
    raw: Record<string, unknown>;
  }
) {
  requireStripeWebhookTransaction(
    await updateStripeCheckoutTransaction(
      repository,
      event,
      {
        status: "succeeded",
        providerTransactionId: event.paymentIntentId,
        givenAt: event.paidAt,
        donorEmail: event.donorEmail,
        donorName: event.donorName,
        metadata: stripeEventMetadata(event.raw)
      }
    ),
    event,
    { checkoutSessionId: event.checkoutSessionId }
  );
}

function validateStripeChargeTransaction(
  transaction: GivingTransaction,
  event: {
    id: string;
    type: string;
    amountCents: number;
    currency: string;
    refundedAmountCents?: number;
  }
) {
  const mismatch =
    event.amountCents !== transaction.amountCents ||
    event.currency.toUpperCase() !== transaction.currency.toUpperCase() ||
    (event.refundedAmountCents !== undefined &&
      (event.refundedAmountCents < 0 ||
        event.refundedAmountCents > transaction.amountCents));
  if (!mismatch) {
    return;
  }
  throw appError({
    code: "provider_event_transaction_mismatch",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Stripe charge does not match the canonical giving transaction.",
    recoverable: true,
    retryable: false,
    evidence: {
      provider: "stripe",
      providerEventId: event.id,
      eventType: event.type,
      transactionId: transaction.id
    },
    nextAction: "inspect_provider_event"
  });
}

function requireStripeRefundStatus(
  transaction: GivingTransaction,
  event: { id: string; type: string; fullyRefunded: boolean }
) {
  const applied = event.fullyRefunded
    ? transaction.status === "refunded"
    : transaction.status === "succeeded" || transaction.status === "refunded";
  if (applied) {
    return;
  }
  throwUnmatchedStripeWebhook(event, {
    transactionId: transaction.id,
    currentStatus: transaction.status,
    expectedStatus: event.fullyRefunded ? "refunded" : "succeeded"
  });
}

function requireStripeChargeFinance(
  event: {
    id: string;
    type: string;
    balanceTransactionId: string | null;
    balanceGrossAmountCents: number | null;
    balanceCurrency: string | null;
    feeCents: number | null;
    netAmountCents: number | null;
  },
  transaction: GivingTransaction
) {
  if (
    event.balanceTransactionId &&
    event.balanceGrossAmountCents === transaction.amountCents &&
    event.balanceCurrency?.toUpperCase() ===
      transaction.currency.toUpperCase() &&
    event.feeCents !== null &&
    event.feeCents >= 0 &&
    event.netAmountCents !== null &&
    event.netAmountCents === event.balanceGrossAmountCents - event.feeCents
  ) {
    return {
      feeCents: event.feeCents,
      netAmountCents: event.netAmountCents
    };
  }
  throw appError({
    code: "provider_finance_unavailable",
    category: "external_dependency_failed",
    sourceLayer: "capability",
    statusCode: 502,
    message: "Stripe charge finance data is incomplete.",
    recoverable: true,
    retryable: true,
    evidence: {
      provider: "stripe",
      providerEventId: event.id,
      eventType: event.type,
      balanceTransactionId: event.balanceTransactionId,
      transactionId: transaction.id
    },
    nextAction: "retry"
  });
}

function requireStripeWebhookTransactions(
  transactions: GivingTransaction[],
  event: { id: string; type: string },
  evidence: Record<string, unknown>
) {
  if (transactions.length > 0) {
    return transactions;
  }
  throwUnmatchedStripeWebhook(event, evidence);
}

async function updateStripeCheckoutTransaction(
  repository: GivingRepository,
  event: {
    checkoutSessionId: string;
    transactionId: string | null;
  },
  input: Parameters<
    GivingRepository["updateTransactionStatusByProviderCheckoutSessionId"]
  >[2]
) {
  await validateStripeCheckoutTransaction(repository, event);
  const bySession =
    await repository.updateTransactionStatusByProviderCheckoutSessionId(
      "stripe",
      event.checkoutSessionId,
      input
    );
  if (bySession || !event.transactionId) {
    return bySession;
  }
  return repository.updateTransactionStatusById("stripe", event.transactionId, {
    ...input,
    providerCheckoutSessionId: event.checkoutSessionId
  });
}

async function validateStripeCheckoutTransaction(
  repository: GivingRepository,
  event: {
    checkoutSessionId: string;
    transactionId: string | null;
    amountCents?: number;
    currency?: string;
  }
) {
  const bySession = await repository.getTransactionByProviderCheckoutSessionId(
    "stripe",
    event.checkoutSessionId
  );
  const transaction =
    bySession ??
    (event.transactionId
      ? await repository.getTransactionById(event.transactionId)
      : null);
  if (!transaction) {
    return;
  }
  const mismatch =
    transaction.provider !== "stripe" ||
    (event.transactionId !== null && event.transactionId !== transaction.id) ||
    (event.amountCents !== undefined &&
      event.amountCents !== transaction.amountCents) ||
    (event.currency !== undefined &&
      event.currency.toUpperCase() !== transaction.currency.toUpperCase());
  if (!mismatch) {
    return;
  }
  throw appError({
    code: "provider_event_transaction_mismatch",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Stripe event does not match the canonical giving transaction.",
    recoverable: true,
    retryable: false,
    evidence: {
      provider: "stripe",
      transactionId: transaction.id,
      checkoutSessionId: event.checkoutSessionId
    },
    nextAction: "inspect_provider_event"
  });
}

function requireStripeWebhookTransaction(
  transaction: GivingTransaction | null,
  event: { id: string; type: string },
  evidence: Record<string, unknown>
) {
  if (transaction) {
    return transaction;
  }
  throwUnmatchedStripeWebhook(event, evidence);
}

function throwUnmatchedStripeWebhook(
  event: { id: string; type: string },
  evidence: Record<string, unknown>
): never {
  throw appError({
    code: "provider_event_unhandled",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Stripe webhook did not match a giving transaction.",
    recoverable: true,
    retryable: false,
    evidence: {
      provider: "stripe",
      providerEventId: event.id,
      eventType: event.type,
      ...evidence
    },
    nextAction: "inspect_provider_event"
  });
}

function stripeEventMetadata(raw: Record<string, unknown>) {
  return { stripeLastEvent: raw };
}
