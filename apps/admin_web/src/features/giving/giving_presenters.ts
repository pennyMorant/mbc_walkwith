import type { GivingFund } from "@mbc/api-contracts";

export function formatGivingCurrency(
  amountCents: number | undefined,
  currency: string,
  locale: string
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format((amountCents ?? 0) / 100);
}

export function formatGivingDateTime(
  value: string | null | undefined,
  locale: string
) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function givingFundFilterItems(funds: GivingFund[], allTitle: string) {
  return [
    { title: allTitle, value: "" },
    ...funds.map((fund) => ({ title: fund.name, value: fund.id }))
  ];
}

export function givingFundName(
  funds: GivingFund[],
  fundId: string | null,
  notSet: string
) {
  if (!fundId) {
    return notSet;
  }
  return funds.find((fund) => fund.id === fundId)?.name ?? fundId;
}

export function givingFundProgress(fund: GivingFund) {
  if (!fund.targetAmountCents || fund.targetAmountCents <= 0) {
    return null;
  }
  return Math.min(100, (fund.totalAmountCents / fund.targetAmountCents) * 100);
}
