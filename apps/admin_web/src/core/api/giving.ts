import {
  givingExportResponseSchema,
  givingFundListResponseSchema,
  givingFundSchema,
  givingFundUpdateRequestSchema,
  givingFundUpsertRequestSchema,
  givingReconciliationResponseSchema,
  givingStatementGenerateRequestSchema,
  givingStatementListResponseSchema,
  givingStatementSchema,
  givingTransactionListResponseSchema,
  paymentProviderEventListResponseSchema,
  type GivingExportResponse,
  type GivingFund,
  type GivingFundListQuery,
  type GivingFundUpdateRequest,
  type GivingFundUpsertRequest,
  type GivingReconciliationQuery,
  type GivingReconciliationResponse,
  type GivingStatement,
  type GivingStatementListQuery,
  type GivingStatementGenerateRequest,
  type GivingTransactionListQuery,
  type GivingTransactionListResponse,
  type PaymentProviderEvent,
  type PaymentProviderEventListQuery
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type GivingTransactionFilters = QueryWithSelectAll<
  GivingTransactionListQuery,
  "status"
>;

export type GivingFundFilters = QueryWithSelectAll<
  GivingFundListQuery,
  "status"
>;

export type GivingStatementFilters = QueryWithSelectAll<
  GivingStatementListQuery,
  "status"
>;

export type PaymentProviderEventFilters = QueryWithSelectAll<
  PaymentProviderEventListQuery,
  "status"
>;

export type GivingReconciliationFilters = QueryWithSelectAll<
  GivingReconciliationQuery,
  "status"
>;

export async function listGivingTransactions(
  filters: GivingTransactionFilters = {}
): Promise<GivingTransactionListResponse> {
  return apiClient.getData(
    `/admin/giving/transactions?${transactionParams(filters).toString()}`,
    givingTransactionListResponseSchema
  );
}

export async function listGivingFunds(
  filters: GivingFundFilters = {}
): Promise<GivingFund[]> {
  const params = new URLSearchParams();
  appendParam(params, "status", filters.status);
  appendParam(params, "query", filters.query);
  params.set("limit", String(filters.limit ?? 50));
  return (
    await apiClient.getData(
      `/admin/giving/funds?${params.toString()}`,
      givingFundListResponseSchema
    )
  ).items;
}

export async function createGivingFund(
  input: GivingFundUpsertRequest
): Promise<GivingFund> {
  const payload = givingFundUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/giving/funds", payload, givingFundSchema);
}

export async function updateGivingFund(
  fundId: string,
  input: GivingFundUpdateRequest
): Promise<GivingFund> {
  const payload = givingFundUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/giving/funds/${pathSegment(fundId)}`,
    payload,
    givingFundSchema
  );
}

export async function listGivingStatements(
  filters: GivingStatementFilters = {}
): Promise<GivingStatement[]> {
  const params = new URLSearchParams();
  if (filters.year) {
    params.set("year", String(filters.year));
  }
  appendParam(params, "status", filters.status);
  appendParam(params, "query", filters.query);
  params.set("limit", String(filters.limit ?? 50));
  return (
    await apiClient.getData(
      `/admin/giving/statements?${params.toString()}`,
      givingStatementListResponseSchema
    )
  ).items;
}

export async function listPaymentProviderEvents(
  filters: PaymentProviderEventFilters = {}
): Promise<PaymentProviderEvent[]> {
  const params = new URLSearchParams();
  appendParam(params, "provider", filters.provider);
  appendParam(params, "status", filters.status);
  appendParam(params, "query", filters.query);
  params.set("limit", String(filters.limit ?? 50));
  return (
    await apiClient.getData(
      `/admin/giving/provider-events?${params.toString()}`,
      paymentProviderEventListResponseSchema
    )
  ).items;
}

export async function getGivingReconciliation(
  filters: GivingReconciliationFilters = {}
): Promise<GivingReconciliationResponse> {
  const params = new URLSearchParams();
  if (filters.year) {
    params.set("year", String(filters.year));
  }
  appendParam(params, "provider", filters.provider);
  appendParam(params, "status", filters.status);
  appendParam(params, "fundId", filters.fundId);
  return apiClient.getData(
    `/admin/giving/reconciliation?${params.toString()}`,
    givingReconciliationResponseSchema
  );
}

export async function generateGivingStatement(
  year: number,
  input: GivingStatementGenerateRequest
): Promise<GivingStatement> {
  const payload = givingStatementGenerateRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/giving/statements/${pathSegment(year)}/generate`,
    payload,
    givingStatementSchema
  );
}

export async function downloadGivingStatement(
  statementId: string
): Promise<GivingExportResponse> {
  return apiClient.getData(
    `/admin/giving/statements/${pathSegment(statementId)}/download`,
    givingExportResponseSchema
  );
}

export async function exportGivingTransactions(
  filters: GivingTransactionFilters = {}
): Promise<GivingExportResponse> {
  return apiClient.getData(
    `/admin/giving/export?${transactionParams(filters).toString()}`,
    givingExportResponseSchema
  );
}

function transactionParams(filters: GivingTransactionFilters) {
  const params = new URLSearchParams();
  if (filters.year) {
    params.set("year", String(filters.year));
  }
  appendParam(params, "status", filters.status);
  appendParam(params, "category", filters.category);
  appendParam(params, "fundId", filters.fundId);
  appendParam(params, "query", filters.query);
  params.set("limit", String(filters.limit ?? 50));
  return params;
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
