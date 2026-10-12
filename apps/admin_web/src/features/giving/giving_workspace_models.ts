import {
  givingFundCodeSchema,
  givingFundUpsertRequestSchema,
  type GivingFund,
  type GivingFundUpdateRequest,
  type GivingFundUpsertRequest
} from "@mbc/api-contracts";

export type GivingFundForm = {
  code: string;
  name: string;
  description: string;
  status: GivingFund["status"];
  targetAmountDollars: string;
  displayOrder: number;
};

export function createGivingFundForm(): GivingFundForm {
  return {
    code: "",
    name: "",
    description: "",
    status: "draft",
    targetAmountDollars: "",
    displayOrder: 0
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
  form.displayOrder = fund.displayOrder;
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
    displayOrder: normalizeInteger(form.displayOrder)
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
    displayOrder: normalizeInteger(form.displayOrder)
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
    displayOrder: createPayload.displayOrder
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
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}
