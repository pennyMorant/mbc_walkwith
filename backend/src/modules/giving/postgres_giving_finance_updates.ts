import type { GivingTransaction } from "@mbc/api-contracts";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { givingTransactions } from "../../shared/db/schema.js";
import type { GivingTransactionFinanceUpdateInput } from "./giving.repository.js";
import { transactionFromRow } from "./postgres_giving_mappers.js";
import { financeUpdateSet } from "./postgres_giving_updates.js";

export class PostgresGivingFinanceUpdates {
  constructor(private readonly db: AppDb) {}

  async byProviderTransactionId(
    provider: string,
    providerTransactionId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction | null> {
    const [row] = await this.db
      .update(givingTransactions)
      .set({
        ...financeUpdateSet(input),
        ...(input.providerChargeId
          ? { providerChargeId: input.providerChargeId }
          : {}),
        ...metadataMergeSet(input.metadata)
      })
      .where(
        and(
          eq(givingTransactions.provider, provider),
          eq(givingTransactions.providerTransactionId, providerTransactionId)
        )
      )
      .returning();
    return row ? transactionFromRow(row) : null;
  }

  async byProviderChargeIds(
    provider: string,
    providerChargeIds: string[],
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]> {
    if (providerChargeIds.length === 0) {
      return [];
    }
    const rows = await this.db
      .update(givingTransactions)
      .set({
        ...financeUpdateSet(input),
        ...metadataMergeSet(input.metadata)
      })
      .where(
        and(
          eq(givingTransactions.provider, provider),
          inArray(givingTransactions.providerChargeId, providerChargeIds)
        )
      )
      .returning();
    return rows.map(transactionFromRow);
  }

  async byPayoutId(
    provider: string,
    payoutId: string,
    input: GivingTransactionFinanceUpdateInput
  ): Promise<GivingTransaction[]> {
    const rows = await this.db
      .update(givingTransactions)
      .set({
        ...financeUpdateSet(input),
        ...metadataMergeSet(input.metadata)
      })
      .where(
        and(
          eq(givingTransactions.provider, provider),
          eq(givingTransactions.payoutId, payoutId)
        )
      )
      .returning();
    return rows.map(transactionFromRow);
  }
}

function metadataMergeSet(metadata: Record<string, unknown> | undefined) {
  return metadata
    ? {
        metadata: sql`${givingTransactions.metadata} || ${JSON.stringify(
          metadata
        )}::jsonb`
      }
    : {};
}
