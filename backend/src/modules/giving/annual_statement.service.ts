import type {
  GivingStatement,
  GivingStatementGenerateRequest
} from "@mbc/api-contracts";

import { appError } from "../../shared/http/app-error.js";
import {
  buildAnnualStatementPdfBase64,
  buildStatementCsv
} from "./annual-statement-export.js";
import type {
  GivingRepository,
  GivingStatementTransactionQuery
} from "./giving.repository.js";
import { statementNoConfirmedGiftsError } from "./giving_errors.js";

export class AnnualStatementService {
  constructor(private readonly repository: GivingRepository) {}

  async generate(year: number, input: GivingStatementGenerateRequest) {
    const query = statementQuery(year, input);
    const transactions =
      await this.repository.listConfirmedTransactionsForStatement(query);
    if (transactions.length === 0) {
      throw statementNoConfirmedGiftsError(year, query);
    }
    const currency = singleCurrency(transactions.map((item) => item.currency));
    return this.repository.createStatement({
      ...query,
      totalAmountCents: transactions.reduce(
        (total, transaction) => total + transaction.amountCents,
        0
      ),
      currency,
      status: "ready",
      pdfObjectKey: null,
      generatedAt: new Date()
    });
  }

  async exportById(statementId: string) {
    const statement = await this.repository.getStatementById(statementId);
    return statement ? this.exportReadyStatement(statement) : null;
  }

  async exportForMember(userId: string, year: number) {
    const statement = await this.repository.getStatementForUserByYear(
      userId,
      year
    );
    return statement ? this.exportReadyStatement(statement) : null;
  }

  private async exportReadyStatement(statement: GivingStatement) {
    if (statement.status !== "ready" && statement.status !== "sent") {
      return null;
    }
    const transactions =
      await this.repository.listConfirmedTransactionsForStatement({
        year: statement.taxYear,
        userId: statement.userId,
        donorName: statement.donorName,
        donorEmail: statement.donorEmail
      });
    if (transactions.length === 0) {
      throw statementStale(statement);
    }
    const total = transactions.reduce(
      (sum, transaction) => sum + transaction.amountCents,
      0
    );
    const currency = singleCurrency(transactions.map((item) => item.currency));
    if (
      total !== statement.totalAmountCents ||
      currency !== statement.currency
    ) {
      throw statementStale(statement);
    }
    return {
      statement,
      csv: buildStatementCsv(statement, transactions),
      pdfBase64: buildAnnualStatementPdfBase64(statement, transactions)
    };
  }
}

function statementStale(statement: GivingStatement) {
  return appError({
    code: "statement_stale",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "Giving records changed after this statement was generated.",
    recoverable: true,
    retryable: false,
    evidence: { statementId: statement.id, taxYear: statement.taxYear },
    nextAction: "regenerate_statement"
  });
}

function statementQuery(
  year: number,
  input: GivingStatementGenerateRequest
): GivingStatementTransactionQuery {
  return {
    year,
    userId: input.userId ?? null,
    donorName: input.donorName ?? "All donors",
    donorEmail: input.donorEmail ?? null
  };
}

function singleCurrency(currencies: string[]) {
  const values = new Set(currencies.map((currency) => currency.toUpperCase()));
  if (values.size === 1) {
    return [...values][0]!;
  }
  throw appError({
    code: "statement_currency_mismatch",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "A giving statement cannot combine multiple currencies.",
    recoverable: true,
    retryable: false,
    evidence: { currencies: [...values].sort() },
    nextAction: "review_giving_records"
  });
}
