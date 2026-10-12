import type {
  PaymentProviderEvent,
  PaymentProviderEventListQuery
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  PaymentProviderEventInput,
  PaymentProviderEventUpdateInput
} from "./giving.repository.js";
import { providerEventKey } from "./giving_calculations.js";

type InMemoryProviderEvent = PaymentProviderEventInput & {
  id: string;
  status: "received" | "processed" | "ignored" | "failed";
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export class InMemoryGivingProviderEvents {
  private providerEvents = new Map<string, InMemoryProviderEvent>();

  async record(input: PaymentProviderEventInput) {
    const key = providerEventKey(input.provider, input.providerEventId);
    const existing = this.providerEvents.get(key);
    if (existing) {
      return { duplicate: true, status: existing.status };
    }
    this.providerEvents.set(key, {
      id: randomUUID(),
      ...input,
      status: "received",
      errorMessage: null,
      receivedAt: new Date().toISOString(),
      processedAt: null
    });
    return { duplicate: false };
  }

  async mark(
    provider: string,
    providerEventId: string,
    input: PaymentProviderEventUpdateInput
  ): Promise<void> {
    const key = providerEventKey(provider, providerEventId);
    const existing = this.providerEvents.get(key);
    if (existing) {
      this.providerEvents.set(key, {
        ...existing,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        processedAt: new Date().toISOString()
      });
    }
  }

  async list(
    query: PaymentProviderEventListQuery
  ): Promise<PaymentProviderEvent[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.providerEvents.values()]
      .filter((event) => {
        if (query.provider && event.provider !== query.provider) {
          return false;
        }
        if (query.status && event.status !== query.status) {
          return false;
        }
        if (normalizedQuery) {
          return [
            event.provider,
            event.providerEventId,
            event.eventType,
            event.status,
            event.errorMessage ?? ""
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, query.limit)
      .map((event) => ({
        id: event.id,
        provider: event.provider,
        providerEventId: event.providerEventId,
        eventType: event.eventType,
        status: event.status,
        errorMessage: event.errorMessage,
        receivedAt: event.receivedAt,
        processedAt: event.processedAt
      }));
  }
}
