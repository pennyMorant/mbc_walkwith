import type {
  GivingReconciliationQuery,
  GivingFundListQuery,
  GivingStatementListQuery,
  GivingTransactionListQuery,
  PaymentProviderEventListQuery,
  MemberGivingStatementListQuery,
  MemberGivingTransactionListQuery
} from "@mbc/api-contracts";
import { and, eq, gte, ilike, lt, or } from "drizzle-orm";

import {
  annualStatements,
  givingFunds,
  paymentProviderEvents,
  givingTransactions
} from "../../shared/db/schema.js";

export function fundWhere(query: GivingFundListQuery) {
  const filters = [
    query.status ? eq(givingFunds.status, query.status) : undefined,
    query.query
      ? or(
          ilike(givingFunds.code, `%${query.query}%`),
          ilike(givingFunds.name, `%${query.query}%`),
          ilike(givingFunds.description, `%${query.query}%`)
        )
      : undefined
  ].filter((filter) => filter !== undefined);
  return filters.length > 0 ? and(...filters) : undefined;
}

export function transactionWhere(
  query: (GivingTransactionListQuery | MemberGivingTransactionListQuery) & {
    userId?: string;
  }
) {
  const filters = [
    query.year
      ? gte(
          givingTransactions.givenAt,
          new Date(`${query.year}-01-01T00:00:00.000Z`)
        )
      : undefined,
    query.year
      ? lt(
          givingTransactions.givenAt,
          new Date(`${query.year + 1}-01-01T00:00:00.000Z`)
        )
      : undefined,
    query.userId ? eq(givingTransactions.userId, query.userId) : undefined,
    query.status ? eq(givingTransactions.status, query.status) : undefined,
    query.category ? eq(givingTransactions.category, query.category) : undefined,
    "fundId" in query && query.fundId
      ? eq(givingTransactions.fundId, query.fundId)
      : undefined,
    "query" in query && query.query
      ? or(
          ilike(givingTransactions.donorName, `%${query.query}%`),
          ilike(givingTransactions.donorEmail, `%${query.query}%`),
          ilike(givingTransactions.category, `%${query.query}%`),
          ilike(givingTransactions.providerTransactionId, `%${query.query}%`)
        )
      : undefined
  ].filter((filter) => filter !== undefined);
  return filters.length > 0 ? and(...filters) : undefined;
}

export function reconciliationWhere(
  query: GivingReconciliationQuery & { year: number }
) {
  const filters = [
    gte(
      givingTransactions.givenAt,
      new Date(`${query.year}-01-01T00:00:00.000Z`)
    ),
    lt(
      givingTransactions.givenAt,
      new Date(`${query.year + 1}-01-01T00:00:00.000Z`)
    ),
    query.provider ? eq(givingTransactions.provider, query.provider) : undefined,
    query.status
      ? eq(givingTransactions.reconciliationStatus, query.status)
      : undefined,
    query.fundId ? eq(givingTransactions.fundId, query.fundId) : undefined,
    or(
      eq(givingTransactions.status, "succeeded"),
      eq(givingTransactions.status, "refunded")
    )
  ].filter((filter) => filter !== undefined);
  return and(...filters);
}

export function statementWhere(
  query: (GivingStatementListQuery | MemberGivingStatementListQuery) & {
    userId?: string;
  }
) {
  const filters = [
    query.year ? eq(annualStatements.taxYear, query.year) : undefined,
    query.userId ? eq(annualStatements.userId, query.userId) : undefined,
    query.status ? eq(annualStatements.status, query.status) : undefined,
    "query" in query && query.query
      ? or(
          ilike(annualStatements.donorName, `%${query.query}%`),
          ilike(annualStatements.donorEmail, `%${query.query}%`),
          ilike(annualStatements.userId, `%${query.query}%`)
        )
      : undefined
  ].filter((filter) => filter !== undefined);
  return filters.length > 0 ? and(...filters) : undefined;
}

export function providerEventWhere(query: PaymentProviderEventListQuery) {
  const filters = [
    query.provider ? eq(paymentProviderEvents.provider, query.provider) : undefined,
    query.status ? eq(paymentProviderEvents.status, query.status) : undefined,
    query.query
      ? or(
          ilike(paymentProviderEvents.providerEventId, `%${query.query}%`),
          ilike(paymentProviderEvents.eventType, `%${query.query}%`),
          ilike(paymentProviderEvents.errorMessage, `%${query.query}%`)
        )
      : undefined
  ].filter((filter) => filter !== undefined);
  return filters.length > 0 ? and(...filters) : undefined;
}
