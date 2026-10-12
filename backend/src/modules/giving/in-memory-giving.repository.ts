import type {
  GivingStatement,
  GivingStatementListQuery,
  GivingSummary,
  GivingFund,
  GivingFundListQuery,
  GivingReconciliationQuery,
  GivingReconciliationResponse,
  GivingTransaction,
  GivingTransactionListQuery,
  MemberGivingStatementListQuery,
  MemberGivingTransactionListQuery,
  PaymentProviderEvent,
  PaymentProviderEventListQuery
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type { GivingRepository } from "./giving.repository.js";
import type {
  GivingTransactionCreateInput,
  GivingFundCreateInput,
  GivingFundCreateResult,
  GivingFundUpdateInput,
  GivingFundUpdateResult,
  GivingStatementCreateInput,
  GivingStatementTransactionQuery,
  GivingTransactionFinanceUpdateInput,
  GivingTransactionStatusUpdateInput,
  PaymentProviderEventInput,
  PaymentProviderEventUpdateInput
} from "./giving.repository.js";
import {
  canApplyGivingStatusUpdate,
  financeUpdate,
  summarizeReconciliationTransactions,
  summarizeTransactions
} from "./giving_calculations.js";
import {
  filterGivingReconciliationTransactions,
  filterGivingStatements,
  filterGivingTransactions,
  givingFundWithStats
} from "./in_memory_giving_filters.js";
import {
  seedFunds,
  seedStatements,
  seedTransactions
} from "./in_memory_giving_seed_data.js";
import { InMemoryGivingProviderEvents } from "./in_memory_giving_provider_events.js";
import { InMemoryGivingTransactionStore } from "./in_memory_giving_transaction_store.js";

export class InMemoryGivingRepository implements GivingRepository {
  private funds = new Map<string, GivingFund>(
    seedFunds.map((fund) => [fund.id, fund])
  );
  private transactions = new Map<string, GivingTransaction>(
    seedTransactions.map((transaction) => [transaction.id, transaction])
  );
  private transactionStore = new InMemoryGivingTransactionStore(this.transactions);
  private statements = new Map<string, GivingStatement>(
    seedStatements.map((statement) => [statement.id, statement])
  );
  private providerEvents = new InMemoryGivingProviderEvents();

  async listFunds(query: GivingFundListQuery): Promise<GivingFund[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.funds.values()]
      .map((fund) => this.withFundStats(fund))
      .filter((fund) => {
        if (query.status && fund.status !== query.status) {
          return false;
        }
        if (normalizedQuery) {
          return [fund.code, fund.name, fund.description]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
      .slice(0, query.limit);
  }

  async listActiveFunds(): Promise<GivingFund[]> {
    return this.listFunds({ status: "active", limit: 200 });
  }

  async getFundById(id: string): Promise<GivingFund | null> {
    const fund = this.funds.get(id);
    return fund ? this.withFundStats(fund) : null;
  }

  async createFund(input: GivingFundCreateInput): Promise<GivingFundCreateResult> {
    if ([...this.funds.values()].some((fund) => fund.code === input.code)) {
      return { status: "code_conflict" };
    }
    const now = new Date().toISOString();
    const fund: GivingFund = {
      id: randomUUID(),
      code: input.code,
      name: input.name,
      description: input.description,
      status: input.status,
      targetAmountCents: input.targetAmountCents,
      displayOrder: input.displayOrder,
      totalAmountCents: 0,
      transactionCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.funds.set(fund.id, fund);
    return { status: "created", fund };
  }

  async updateFund(
    id: string,
    input: GivingFundUpdateInput
  ): Promise<GivingFundUpdateResult> {
    const existing = this.funds.get(id);
    if (!existing) {
      return { status: "not_found" };
    }
    const updated: GivingFund = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.targetAmountCents !== undefined
        ? { targetAmountCents: input.targetAmountCents }
        : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : {}),
      updatedAt: new Date().toISOString()
    };
    this.funds.set(id, updated);
    return {
      status: "updated",
      before: this.withFundStats(existing),
      fund: this.withFundStats(updated)
    };
  }

  async listTransactions(
    query: GivingTransactionListQuery
  ): Promise<GivingTransaction[]> {
    return this.filterTransactions(query)
      .sort((a, b) => b.givenAt.localeCompare(a.givenAt))
      .slice(0, query.limit);
  }

  async listTransactionsForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingTransaction[]> {
    return this.filterTransactions(query)
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.givenAt.localeCompare(a.givenAt))
      .slice(0, query.limit);
  }

  async getTransactionById(id: string): Promise<GivingTransaction | null> {
    return this.transactions.get(id) ?? null;
  }

  async summarize(query: GivingTransactionListQuery): Promise<GivingSummary> {
    const transactions = this.filterTransactions({
      ...query,
      status: query.status ?? "succeeded"
    }).filter((transaction) => transaction.status === "succeeded");
    return summarizeTransactions(transactions, query.year);
  }

  async summarizeForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingSummary> {
    const transactions = this.filterTransactions({
      ...query,
      status: query.status ?? "succeeded"
    }).filter(
      (transaction) =>
        transaction.status === "succeeded" && transaction.userId === userId
    );
    return summarizeTransactions(transactions, query.year);
  }

  async listStatements(
    query: GivingStatementListQuery
  ): Promise<GivingStatement[]> {
    return this.filterStatements(query)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async listStatementsForUser(
    userId: string,
    query: MemberGivingStatementListQuery
  ): Promise<GivingStatement[]> {
    return this.filterStatements(query)
      .filter((statement) => statement.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getStatementByYear(year: number): Promise<GivingStatement | null> {
    return (
      [...this.statements.values()]
        .filter((statement) => statement.taxYear === year)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  }

  async getStatementById(id: string): Promise<GivingStatement | null> {
    return this.statements.get(id) ?? null;
  }

  async getStatementForUserByYear(
    userId: string,
    year: number
  ): Promise<GivingStatement | null> {
    return (
      [...this.statements.values()]
        .filter(
          (statement) =>
            statement.userId === userId && statement.taxYear === year
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  }

  async listConfirmedTransactionsForStatement(
    query: GivingStatementTransactionQuery
  ): Promise<GivingTransaction[]> {
    return [...this.transactions.values()]
      .filter((transaction) =>
        transactionMatchesStatement(transaction, query)
      )
      .sort((a, b) => a.givenAt.localeCompare(b.givenAt));
  }

  async createStatement(
    input: GivingStatementCreateInput
  ): Promise<GivingStatement> {
    const now = new Date().toISOString();
    const statementId = randomUUID();
    const statement: GivingStatement = {
      id: statementId,
      userId: input.userId,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      taxYear: input.year,
      totalAmountCents: input.totalAmountCents,
      currency: input.currency,
      status: input.status,
      pdfObjectKey: input.pdfObjectKey,
      downloadUrl: null,
      generatedAt: input.generatedAt.toISOString(),
      updatedAt: now
    };
    this.statements.set(statement.id, statement);
    return statement;
  }

  async createTransaction(
    input: GivingTransactionCreateInput
  ): Promise<GivingTransaction> {
    return this.transactionStore.create(input);
  }

  async getTransactionByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string
  ): Promise<GivingTransaction | null> {
    return (
      [...this.transactions.values()].find(
        (transaction) =>
          transaction.provider === provider &&
          transaction.providerCheckoutSessionId === checkoutSessionId
      ) ?? null
    );
  }

  async getTransactionByProviderTransactionId(
    provider: string,
    providerTransactionId: string
  ): Promise<GivingTransaction | null> {
    return this.transactionStore.getByProviderTransactionId(
      provider,
      providerTransactionId
    );
  }

  async updateTransactionStatusById(
    provider: string,
    id: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction || transaction.provider !== provider) {
      return null;
    }
    if (!canApplyGivingStatusUpdate(transaction.status, input.status)) {
      return transaction;
    }
    const updated: GivingTransaction = {
      ...transaction,
      status: input.status,
      providerCheckoutSessionId:
        input.providerCheckoutSessionId ??
        transaction.providerCheckoutSessionId,
      providerTransactionId:
        input.providerTransactionId ?? transaction.providerTransactionId,
      donorEmail: input.donorEmail ?? transaction.donorEmail,
      donorName: input.donorName ?? transaction.donorName,
      ...financeUpdate(input),
      givenAt: input.givenAt?.toISOString() ?? transaction.givenAt
    };
    this.transactions.set(id, updated);
    return updated;
  }

  async updateTransactionStatusByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    const transaction = await this.getTransactionByProviderCheckoutSessionId(
      provider,
      checkoutSessionId
    );
    if (!transaction) {
      return null;
    }
    if (!canApplyGivingStatusUpdate(transaction.status, input.status)) {
      return transaction;
    }
    const updated: GivingTransaction = {
      ...transaction,
      status: input.status,
      providerCheckoutSessionId:
        input.providerCheckoutSessionId ??
        transaction.providerCheckoutSessionId,
      providerTransactionId:
        input.providerTransactionId ?? transaction.providerTransactionId,
      donorEmail: input.donorEmail ?? transaction.donorEmail,
      donorName: input.donorName ?? transaction.donorName,
      ...financeUpdate(input),
      givenAt: input.givenAt?.toISOString() ?? transaction.givenAt
    };
    this.transactions.set(updated.id, updated);
    return updated;
  }

  async updateTransactionStatusByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    const transaction =
      [...this.transactions.values()].find(
        (item) =>
          item.provider === provider &&
          item.providerTransactionId === providerTransactionId
      ) ?? null;
    if (!transaction) {
      return null;
    }
    if (!canApplyGivingStatusUpdate(transaction.status, input.status)) {
      return transaction;
    }
    const updated: GivingTransaction = {
      ...transaction,
      status: input.status,
      donorEmail: input.donorEmail ?? transaction.donorEmail,
      donorName: input.donorName ?? transaction.donorName,
      ...financeUpdate(input),
      givenAt: input.givenAt?.toISOString() ?? transaction.givenAt
    };
    this.transactions.set(updated.id, updated);
    return updated;
  }

  async summarizeReconciliation(
    query: GivingReconciliationQuery
  ): Promise<GivingReconciliationResponse> {
    const year = query.year ?? new Date().getUTCFullYear();
    const transactions = filterGivingReconciliationTransactions(
      this.transactions.values(),
      query,
      year
    );
    return summarizeReconciliationTransactions(transactions, { ...query, year });
  }

  async updateTransactionFinanceByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction | null> {
    return this.transactionStore.byProviderTransactionId(
      provider,
      providerTransactionId,
      input
    );
  }

  async updateTransactionsFinanceByProviderChargeIds(
    provider: string,
    providerChargeIds: string[],
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]> {
    return this.transactionStore.byProviderChargeIds(
      provider,
      providerChargeIds,
      input
    );
  }

  async updateTransactionsFinanceByPayoutId(
    provider: string,
    payoutId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]> {
    return this.transactionStore.byPayoutId(provider, payoutId, input);
  }

  async recordProviderEvent(input: PaymentProviderEventInput) {
    return this.providerEvents.record(input);
  }

  async markProviderEvent(
    provider: string,
    providerEventId: string,
    input: PaymentProviderEventUpdateInput
  ): Promise<void> {
    return this.providerEvents.mark(provider, providerEventId, input);
  }

  async listProviderEvents(
    query: PaymentProviderEventListQuery
  ): Promise<PaymentProviderEvent[]> {
    return this.providerEvents.list(query);
  }

  private filterStatements(
    query: GivingStatementListQuery | MemberGivingStatementListQuery
  ) {
    return filterGivingStatements(this.statements.values(), query);
  }

  private filterTransactions(
    query: GivingTransactionListQuery | MemberGivingTransactionListQuery
  ) {
    return filterGivingTransactions(this.transactions.values(), query);
  }

  private withFundStats(fund: GivingFund): GivingFund {
    return givingFundWithStats(fund, this.transactions.values());
  }
}

function transactionMatchesStatement(
  transaction: GivingTransaction,
  query: GivingStatementTransactionQuery
) {
  if (
    transaction.status !== "succeeded" ||
    new Date(transaction.givenAt).getUTCFullYear() !== query.year
  ) {
    return false;
  }
  if (query.userId) {
    return transaction.userId === query.userId;
  }
  if (query.donorEmail) {
    return transaction.donorEmail === query.donorEmail;
  }
  return query.donorName === "All donors" || transaction.donorName === query.donorName;
}
