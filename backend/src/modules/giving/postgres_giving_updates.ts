import type {
  GivingTransactionFinanceUpdateInput,
  GivingTransactionStatusUpdateInput
} from "./giving.repository.js";

export function financeUpdateSet(
  input: GivingTransactionStatusUpdateInput | GivingTransactionFinanceUpdateInput
) {
  return {
    ...(input.feeCents !== undefined ? { feeCents: input.feeCents } : {}),
    ...(input.netAmountCents !== undefined
      ? { netAmountCents: input.netAmountCents }
      : {}),
    ...(input.refundedAmountCents !== undefined
      ? { refundedAmountCents: input.refundedAmountCents }
      : {}),
    ...(input.reconciliationStatus !== undefined
      ? { reconciliationStatus: input.reconciliationStatus }
      : {}),
    ...(input.payoutId !== undefined ? { payoutId: input.payoutId } : {}),
    ...(input.availableOn !== undefined
      ? { availableOn: input.availableOn }
      : {}),
    ...(input.disputeId !== undefined ? { disputeId: input.disputeId } : {}),
    ...(input.disputeStatus !== undefined
      ? { disputeStatus: input.disputeStatus }
      : {}),
    ...(input.disputedAmountCents !== undefined
      ? { disputedAmountCents: input.disputedAmountCents }
      : {})
  };
}
