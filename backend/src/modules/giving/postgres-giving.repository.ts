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
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  annualStatements,
  givingFunds,
  givingTransactions
} from "../../shared/db/schema.js";
import type { GivingRepository } from "./giving.repository.js";
import type {
  GivingTransactionCreateInput,
  GivingFundCreateInput,
  GivingFundCreateResult,
  GivingFundUpdateInput,
  GivingFundUpdateResult,
  GivingStatementCreateInput,
  GivingStatementTransactionQuery,
  GivingTransactionStatusUpdateInput,
  GivingTransactionFinanceUpdateInput,
  PaymentProviderEventInput,
  PaymentProviderEventUpdateInput
} from "./giving.repository.js";
import {
  summarizeReconciliationTransactions,
  summarizeTransactions
} from "./giving_calculations.js";
import {
  fundFromRow,
  statementFromRow,
  transactionFromRow
} from "./postgres_giving_mappers.js";
import {
  fundWhere,
  reconciliationWhere,
  statementWhere,
  transactionWhere
} from "./postgres_giving_queries.js";
import { PostgresGivingProviderEvents } from "./postgres_giving_provider_events.js";
import { PostgresGivingFinanceUpdates } from "./postgres_giving_finance_updates.js";
import { PostgresGivingTransactionStatusUpdates } from "./postgres_giving_transaction_status_updates.js";
import { isGivingFundCodeConflict } from "./postgres_giving_errors.js";

export class PostgresGivingRepository implements GivingRepository {
  private readonly providerEvents: PostgresGivingProviderEvents;
  private readonly financeUpdates: PostgresGivingFinanceUpdates;
  private readonly transactionStatusUpdates: PostgresGivingTransactionStatusUpdates;

  constructor(private readonly db: AppDb) {
    this.providerEvents = new PostgresGivingProviderEvents(db);
    this.financeUpdates = new PostgresGivingFinanceUpdates(db);
    this.transactionStatusUpdates = new PostgresGivingTransactionStatusUpdates(db);
  }

  async listFunds(query: GivingFundListQuery): Promise<GivingFund[]> {
    const rows = await this.db
      .select()
      .from(givingFunds)
      .where(fundWhere(query))
      .orderBy(asc(givingFunds.displayOrder), asc(givingFunds.name))
      .limit(query.limit);
    return Promise.all(rows.map((row) => fundFromRow(this.db, row)));
  }

  async listActiveFunds(): Promise<GivingFund[]> {
    return this.listFunds({ status: "active", limit: 200 });
  }

  async getFundById(id: string): Promise<GivingFund | null> {
    const [row] = await this.db
      .select()
      .from(givingFunds)
      .where(eq(givingFunds.id, id))
      .limit(1);
    return row ? fundFromRow(this.db, row) : null;
  }

  async createFund(input: GivingFundCreateInput): Promise<GivingFundCreateResult> {
    let row: typeof givingFunds.$inferSelect | undefined;
    try {
      [row] = await this.db
        .insert(givingFunds)
        .values({
          code: input.code,
          name: input.name,
          description: input.description,
          status: input.status,
          targetAmountCents: input.targetAmountCents,
          displayOrder: input.displayOrder
        })
        .returning();
    } catch (error) {
      if (isGivingFundCodeConflict(error)) {
        return { status: "code_conflict" };
      }
      throw error;
    }
    if (!row) {
      throw new Error("Failed to create giving fund.");
    }
    return { status: "created", fund: await fundFromRow(this.db, row) };
  }

  async updateFund(
    id: string,
    input: GivingFundUpdateInput
  ): Promise<GivingFundUpdateResult> {
    const [beforeRow] = await this.db
      .select()
      .from(givingFunds)
      .where(eq(givingFunds.id, id))
      .limit(1);
    if (!beforeRow) {
      return { status: "not_found" };
    }
    const [row] = await this.db
      .update(givingFunds)
      .set({
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
        updatedAt: new Date()
      })
      .where(eq(givingFunds.id, id))
      .returning();
    if (!row) {
      return { status: "not_found" };
    }
    const [before, fund] = await Promise.all([
      fundFromRow(this.db, beforeRow),
      fundFromRow(this.db, row)
    ]);
    return { status: "updated", before, fund };
  }

  async listTransactions(
    query: GivingTransactionListQuery
  ): Promise<GivingTransaction[]> {
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(transactionWhere(query))
      .orderBy(desc(givingTransactions.givenAt))
      .limit(query.limit);
    return rows.map(transactionFromRow);
  }

  async listTransactionsForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingTransaction[]> {
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(transactionWhere({ ...query, userId }))
      .orderBy(desc(givingTransactions.givenAt))
      .limit(query.limit);
    return rows.map(transactionFromRow);
  }

  async getTransactionById(id: string): Promise<GivingTransaction | null> {
    const [row] = await this.db
      .select()
      .from(givingTransactions)
      .where(eq(givingTransactions.id, id))
      .limit(1);
    return row ? transactionFromRow(row) : null;
  }

  async summarize(query: GivingTransactionListQuery): Promise<GivingSummary> {
    const year = query.year ?? new Date().getUTCFullYear();
    if (query.status && query.status !== "succeeded") {
      return summarizeTransactions([], year);
    }
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(transactionWhere({ ...query, status: "succeeded", year }))
      .limit(10000);
    const transactions = rows.map(transactionFromRow);
    return summarizeTransactions(transactions, year);
  }

  async summarizeForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingSummary> {
    const year = query.year ?? new Date().getUTCFullYear();
    if (query.status && query.status !== "succeeded") {
      return summarizeTransactions([], year);
    }
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(transactionWhere({ ...query, status: "succeeded", year, userId }))
      .limit(10000);
    const transactions = rows.map(transactionFromRow);
    return summarizeTransactions(transactions, year);
  }

  async listStatements(
    query: GivingStatementListQuery
  ): Promise<GivingStatement[]> {
    const rows = await this.db
      .select()
      .from(annualStatements)
      .where(statementWhere(query))
      .orderBy(desc(annualStatements.updatedAt))
      .limit(query.limit);
    return rows.map(statementFromRow);
  }

  async listStatementsForUser(
    userId: string,
    query: MemberGivingStatementListQuery
  ): Promise<GivingStatement[]> {
    const rows = await this.db
      .select()
      .from(annualStatements)
      .where(statementWhere({ ...query, userId }))
      .orderBy(desc(annualStatements.updatedAt))
      .limit(query.limit);
    return rows.map(statementFromRow);
  }

  async getStatementByYear(year: number): Promise<GivingStatement | null> {
    const [row] = await this.db
      .select()
      .from(annualStatements)
      .where(eq(annualStatements.taxYear, year))
      .orderBy(desc(annualStatements.updatedAt))
      .limit(1);
    return row ? statementFromRow(row) : null;
  }

  async getStatementById(id: string): Promise<GivingStatement | null> {
    const [row] = await this.db
      .select()
      .from(annualStatements)
      .where(eq(annualStatements.id, id))
      .limit(1);
    return row ? statementFromRow(row) : null;
  }

  async getStatementForUserByYear(
    userId: string,
    year: number
  ): Promise<GivingStatement | null> {
    const [row] = await this.db
      .select()
      .from(annualStatements)
      .where(
        and(eq(annualStatements.userId, userId), eq(annualStatements.taxYear, year))
      )
      .orderBy(desc(annualStatements.updatedAt))
      .limit(1);
    return row ? statementFromRow(row) : null;
  }

  async listConfirmedTransactionsForStatement(
    query: GivingStatementTransactionQuery
  ): Promise<GivingTransaction[]> {
    const identityFilter = query.userId
      ? eq(givingTransactions.userId, query.userId)
      : query.donorEmail
        ? eq(givingTransactions.donorEmail, query.donorEmail)
        : query.donorName === "All donors"
          ? undefined
          : eq(givingTransactions.donorName, query.donorName);
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(
        and(
          eq(givingTransactions.status, "succeeded"),
          gte(
            givingTransactions.givenAt,
            new Date(`${query.year}-01-01T00:00:00.000Z`)
          ),
          lt(
            givingTransactions.givenAt,
            new Date(`${query.year + 1}-01-01T00:00:00.000Z`)
          ),
          identityFilter
        )
      )
      .orderBy(asc(givingTransactions.givenAt));
    return rows.map(transactionFromRow);
  }

  async createStatement(
    input: GivingStatementCreateInput
  ): Promise<GivingStatement> {
    const [row] = await this.db
      .insert(annualStatements)
      .values({
        userId: input.userId,
        donorName: input.donorName,
        donorEmail: input.donorEmail,
        taxYear: input.year,
        totalAmountCents: input.totalAmountCents,
        currency: input.currency,
        pdfObjectKey: input.pdfObjectKey,
        status: input.status,
        generatedAt: input.generatedAt,
        updatedAt: input.generatedAt
      })
      .returning();
    if (!row) {
      throw new Error("Failed to generate giving statement.");
    }
    return statementFromRow(row);
  }

  async createTransaction(
    input: GivingTransactionCreateInput
  ): Promise<GivingTransaction> {
    const [row] = await this.db
      .insert(givingTransactions)
      .values({
        userId: input.userId,
        donorName: input.donorName,
        donorEmail: input.donorEmail,
        provider: input.provider,
        providerTransactionId: input.providerTransactionId ?? null,
        providerCheckoutSessionId: input.providerCheckoutSessionId ?? null,
        amountCents: input.amountCents,
        currency: input.currency,
        category: input.category,
        fundId: input.fundId ?? null,
        status: input.status,
        givenAt: input.givenAt,
        metadata: input.metadata ?? {}
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create giving transaction.");
    }
    return transactionFromRow(row);
  }

  async getTransactionByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string
  ): Promise<GivingTransaction | null> {
    const [row] = await this.db
      .select()
      .from(givingTransactions)
      .where(
        and(
          eq(givingTransactions.provider, provider),
          eq(givingTransactions.providerCheckoutSessionId, checkoutSessionId)
        )
      )
      .limit(1);
    return row ? transactionFromRow(row) : null;
  }

  async getTransactionByProviderTransactionId(
    provider: string,
    providerTransactionId: string
  ): Promise<GivingTransaction | null> {
    const [row] = await this.db
      .select()
      .from(givingTransactions)
      .where(
        and(
          eq(givingTransactions.provider, provider),
          eq(givingTransactions.providerTransactionId, providerTransactionId)
        )
      )
      .limit(1);
    return row ? transactionFromRow(row) : null;
  }

  async summarizeReconciliation(
    query: GivingReconciliationQuery
  ): Promise<GivingReconciliationResponse> {
    const year = query.year ?? new Date().getUTCFullYear();
    const rows = await this.db
      .select()
      .from(givingTransactions)
      .where(reconciliationWhere({ ...query, year }))
      .limit(10000);
    const transactions = rows.map(transactionFromRow);
    return summarizeReconciliationTransactions(transactions, { ...query, year });
  }

  async updateTransactionStatusById(
    provider: string,
    id: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    return this.transactionStatusUpdates.byId(provider, id, input);
  }

  async updateTransactionStatusByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    return this.transactionStatusUpdates.byCheckoutSessionId(
      provider,
      checkoutSessionId,
      input
    );
  }

  async updateTransactionStatusByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    return this.transactionStatusUpdates.byProviderTransactionId(
      provider,
      providerTransactionId,
      input
    );
  }

  async updateTransactionFinanceByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction | null> {
    return this.financeUpdates.byProviderTransactionId(
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
    return this.financeUpdates.byProviderChargeIds(
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
    return this.financeUpdates.byPayoutId(provider, payoutId, input);
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
}
