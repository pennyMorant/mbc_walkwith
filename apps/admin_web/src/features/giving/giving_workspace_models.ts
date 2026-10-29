import {
  givingFundCodeSchema,
  givingFundUpsertRequestSchema,
  type GivingFund,
  type GivingFundStatus,
  type GivingFundUpdateRequest,
  type GivingFundUpsertRequest,
  type GivingReconciliationStatus,
  type GivingStatementStatus,
  type GivingTransactionStatus,
  type PaymentProviderEventStatus
} from "@mbc/api-contracts";

export type GivingTransactionFilterForm = {
  year: number;
  status: GivingTransactionStatus | "";
  category: string;
  fundId: string;
  query: string;
};

export type GivingStatementFilterForm = {
  year: number;
  status: GivingStatementStatus | "";
  query: string;
};

export type GivingProviderEventFilterForm = {
  provider: string;
  status: PaymentProviderEventStatus | "";
  query: string;
};

export type GivingFundFilterForm = {
  status: GivingFundStatus | "";
  query: string;
};

export type GivingReconciliationFilterForm = {
  year: number;
  provider: string;
  status: GivingReconciliationStatus | "";
  fundId: string;
};

export function createGivingTransactionFilters(
  year: number
): GivingTransactionFilterForm {
  return { year, status: "", category: "", fundId: "", query: "" };
}

export function createGivingStatementFilters(
  year: number
): GivingStatementFilterForm {
  return { year, status: "", query: "" };
}

export function createGivingProviderEventFilters(): GivingProviderEventFilterForm {
  return { provider: "stripe", status: "", query: "" };
}

export function createGivingFundFilters(): GivingFundFilterForm {
  return { status: "", query: "" };
}

export function createGivingReconciliationFilters(
  year: number
): GivingReconciliationFilterForm {
  return { year, provider: "stripe", status: "", fundId: "" };
}

export function givingFilterSnapshot<T extends Record<string, unknown>>(
  form: T
): Readonly<T> {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value
    ])
  ) as T;
}

export function sameGivingFilters(
  first: Record<string, unknown>,
  second: Record<string, unknown>
) {
  const keys = Object.keys(first);
  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => first[key] === second[key])
  );
}

export function resetGivingFilters<T extends object>(form: T, defaults: T) {
  Object.assign(form, defaults);
}

export type GivingFundForm = {
  code: string;
  name: string;
  description: string;
  status: GivingFund["status"];
  targetAmountDollars: string;
  sort: number;
};

export function createGivingFundForm(): GivingFundForm {
  return {
    code: "",
    name: "",
    description: "",
    status: "draft",
    targetAmountDollars: "",
    sort: 0
  };
}

export function fillGivingFundForm(form: GivingFundForm, fund: GivingFund) {
  form.code = fund.code;
  form.name = fund.name;
  form.description = fund.description;
  form.status = fund.status;
  form.targetAmountDollars =
    fund.targetAmountCents == null
      ? ""
      : (fund.targetAmountCents / 100).toFixed(2);
  form.sort = fund.sort;
}

export function resetGivingFundForm(form: GivingFundForm) {
  Object.assign(form, createGivingFundForm());
}

export function isGivingFundCodeValid(code: string) {
  return givingFundCodeSchema.safeParse(code).success;
}

export function isGivingFundFormValid(form: GivingFundForm) {
  const target = parseTargetAmountCents(form.targetAmountDollars);
  if (!target.valid) {
    return false;
  }
  return givingFundUpsertRequestSchema.safeParse({
    code: form.code,
    name: form.name,
    description: form.description,
    status: form.status,
    targetAmountCents: target.value,
    sort: normalizeInteger(form.sort)
  }).success;
}

export function givingFundCreatePayload(
  form: GivingFundForm
): GivingFundUpsertRequest {
  const target = requireTargetAmount(form.targetAmountDollars);
  return givingFundUpsertRequestSchema.parse({
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    targetAmountCents: target,
    sort: normalizeInteger(form.sort)
  });
}

export function givingFundUpdatePayload(
  form: GivingFundForm
): GivingFundUpdateRequest {
  const createPayload = givingFundCreatePayload(form);
  return {
    name: createPayload.name,
    description: createPayload.description,
    status: createPayload.status,
    targetAmountCents: createPayload.targetAmountCents,
    sort: createPayload.sort
  };
}

export function parseTargetAmountCents(value: string): {
  valid: boolean;
  value: number | null;
} {
  const clean = value.trim();
  if (!clean) {
    return { valid: true, value: null };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(clean)) {
    return { valid: false, value: null };
  }
  const [whole, fraction = ""] = clean.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > 2_147_483_647) {
    return { valid: false, value: null };
  }
  return { valid: true, value: cents };
}

function requireTargetAmount(value: string) {
  const target = parseTargetAmountCents(value);
  if (!target.valid) {
    throw new Error("Invalid giving fund target amount.");
  }
  return target.value;
}

function normalizeInteger(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}
