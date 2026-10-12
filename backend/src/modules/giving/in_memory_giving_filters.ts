import type {
  GivingFund,
  GivingReconciliationQuery,
  GivingStatement,
  GivingStatementListQuery,
  GivingTransaction,
  GivingTransactionListQuery,
  MemberGivingStatementListQuery,
  MemberGivingTransactionListQuery
} from "@mbc/api-contracts";

import { yearFromIso } from "./giving_calculations.js";

export function filterGivingStatements(
  statements: Iterable<GivingStatement>,
  query: GivingStatementListQuery | MemberGivingStatementListQuery
) {
  const normalizedQuery =
    "query" in query ? query.query?.trim().toLowerCase() : undefined;

  return [...statements].filter((statement) => {
    if (query.year && statement.taxYear !== query.year) {
      return false;
    }
    if (query.status && statement.status !== query.status) {
      return false;
    }
    if (normalizedQuery) {
      return [
        statement.donorName,
        statement.donorEmail ?? "",
        statement.userId ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    }
    return true;
  });
}

export function filterGivingTransactions(
  transactions: Iterable<GivingTransaction>,
  query: GivingTransactionListQuery | MemberGivingTransactionListQuery
) {
  const normalizedQuery =
    "query" in query ? query.query?.trim().toLowerCase() : undefined;

  return [...transactions].filter((transaction) => {
    if (query.year && yearFromIso(transaction.givenAt) !== query.year) {
      return false;
    }
    if (query.status && transaction.status !== query.status) {
      return false;
    }
    if (query.category && transaction.category !== query.category) {
      return false;
    }
    if (
      "fundId" in query &&
      query.fundId &&
      transaction.fundId !== query.fundId
    ) {
      return false;
    }
    if (normalizedQuery) {
      return [
        transaction.donorName,
        transaction.donorEmail ?? "",
        transaction.category,
        transaction.providerTransactionId ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    }
    return true;
  });
}

export function filterGivingReconciliationTransactions(
  transactions: Iterable<GivingTransaction>,
  query: GivingReconciliationQuery,
  year: number
) {
  return [...transactions].filter((transaction) => {
    if (yearFromIso(transaction.givenAt) !== year) {
      return false;
    }
    if (query.provider && transaction.provider !== query.provider) {
      return false;
    }
    if (query.status && transaction.reconciliationStatus !== query.status) {
      return false;
    }
    if (query.fundId && transaction.fundId !== query.fundId) {
      return false;
    }
    return transaction.status === "succeeded" || transaction.status === "refunded";
  });
}

export function givingFundWithStats(
  fund: GivingFund,
  transactions: Iterable<GivingTransaction>
): GivingFund {
  const fundTransactions = [...transactions].filter(
    (transaction) =>
      transaction.fundId === fund.id && transaction.status === "succeeded"
  );

  return {
    ...fund,
    totalAmountCents: fundTransactions.reduce(
      (total, transaction) => total + transaction.amountCents,
      0
    ),
    transactionCount: fundTransactions.length
  };
}
