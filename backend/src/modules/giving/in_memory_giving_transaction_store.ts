import type { GivingTransaction } from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  GivingTransactionCreateInput,
  GivingTransactionFinanceUpdateInput
} from "./giving.repository.js";
import { financeUpdate } from "./giving_calculations.js";

export class InMemoryGivingTransactionStore {
  private readonly providerChargeTransactionIds = new Map<string, string>();

  constructor(private readonly transactions: Map<string, GivingTransaction>) {}

  create(input: GivingTransactionCreateInput): GivingTransaction {
    const transaction: GivingTransaction = {
      id: randomUUID(),
      userId: input.userId,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      provider: input.provider,
      providerTransactionId: input.providerTransactionId ?? null,
      providerCheckoutSessionId: input.providerCheckoutSessionId ?? null,
      amountCents: input.amountCents,
      feeCents: 0,
      netAmountCents: input.status === "succeeded" ? input.amountCents : 0,
      refundedAmountCents: 0,
      currency: input.currency,
      category: input.category,
      fundId: input.fundId ?? null,
      status: input.status,
      reconciliationStatus: "unreconciled",
      payoutId: null,
      availableOn: null,
      disputeId: null,
      disputeStatus: "none",
      disputedAmountCents: 0,
      givenAt: input.givenAt.toISOString(),
      createdAt: new Date().toISOString()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  getByProviderTransactionId(
    provider: string,
    providerTransactionId: string
  ): GivingTransaction | null {
    return (
      [...this.transactions.values()].find(
        (transaction) =>
          transaction.provider === provider &&
          transaction.providerTransactionId === providerTransactionId
      ) ?? null
    );
  }

  byProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionFinanceUpdateInput
  ): GivingTransaction | null {
    const transaction = this.getByProviderTransactionId(
      provider,
      providerTransactionId
    );
    if (!transaction) {
      return null;
    }
    const updated = this.update(transaction, input);
    if (input.providerChargeId) {
      this.providerChargeTransactionIds.set(
        providerChargeKey(provider, input.providerChargeId),
        updated.id
      );
    }
    return updated;
  }

  byProviderChargeIds(
    provider: string,
    providerChargeIds: string[],
    input: GivingTransactionFinanceUpdateInput
  ): GivingTransaction[] {
    const transactionIds = new Set(
      providerChargeIds
        .map((chargeId) =>
          this.providerChargeTransactionIds.get(
            providerChargeKey(provider, chargeId)
          )
        )
        .filter((id): id is string => Boolean(id))
    );
    return [...this.transactions.values()]
      .filter((transaction) => transactionIds.has(transaction.id))
      .map((transaction) => this.update(transaction, input));
  }

  byPayoutId(
    provider: string,
    payoutId: string,
    input: GivingTransactionFinanceUpdateInput
  ): GivingTransaction[] {
    return [...this.transactions.values()]
      .filter(
        (transaction) =>
          transaction.provider === provider && transaction.payoutId === payoutId
      )
      .map((transaction) => this.update(transaction, input));
  }

  private update(
    transaction: GivingTransaction,
    input: GivingTransactionFinanceUpdateInput
  ) {
    const updated = { ...transaction, ...financeUpdate(input) };
    this.transactions.set(updated.id, updated);
    return updated;
  }
}

function providerChargeKey(provider: string, providerChargeId: string) {
  return `${provider}:${providerChargeId}`;
}
