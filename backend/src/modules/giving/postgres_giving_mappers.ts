import type {
  GivingFund,
  GivingStatement,
  GivingTransaction,
  PaymentProviderEvent
} from "@mbc/api-contracts";
import { and, eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  annualStatements,
  givingFunds,
  givingTransactions,
  paymentProviderEvents
} from "../../shared/db/schema.js";

type AnnualStatementRow = typeof annualStatements.$inferSelect;
type GivingFundRow = typeof givingFunds.$inferSelect;
type GivingTransactionRow = typeof givingTransactions.$inferSelect;
type PaymentProviderEventRow = typeof paymentProviderEvents.$inferSelect;

export function transactionFromRow(
  row: GivingTransactionRow
): GivingTransaction {
  return {
    id: row.id,
    userId: row.userId,
    donorName: row.donorName,
    donorEmail: row.donorEmail,
    provider: row.provider,
    providerTransactionId: row.providerTransactionId,
    providerCheckoutSessionId: row.providerCheckoutSessionId,
    amountCents: row.amountCents,
    feeCents: row.feeCents,
    netAmountCents: row.netAmountCents,
    refundedAmountCents: row.refundedAmountCents,
    currency: row.currency,
    category: row.category,
    fundId: row.fundId,
    status: row.status,
    reconciliationStatus: row.reconciliationStatus,
    payoutId: row.payoutId,
    availableOn: row.availableOn?.toISOString() ?? null,
    disputeId: row.disputeId,
    disputeStatus: row.disputeStatus,
    disputedAmountCents: row.disputedAmountCents,
    givenAt: row.givenAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

export function statementFromRow(row: AnnualStatementRow): GivingStatement {
  return {
    id: row.id,
    userId: row.userId,
    donorName: row.donorName,
    donorEmail: row.donorEmail,
    taxYear: row.taxYear,
    totalAmountCents: row.totalAmountCents,
    currency: row.currency,
    status: row.status,
    pdfObjectKey: row.pdfObjectKey,
    downloadUrl: row.pdfObjectKey
      ? `/v1/admin/giving/statements/${row.id}/download`
      : null,
    generatedAt: row.generatedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function fundFromRow(
  db: AppDb,
  row: GivingFundRow
): Promise<GivingFund> {
  const stats = await transactionStatsForFund(db, row.id);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    targetAmountCents: row.targetAmountCents,
    displayOrder: row.displayOrder,
    totalAmountCents: stats.totalAmountCents,
    transactionCount: stats.transactionCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function paymentProviderEventFromRow(
  row: PaymentProviderEventRow
): PaymentProviderEvent {
  return {
    id: row.id,
    provider: row.provider,
    providerEventId: row.providerEventId,
    eventType: row.eventType,
    status: row.status,
    errorMessage: row.errorMessage,
    receivedAt: row.receivedAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null
  };
}

async function transactionStatsForFund(
  db: AppDb,
  fundId: string
): Promise<{ totalAmountCents: number; transactionCount: number }> {
  const rows = await db
    .select()
    .from(givingTransactions)
    .where(
      and(
        eq(givingTransactions.fundId, fundId),
        eq(givingTransactions.status, "succeeded")
      )
    )
    .limit(10000);
  return {
    totalAmountCents: rows.reduce(
      (total, transaction) => total + transaction.amountCents,
      0
    ),
    transactionCount: rows.length
  };
}
