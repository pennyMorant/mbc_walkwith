import type {
  GivingCheckoutSessionRequest,
  GivingFundListQuery,
  GivingFundUpdateRequest,
  GivingFundUpsertRequest,
  GivingStatementGenerateRequest,
  GivingStatementListQuery,
  GivingReconciliationQuery,
  GivingTransactionListQuery,
  MemberGivingStatementListQuery,
  MemberGivingTransactionListQuery,
  PaymentProviderEventListQuery
} from "@mbc/api-contracts";

import { appError } from "../../shared/http/app-error.js";
import type { GivingRepository } from "./giving.repository.js";
import type { StripeGivingProvider } from "./stripe-giving.provider.js";
import { csvCell } from "./annual-statement-export.js";
import { AnnualStatementService } from "./annual_statement.service.js";
import { applyStripeWebhookEvent } from "./stripe_giving_webhook_handler.js";

export class GivingService {
  private readonly annualStatementService: AnnualStatementService;

  constructor(
    private readonly repository: GivingRepository,
    private readonly stripeProvider?: StripeGivingProvider,
    private readonly options: GivingServiceOptions = {}
  ) {
    this.annualStatementService = new AnnualStatementService(repository);
  }

  listFunds(query: GivingFundListQuery) {
    return this.repository.listFunds(query);
  }

  listActiveFunds() {
    return this.repository.listActiveFunds();
  }

  async createFund(input: GivingFundUpsertRequest) {
    const result = await this.repository.createFund(input);
    if (result.status === "code_conflict") {
      throw givingFundCodeConflict(input.code);
    }
    return result.fund;
  }

  async updateFund(id: string, input: GivingFundUpdateRequest) {
    const result = await this.repository.updateFund(id, input);
    if (result.status === "not_found") {
      throw appError({
        code: "giving_fund_not_found",
        category: "not_found",
        sourceLayer: "feature",
        statusCode: 404,
        message: "Giving fund not found.",
        recoverable: true,
        retryable: false,
        evidence: { fundId: id },
        nextAction: "refresh"
      });
    }
    return result;
  }

  async listTransactions(query: GivingTransactionListQuery) {
    const [items, summary] = await Promise.all([
      this.repository.listTransactions(query),
      this.repository.summarize(query)
    ]);
    return { items, summary };
  }

  summarizeTransactions(query: GivingTransactionListQuery) {
    return this.repository.summarize(query);
  }

  async listMemberTransactions(
    userId: string,
    query: MemberGivingTransactionListQuery
  ) {
    const [items, summary] = await Promise.all([
      this.repository.listTransactionsForUser(userId, query),
      this.repository.summarizeForUser(userId, query)
    ]);
    return { items, summary };
  }

  getTransactionById(id: string) {
    return this.repository.getTransactionById(id);
  }

  listStatements(query: GivingStatementListQuery) {
    return this.repository.listStatements(query);
  }

  listMemberStatements(userId: string, query: MemberGivingStatementListQuery) {
    return this.repository.listStatementsForUser(userId, query);
  }

  getStatementByYear(year: number) {
    return this.repository.getStatementByYear(year);
  }

  getStatementById(id: string) {
    return this.repository.getStatementById(id);
  }

  getMemberStatementByYear(userId: string, year: number) {
    return this.repository.getStatementForUserByYear(userId, year);
  }

  async exportStatementById(statementId: string) {
    return this.annualStatementService.exportById(statementId);
  }

  async exportMemberStatementCsv(userId: string, year: number) {
    return this.annualStatementService.exportForMember(userId, year);
  }

  generateStatement(year: number, input: GivingStatementGenerateRequest) {
    return this.annualStatementService.generate(year, input);
  }

  listProviderEvents(query: PaymentProviderEventListQuery) {
    return this.repository.listProviderEvents(query);
  }

  summarizeReconciliation(query: GivingReconciliationQuery) {
    return this.repository.summarizeReconciliation(query);
  }

  async createCheckoutSession(
    userId: string,
    input: GivingCheckoutSessionRequest
  ) {
    if (!this.stripeProvider) {
      throw appError({
        code: "checkout_session_failed",
        category: "configuration_missing",
        sourceLayer: "capability",
        statusCode: 503,
        message: "Stripe giving is not configured.",
        recoverable: true,
        retryable: true,
        nextAction: "configure_payment_provider"
      });
    }
    const fund = input.fundId
      ? await this.requireActiveFund(input.fundId)
      : null;
    const category = fund?.code ?? input.category;
    const donorEmail = input.donorEmail ?? null;
    const donorName = input.donorName ?? "";
    const transaction = await this.repository.createTransaction({
      userId,
      donorName,
      donorEmail,
      provider: "stripe",
      amountCents: input.amountCents,
      currency: input.currency.toUpperCase(),
      category,
      fundId: fund?.id ?? null,
      status: "pending",
      givenAt: new Date(),
      metadata: {
        source: "member_checkout",
        ...(fund
          ? {
              givingFundId: fund.id,
              givingFundCode: fund.code,
              givingFundName: fund.name
            }
          : {})
      }
    });
    let session: Awaited<
      ReturnType<StripeGivingProvider["createCheckoutSession"]>
    >;
    try {
      session = await this.stripeProvider.createCheckoutSession({
        amountCents: input.amountCents,
        currency: input.currency,
        category,
        donorEmail,
        transactionId: transaction.id,
        successUrl:
          this.options.checkoutSuccessUrl ??
          "mbcwalkwith://mine/giving?checkout=success",
        cancelUrl:
          this.options.checkoutCancelUrl ??
          "mbcwalkwith://mine/giving?checkout=cancel",
        userId
      });
    } catch (error) {
      const failed = await this.repository.updateTransactionStatusById(
        "stripe",
        transaction.id,
        {
          status: "failed",
          metadata: {
            source: "checkout_session_creation_failed",
            failureCode: checkoutFailureCode(error)
          }
        }
      );
      if (!failed) {
        throw appError({
          code: "checkout_session_failed",
          category: "repository_write_failed",
          sourceLayer: "repository",
          statusCode: 500,
          message: "Failed to close the pending giving transaction.",
          recoverable: true,
          retryable: true,
          evidence: {
            transactionId: transaction.id,
            providerFailureCode: checkoutFailureCode(error)
          },
          nextAction: "inspect_pending_transaction"
        });
      }
      throw error;
    }
    const updated = await this.repository.updateTransactionStatusById(
      "stripe",
      transaction.id,
      {
        status: "pending",
        providerCheckoutSessionId: session.id
      }
    );
    if (!updated) {
      throw appError({
        code: "checkout_session_failed",
        category: "repository_write_failed",
        sourceLayer: "repository",
        statusCode: 500,
        message: "Failed to attach Stripe checkout session to transaction.",
        recoverable: true,
        retryable: true,
        evidence: { transactionId: transaction.id }
      });
    }
    return {
      provider: "stripe" as const,
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      transactionId: updated.id
    };
  }

  private async requireActiveFund(fundId: string) {
    const fund = await this.repository.getFundById(fundId);
    if (!fund) {
      throw appError({
        code: "giving_fund_not_found",
        category: "not_found",
        sourceLayer: "feature",
        statusCode: 404,
        message: "Giving fund not found.",
        recoverable: true,
        retryable: false,
        evidence: { fundId },
        nextAction: "refresh"
      });
    }
    if (fund.status !== "active") {
      throw appError({
        code: "giving_fund_inactive",
        category: "state_conflict",
        sourceLayer: "feature",
        statusCode: 409,
        message: "Giving fund is not active.",
        recoverable: true,
        retryable: false,
        evidence: { fundId, status: fund.status },
        nextAction: "select_active_fund"
      });
    }
    return fund;
  }

  async handleStripeWebhook(payload: Buffer, signature: string | undefined) {
    if (!this.stripeProvider) {
      throw appError({
        code: "provider_event_unhandled",
        category: "configuration_missing",
        sourceLayer: "capability",
        statusCode: 503,
        message: "Stripe giving is not configured.",
        recoverable: true,
        retryable: true,
        nextAction: "configure_payment_provider"
      });
    }
    const event = this.stripeProvider.parseWebhookEvent(payload, signature);
    const recorded = await this.repository.recordProviderEvent({
      provider: "stripe",
      providerEventId: event.id,
      eventType: event.type,
      payload: event.raw
    });
    if (
      recorded.duplicate &&
      (recorded.status === "processed" || recorded.status === "ignored")
    ) {
      return { handled: true, duplicate: true };
    }
    try {
      const resolvedEvent = await this.stripeProvider.resolveWebhookEvent(event);
      const result = await applyStripeWebhookEvent(
        this.repository,
        resolvedEvent
      );
      await this.repository.markProviderEvent("stripe", event.id, {
        status: result.handled ? "processed" : "ignored"
      });
      return result;
    } catch (error) {
      await this.repository.markProviderEvent("stripe", event.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async exportTransactionsCsv(query: GivingTransactionListQuery) {
    const transactions = await this.repository.listTransactions({
      ...query,
      limit: query.limit ?? 200
    });
    return [
      [
        "id",
        "donorName",
        "donorEmail",
        "amountCents",
        "feeCents",
        "netAmountCents",
        "refundedAmountCents",
        "currency",
        "category",
        "fundId",
        "status",
        "reconciliationStatus",
        "payoutId",
        "availableOn",
        "disputeId",
        "disputeStatus",
        "disputedAmountCents",
        "givenAt",
        "provider",
        "providerTransactionId"
      ].join(","),
      ...transactions.map((transaction) =>
        [
          transaction.id,
          transaction.donorName,
          transaction.donorEmail ?? "",
          transaction.amountCents,
          transaction.feeCents,
          transaction.netAmountCents,
          transaction.refundedAmountCents,
          transaction.currency,
          transaction.category,
          transaction.fundId ?? "",
          transaction.status,
          transaction.reconciliationStatus,
          transaction.payoutId ?? "",
          transaction.availableOn ?? "",
          transaction.disputeId ?? "",
          transaction.disputeStatus,
          transaction.disputedAmountCents,
          transaction.givenAt,
          transaction.provider,
          transaction.providerTransactionId ?? ""
        ]
          .map(csvCell)
          .join(",")
      )
    ].join("\n");
  }
}

export type GivingServiceOptions = {
  checkoutSuccessUrl?: string;
  checkoutCancelUrl?: string;
};

function givingFundCodeConflict(code: string) {
  return appError({
    code: "giving_fund_code_conflict",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Giving fund code already exists.",
    recoverable: true,
    retryable: false,
    evidence: { code },
    nextAction: "choose_another_code"
  });
}

function checkoutFailureCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "unknown";
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "unknown";
}
