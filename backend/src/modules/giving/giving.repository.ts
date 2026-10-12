import type {
  GivingStatement,
  GivingStatementListQuery,
  GivingSummary,
  GivingFund,
  GivingFundListQuery,
  GivingFundUpdateRequest,
  GivingFundUpsertRequest,
  GivingReconciliationQuery,
  GivingReconciliationResponse,
  GivingTransaction,
  GivingDisputeStatus,
  GivingReconciliationStatus,
  GivingTransactionStatus,
  GivingTransactionListQuery,
  MemberGivingStatementListQuery,
  MemberGivingTransactionListQuery,
  PaymentProviderEvent,
  PaymentProviderEventListQuery
} from "@mbc/api-contracts";

export interface GivingRepository {
  listFunds(query: GivingFundListQuery): Promise<GivingFund[]>;
  listActiveFunds(): Promise<GivingFund[]>;
  getFundById(id: string): Promise<GivingFund | null>;
  createFund(input: GivingFundCreateInput): Promise<GivingFundCreateResult>;
  updateFund(
    id: string,
    input: GivingFundUpdateInput
  ): Promise<GivingFundUpdateResult>;
  listTransactions(
    query: GivingTransactionListQuery
  ): Promise<GivingTransaction[]>;
  listTransactionsForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingTransaction[]>;
  getTransactionById(id: string): Promise<GivingTransaction | null>;
  summarize(query: GivingTransactionListQuery): Promise<GivingSummary>;
  summarizeForUser(
    userId: string,
    query: MemberGivingTransactionListQuery
  ): Promise<GivingSummary>;
  listStatements(query: GivingStatementListQuery): Promise<GivingStatement[]>;
  listStatementsForUser(
    userId: string,
    query: MemberGivingStatementListQuery
  ): Promise<GivingStatement[]>;
  getStatementByYear(year: number): Promise<GivingStatement | null>;
  getStatementById(id: string): Promise<GivingStatement | null>;
  getStatementForUserByYear(
    userId: string,
    year: number
  ): Promise<GivingStatement | null>;
  listConfirmedTransactionsForStatement(
    query: GivingStatementTransactionQuery
  ): Promise<GivingTransaction[]>;
  createStatement(input: GivingStatementCreateInput): Promise<GivingStatement>;
  createTransaction(input: GivingTransactionCreateInput): Promise<GivingTransaction>;
  updateTransactionStatusById(
    provider: string,
    id: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null>;
  getTransactionByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string
  ): Promise<GivingTransaction | null>;
  getTransactionByProviderTransactionId(
    provider: string,
    providerTransactionId: string
  ): Promise<GivingTransaction | null>;
  summarizeReconciliation(
    query: GivingReconciliationQuery
  ): Promise<GivingReconciliationResponse>;
  updateTransactionStatusByProviderCheckoutSessionId(
    provider: string,
    checkoutSessionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null>;
  updateTransactionStatusByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null>;
  updateTransactionFinanceByProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction | null>;
  updateTransactionsFinanceByProviderChargeIds(
    provider: string,
    providerChargeIds: string[],
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]>;
  updateTransactionsFinanceByPayoutId(
    provider: string,
    payoutId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]>;
  recordProviderEvent(input: PaymentProviderEventInput): Promise<{
    duplicate: boolean;
    status?: PaymentProviderEvent["status"];
  }>;
  markProviderEvent(
    provider: string,
    providerEventId: string,
    input: PaymentProviderEventUpdateInput
  ): Promise<void>;
  listProviderEvents(
    query: PaymentProviderEventListQuery
  ): Promise<PaymentProviderEvent[]>;
}

export type GivingTransactionCreateInput = {
  userId: string | null;
  donorName: string;
  donorEmail: string | null;
  provider: string;
  providerTransactionId?: string | null;
  providerCheckoutSessionId?: string | null;
  amountCents: number;
  currency: string;
  category: string;
  fundId?: string | null;
  status: GivingTransactionStatus;
  givenAt: Date;
  metadata?: Record<string, unknown>;
};

export type GivingFundCreateInput = GivingFundUpsertRequest;

export type GivingFundUpdateInput = GivingFundUpdateRequest;

export type GivingStatementTransactionQuery = {
  year: number;
  userId: string | null;
  donorName: string;
  donorEmail: string | null;
};

export type GivingStatementCreateInput = GivingStatementTransactionQuery & {
  totalAmountCents: number;
  currency: string;
  status: "ready";
  pdfObjectKey: string | null;
  generatedAt: Date;
};

export type GivingFundCreateResult =
  | { status: "created"; fund: GivingFund }
  | { status: "code_conflict" };

export type GivingFundUpdateResult =
  | { status: "updated"; before: GivingFund; fund: GivingFund }
  | { status: "not_found" };

export type GivingTransactionStatusUpdateInput = {
  status: GivingTransactionStatus;
  providerCheckoutSessionId?: string | null;
  providerTransactionId?: string | null;
  givenAt?: Date;
  donorEmail?: string | null;
  donorName?: string;
  metadata?: Record<string, unknown>;
  feeCents?: number;
  netAmountCents?: number;
  refundedAmountCents?: number;
  reconciliationStatus?: GivingReconciliationStatus;
  payoutId?: string | null;
  availableOn?: Date | null;
  disputeId?: string | null;
  disputeStatus?: GivingDisputeStatus;
  disputedAmountCents?: number;
};

export type GivingTransactionFinanceUpdateInput = {
  providerChargeId?: string;
  feeCents?: number;
  netAmountCents?: number;
  refundedAmountCents?: number;
  reconciliationStatus?: GivingReconciliationStatus;
  payoutId?: string | null;
  availableOn?: Date | null;
  disputeId?: string | null;
  disputeStatus?: GivingDisputeStatus;
  disputedAmountCents?: number;
  metadata?: Record<string, unknown>;
};

export type PaymentProviderEventInput = {
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type PaymentProviderEventUpdateInput = {
  status: "processed" | "ignored" | "failed";
  errorMessage?: string | null;
};
