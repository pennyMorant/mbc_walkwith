import type {
  GivingTransaction,
  GivingTransactionStatus
} from "@mbc/api-contracts";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { givingTransactions } from "../../shared/db/schema.js";
import type { GivingTransactionStatusUpdateInput } from "./giving.repository.js";
import { canApplyGivingStatusUpdate } from "./giving_calculations.js";
import { transactionFromRow } from "./postgres_giving_mappers.js";
import { financeUpdateSet } from "./postgres_giving_updates.js";

const transactionStatuses = [
  "pending",
  "succeeded",
  "failed",
  "refunded"
] as const satisfies readonly GivingTransactionStatus[];

export class PostgresGivingTransactionStatusUpdates {
  constructor(private readonly db: AppDb) {}

  byId(
    provider: string,
    id: string,
    input: GivingTransactionStatusUpdateInput
  ) {
    return this.update(
      and(
        eq(givingTransactions.provider, provider),
        eq(givingTransactions.id, id)
      )!,
      input
    );
  }

  byCheckoutSessionId(
    provider: string,
    checkoutSessionId: string,
    input: GivingTransactionStatusUpdateInput
  ) {
    return this.update(
      and(
        eq(givingTransactions.provider, provider),
        eq(givingTransactions.providerCheckoutSessionId, checkoutSessionId)
      )!,
      input
    );
  }

  byProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionStatusUpdateInput
  ) {
    return this.update(
      and(
        eq(givingTransactions.provider, provider),
        eq(givingTransactions.providerTransactionId, providerTransactionId)
      )!,
      input
    );
  }

  private async update(
    locator: SQL,
    input: GivingTransactionStatusUpdateInput
  ): Promise<GivingTransaction | null> {
    const allowedStatuses = transactionStatuses.filter((status) =>
      canApplyGivingStatusUpdate(status, input.status)
    );
    const [row] = await this.db
      .update(givingTransactions)
      .set({
        status: input.status,
        ...(input.providerCheckoutSessionId !== undefined
          ? { providerCheckoutSessionId: input.providerCheckoutSessionId }
          : {}),
        ...(input.providerTransactionId !== undefined
          ? { providerTransactionId: input.providerTransactionId }
          : {}),
        ...(input.donorEmail !== undefined
          ? { donorEmail: input.donorEmail }
          : {}),
        ...(input.donorName !== undefined ? { donorName: input.donorName } : {}),
        ...(input.givenAt ? { givenAt: input.givenAt } : {}),
        ...financeUpdateSet(input),
        ...(input.metadata
          ? {
              metadata: sql`${givingTransactions.metadata} || ${JSON.stringify(
                input.metadata
              )}::jsonb`
            }
          : {})
      })
      .where(
        and(locator, inArray(givingTransactions.status, allowedStatuses))
      )
      .returning();
    if (row) {
      return transactionFromRow(row);
    }
    const [current] = await this.db
      .select()
      .from(givingTransactions)
      .where(locator)
      .limit(1);
    return current ? transactionFromRow(current) : null;
  }
}
