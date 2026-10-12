import type {
  PaymentProviderEvent,
  PaymentProviderEventListQuery
} from "@mbc/api-contracts";
import { and, desc, eq } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { paymentProviderEvents } from "../../shared/db/schema.js";
import type {
  PaymentProviderEventInput,
  PaymentProviderEventUpdateInput
} from "./giving.repository.js";
import { paymentProviderEventFromRow } from "./postgres_giving_mappers.js";
import { providerEventWhere } from "./postgres_giving_queries.js";

export class PostgresGivingProviderEvents {
  constructor(private readonly db: AppDb) {}

  async record(input: PaymentProviderEventInput) {
    const inserted = await this.db
      .insert(paymentProviderEvents)
      .values({
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        payload: input.payload,
        status: "received"
      })
      .onConflictDoNothing({
        target: [
          paymentProviderEvents.provider,
          paymentProviderEvents.providerEventId
        ]
      })
      .returning({ id: paymentProviderEvents.id });
    if (inserted.length > 0) {
      return { duplicate: false };
    }
    const [existing] = await this.db
      .select({ status: paymentProviderEvents.status })
      .from(paymentProviderEvents)
      .where(
        and(
          eq(paymentProviderEvents.provider, input.provider),
          eq(paymentProviderEvents.providerEventId, input.providerEventId)
        )
      );
    if (!existing) {
      return { duplicate: true };
    }
    return { duplicate: true, status: existing.status };
  }

  async mark(
    provider: string,
    providerEventId: string,
    input: PaymentProviderEventUpdateInput
  ): Promise<void> {
    await this.db
      .update(paymentProviderEvents)
      .set({
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        processedAt: new Date()
      })
      .where(
        and(
          eq(paymentProviderEvents.provider, provider),
          eq(paymentProviderEvents.providerEventId, providerEventId)
        )
      );
  }

  async list(
    query: PaymentProviderEventListQuery
  ): Promise<PaymentProviderEvent[]> {
    const rows = await this.db
      .select()
      .from(paymentProviderEvents)
      .where(providerEventWhere(query))
      .orderBy(desc(paymentProviderEvents.receivedAt))
      .limit(query.limit);
    return rows.map(paymentProviderEventFromRow);
  }
}
