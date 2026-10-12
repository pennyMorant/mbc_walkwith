import type { AppConfig } from "../../config/env.js";
import { appError } from "../../shared/http/app-error.js";

type StripeBalanceTransaction = {
  id: string;
  grossAmountCents: number;
  currency: string;
  feeCents: number;
  netAmountCents: number;
  availableOn: Date | null;
};

export class StripeGivingFinanceClient {
  constructor(private readonly config: AppConfig) {}

  async retrieveBalanceTransaction(
    balanceTransactionId: string
  ): Promise<StripeBalanceTransaction> {
    const data = await this.request(
      `/v1/balance_transactions/${encodeURIComponent(balanceTransactionId)}`
    );
    const id = requireString(data, "id");
    if (id !== balanceTransactionId) {
      throw invalidStripeFinanceResponse("id");
    }
    return {
      id,
      grossAmountCents: requireNumber(data, "amount"),
      currency: requireString(data, "currency").toUpperCase(),
      feeCents: requireNumber(data, "fee"),
      netAmountCents: requireNumber(data, "net"),
      availableOn: timestampDate(optionalNumber(data, "available_on"))
    };
  }

  async listPayoutChargeIds(payoutId: string): Promise<string[]> {
    const chargeIds = new Set<string>();
    let startingAfter: string | null = null;
    do {
      const query = new URLSearchParams({ payout: payoutId, limit: "100" });
      if (startingAfter) {
        query.set("starting_after", startingAfter);
      }
      const page = await this.request(`/v1/balance_transactions?${query}`);
      const items = Array.isArray(page.data) ? page.data : null;
      if (!items) {
        throw invalidStripeFinanceResponse("data");
      }
      for (const item of items) {
        if (!isRecord(item)) {
          throw invalidStripeFinanceResponse("data[]");
        }
        const source = optionalString(item, "source");
        if (source && optionalString(item, "type") === "charge") {
          chargeIds.add(source);
        }
      }
      if (page.has_more !== true) {
        break;
      }
      const last = items.at(-1);
      if (!isRecord(last)) {
        throw invalidStripeFinanceResponse("data[-1]");
      }
      startingAfter = requireString(last, "id");
    } while (startingAfter);
    return [...chargeIds];
  }

  private async request(path: string): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await fetch(
        `${this.config.stripeApiBaseUrl.replace(/\/$/, "")}${path}`,
        {
          headers: {
            authorization: `Bearer ${this.config.stripeSecretKey}`
          }
        }
      );
    } catch {
      throw stripeUnavailable(path, "Stripe finance request failed.");
    }
    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      throw invalidStripeFinanceResponse("response");
    }
    if (!response.ok) {
      throw stripeUnavailable(
        path,
        optionalString(asRecord(data.error), "message") ??
          "Stripe finance data is unavailable."
      );
    }
    return data;
  }
}

function stripeUnavailable(path: string, message: string) {
  return appError({
    code: "payment_provider_unavailable",
    category: "external_dependency_failed",
    sourceLayer: "capability",
    statusCode: 502,
    message,
    recoverable: true,
    retryable: true,
    evidence: { provider: "stripe", path },
    nextAction: "retry"
  });
}

function invalidStripeFinanceResponse(field: string) {
  return appError({
    code: "provider_finance_unavailable",
    category: "external_dependency_failed",
    sourceLayer: "capability",
    statusCode: 502,
    message: "Stripe finance response is incomplete.",
    recoverable: true,
    retryable: true,
    evidence: { provider: "stripe", field },
    nextAction: "retry"
  });
}

function requireString(input: Record<string, unknown>, field: string) {
  const value = optionalString(input, field);
  if (!value) {
    throw invalidStripeFinanceResponse(field);
  }
  return value;
}

function requireNumber(input: Record<string, unknown>, field: string) {
  const value = optionalNumber(input, field);
  if (value === null) {
    throw invalidStripeFinanceResponse(field);
  }
  return value;
}

function optionalString(input: Record<string, unknown>, field: string) {
  const value = input[field];
  return typeof value === "string" ? value : null;
}

function optionalNumber(input: Record<string, unknown>, field: string) {
  const value = input[field];
  return typeof value === "number" ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function timestampDate(value: number | null) {
  return value === null ? null : new Date(value * 1000);
}
