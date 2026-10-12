import type {
  GivingReconciliationQuery,
  GivingReconciliationResponse,
  GivingSummary,
  GivingTransaction,
  GivingTransactionStatus
} from "@mbc/api-contracts";

import type {
  GivingTransactionFinanceUpdateInput,
  GivingTransactionStatusUpdateInput
} from "./giving.repository.js";

export function summarizeTransactions(
  transactions: GivingTransaction[],
  queryYear: number | undefined
): GivingSummary {
  const year = queryYear ?? new Date().getUTCFullYear();
  const currency = transactions[0]?.currency ?? "USD";
  const byCategory = new Map<string, { amountCents: number; count: number }>();
  const donors = new Set<string>();

  for (const transaction of transactions) {
    const existing = byCategory.get(transaction.category) ?? {
      amountCents: 0,
      count: 0
    };
    byCategory.set(transaction.category, {
      amountCents: existing.amountCents + transaction.amountCents,
      count: existing.count + 1
    });
    donors.add(donorKey(transaction));
  }

  return {
    year,
    totalAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.amountCents,
      0
    ),
    totalFeeCents: transactions.reduce(
      (total, transaction) => total + transaction.feeCents,
      0
    ),
    totalNetAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.netAmountCents,
      0
    ),
    refundedAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.refundedAmountCents,
      0
    ),
    disputedAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.disputedAmountCents,
      0
    ),
    transactionCount: transactions.length,
    donorCount: donors.size,
    currency,
    byCategory: [...byCategory.entries()].map(([category, value]) => ({
      category,
      amountCents: value.amountCents,
      count: value.count
    }))
  };
}

export function summarizeReconciliationTransactions(
  transactions: GivingTransaction[],
  query: GivingReconciliationQuery & { year: number }
): GivingReconciliationResponse {
  const payoutIds = new Set(
    transactions
      .map((transaction) => transaction.payoutId)
      .filter((payoutId): payoutId is string => Boolean(payoutId))
  );

  return {
    year: query.year,
    provider: query.provider ?? null,
    currency: transactions[0]?.currency ?? "USD",
    grossAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.amountCents,
      0
    ),
    feeCents: transactions.reduce(
      (total, transaction) => total + transaction.feeCents,
      0
    ),
    netAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.netAmountCents,
      0
    ),
    refundedAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.refundedAmountCents,
      0
    ),
    disputedAmountCents: transactions.reduce(
      (total, transaction) => total + transaction.disputedAmountCents,
      0
    ),
    transactionCount: transactions.length,
    unreconciledCount: transactions.filter(
      (transaction) => transaction.reconciliationStatus === "unreconciled"
    ).length,
    needsReviewCount: transactions.filter(
      (transaction) => transaction.reconciliationStatus === "needs_review"
    ).length,
    disputeCount: transactions.filter(
      (transaction) => transaction.disputeStatus !== "none"
    ).length,
    payoutCount: payoutIds.size
  };
}

export function financeUpdate(
  input: GivingTransactionStatusUpdateInput | GivingTransactionFinanceUpdateInput
): Partial<GivingTransaction> {
  return {
    ...(input.feeCents !== undefined ? { feeCents: input.feeCents } : {}),
    ...(input.netAmountCents !== undefined
      ? { netAmountCents: input.netAmountCents }
      : {}),
    ...(input.refundedAmountCents !== undefined
      ? { refundedAmountCents: input.refundedAmountCents }
      : {}),
    ...(input.reconciliationStatus !== undefined
      ? { reconciliationStatus: input.reconciliationStatus }
      : {}),
    ...(input.payoutId !== undefined ? { payoutId: input.payoutId } : {}),
    ...(input.availableOn !== undefined
      ? { availableOn: input.availableOn?.toISOString() ?? null }
      : {}),
    ...(input.disputeId !== undefined ? { disputeId: input.disputeId } : {}),
    ...(input.disputeStatus !== undefined
      ? { disputeStatus: input.disputeStatus }
      : {}),
    ...(input.disputedAmountCents !== undefined
      ? { disputedAmountCents: input.disputedAmountCents }
      : {})
  };
}

export function yearFromIso(value: string) {
  return new Date(value).getUTCFullYear();
}

export function providerEventKey(provider: string, providerEventId: string) {
  return `${provider}:${providerEventId}`;
}

export function canApplyGivingStatusUpdate(
  current: GivingTransactionStatus,
  next: GivingTransactionStatus
) {
  if (current === next) {
    return true;
  }
  if (current === "pending") {
    return next === "succeeded" || next === "failed";
  }
  if (current === "succeeded") {
    return next === "refunded";
  }
  if (current === "failed") {
    return next === "succeeded";
  }
  return false;
}

function donorKey(transaction: GivingTransaction) {
  return transaction.userId ?? transaction.donorEmail ?? transaction.donorName;
}
