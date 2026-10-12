import { z } from "zod";

export const givingTransactionStatusSchema = z.enum([
  "pending",
  "succeeded",
  "failed",
  "refunded"
]);
export const givingReconciliationStatusSchema = z.enum([
  "unreconciled",
  "reconciled",
  "needs_review"
]);
export const givingDisputeStatusSchema = z.enum([
  "none",
  "warning",
  "open",
  "won",
  "lost",
  "closed"
]);
export const givingStatementStatusSchema = z.enum([
  "pending",
  "ready",
  "sent",
  "failed"
]);
export const givingFundStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "archived"
]);
export const paymentProviderEventStatusSchema = z.enum([
  "received",
  "processed",
  "ignored",
  "failed"
]);

export const givingTransactionSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().default(null),
  donorName: z.string().default(""),
  donorEmail: z.string().nullable().default(null),
  provider: z.string(),
  providerTransactionId: z.string().nullable().default(null),
  providerCheckoutSessionId: z.string().nullable().default(null),
  amountCents: z.number().int(),
  feeCents: z.number().int().default(0),
  netAmountCents: z.number().int().default(0),
  refundedAmountCents: z.number().int().default(0),
  currency: z.string().default("USD"),
  category: z.string(),
  fundId: z.string().nullable().default(null),
  status: givingTransactionStatusSchema,
  reconciliationStatus: givingReconciliationStatusSchema.default("unreconciled"),
  payoutId: z.string().nullable().default(null),
  availableOn: z.string().nullable().default(null),
  disputeId: z.string().nullable().default(null),
  disputeStatus: givingDisputeStatusSchema.default("none"),
  disputedAmountCents: z.number().int().default(0),
  givenAt: z.string(),
  createdAt: z.string()
});

export const givingCheckoutSessionRequestSchema = z.object({
  amountCents: z.number().int().min(100).max(10000000),
  currency: z.string().trim().length(3).default("USD"),
  category: z.string().trim().min(1).max(80).default("offering"),
  fundId: z.string().trim().min(1).optional(),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().trim().email().optional()
}).strict();

export const givingCheckoutSessionResponseSchema = z.object({
  provider: z.literal("stripe"),
  checkoutSessionId: z.string(),
  checkoutUrl: z.string().url(),
  transactionId: z.string()
});

export const givingStatementSchema = z.object({
  id: z.string(),
  userId: z.string().nullable().default(null),
  donorName: z.string().default(""),
  donorEmail: z.string().nullable().default(null),
  taxYear: z.number().int(),
  totalAmountCents: z.number().int(),
  currency: z.string().default("USD"),
  status: givingStatementStatusSchema,
  pdfObjectKey: z.string().nullable().default(null),
  downloadUrl: z.string().nullable().default(null),
  generatedAt: z.string().nullable().default(null),
  updatedAt: z.string()
});

export const paymentProviderEventSchema = z.object({
  id: z.string(),
  provider: z.string(),
  providerEventId: z.string(),
  eventType: z.string(),
  status: paymentProviderEventStatusSchema,
  errorMessage: z.string().nullable().default(null),
  receivedAt: z.string(),
  processedAt: z.string().nullable().default(null)
});

export const givingFundSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().default(""),
  status: givingFundStatusSchema,
  targetAmountCents: z.number().int().nullable().default(null),
  displayOrder: z.number().int().default(0),
  totalAmountCents: z.number().int().default(0),
  transactionCount: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const givingSummarySchema = z.object({
  year: z.number().int(),
  totalAmountCents: z.number().int(),
  totalFeeCents: z.number().int().default(0),
  totalNetAmountCents: z.number().int().default(0),
  refundedAmountCents: z.number().int().default(0),
  disputedAmountCents: z.number().int().default(0),
  transactionCount: z.number().int(),
  donorCount: z.number().int(),
  currency: z.string(),
  byCategory: z.array(
    z.object({
      category: z.string(),
      amountCents: z.number().int(),
      count: z.number().int()
    })
  )
});

export const givingTransactionListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: givingTransactionStatusSchema.optional(),
  category: z.string().optional(),
  fundId: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const memberGivingTransactionListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: givingTransactionStatusSchema.optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const givingStatementListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: givingStatementStatusSchema.optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const paymentProviderEventListQuerySchema = z.object({
  provider: z.string().trim().optional(),
  status: paymentProviderEventStatusSchema.optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const givingReconciliationQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  provider: z.string().trim().optional(),
  status: givingReconciliationStatusSchema.optional(),
  fundId: z.string().optional()
});

export const givingFundListQuerySchema = z.object({
  status: givingFundStatusSchema.optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export const givingFundCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/);

export const givingFundUpsertRequestSchema = z
  .object({
    code: givingFundCodeSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).default(""),
    status: givingFundStatusSchema.default("draft"),
    targetAmountCents: z
      .number()
      .int()
      .nonnegative()
      .max(2_147_483_647)
      .nullable()
      .default(null),
    displayOrder: z
      .number()
      .int()
      .min(-2_147_483_648)
      .max(2_147_483_647)
      .default(0)
  })
  .strict();

export const givingFundUpdateRequestSchema = givingFundUpsertRequestSchema
  .omit({ code: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one giving fund field is required."
  });

export const memberGivingStatementListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: givingStatementStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const givingStatementGenerateRequestSchema = z.object({
  userId: z.string().nullable().optional(),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().trim().email().nullable().optional()
});

export const givingTransactionListResponseSchema = z.object({
  items: z.array(givingTransactionSchema),
  summary: givingSummarySchema
});

export const givingStatementListResponseSchema = z.object({
  items: z.array(givingStatementSchema)
});

export const paymentProviderEventListResponseSchema = z.object({
  items: z.array(paymentProviderEventSchema)
});

export const givingFundListResponseSchema = z.object({
  items: z.array(givingFundSchema)
});

export const givingReconciliationResponseSchema = z.object({
  year: z.number().int(),
  provider: z.string().nullable().default(null),
  currency: z.string(),
  grossAmountCents: z.number().int(),
  feeCents: z.number().int(),
  netAmountCents: z.number().int(),
  refundedAmountCents: z.number().int(),
  disputedAmountCents: z.number().int(),
  transactionCount: z.number().int(),
  unreconciledCount: z.number().int(),
  needsReviewCount: z.number().int(),
  disputeCount: z.number().int(),
  payoutCount: z.number().int()
});

export const givingExportResponseSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  csv: z.string(),
  pdfBase64: z.string().optional()
});

export const givingWebhookAckResponseSchema = z.object({
  handled: z.boolean(),
  duplicate: z.boolean().optional(),
  pending: z.boolean().optional()
});

export type GivingTransactionStatus = z.infer<
  typeof givingTransactionStatusSchema
>;
export type GivingReconciliationStatus = z.infer<
  typeof givingReconciliationStatusSchema
>;
export type GivingDisputeStatus = z.infer<typeof givingDisputeStatusSchema>;
export type GivingStatementStatus = z.infer<
  typeof givingStatementStatusSchema
>;
export type GivingFundStatus = z.infer<typeof givingFundStatusSchema>;
export type PaymentProviderEventStatus = z.infer<
  typeof paymentProviderEventStatusSchema
>;
export type GivingTransaction = z.infer<typeof givingTransactionSchema>;
export type GivingFund = z.infer<typeof givingFundSchema>;
export type GivingCheckoutSessionRequest = z.infer<
  typeof givingCheckoutSessionRequestSchema
>;
export type GivingCheckoutSessionResponse = z.infer<
  typeof givingCheckoutSessionResponseSchema
>;
export type GivingStatement = z.infer<typeof givingStatementSchema>;
export type PaymentProviderEvent = z.infer<
  typeof paymentProviderEventSchema
>;
export type GivingSummary = z.infer<typeof givingSummarySchema>;
export type GivingTransactionListQuery = z.infer<
  typeof givingTransactionListQuerySchema
>;
export type MemberGivingTransactionListQuery = z.infer<
  typeof memberGivingTransactionListQuerySchema
>;
export type GivingStatementListQuery = z.infer<
  typeof givingStatementListQuerySchema
>;
export type PaymentProviderEventListQuery = z.infer<
  typeof paymentProviderEventListQuerySchema
>;
export type GivingReconciliationQuery = z.infer<
  typeof givingReconciliationQuerySchema
>;
export type GivingFundListQuery = z.infer<typeof givingFundListQuerySchema>;
export type GivingFundUpsertRequest = z.infer<
  typeof givingFundUpsertRequestSchema
>;
export type GivingFundUpdateRequest = z.infer<
  typeof givingFundUpdateRequestSchema
>;
export type GivingReconciliationResponse = z.infer<
  typeof givingReconciliationResponseSchema
>;
export type MemberGivingStatementListQuery = z.infer<
  typeof memberGivingStatementListQuerySchema
>;
export type GivingStatementGenerateRequest = z.infer<
  typeof givingStatementGenerateRequestSchema
>;
export type GivingTransactionListResponse = z.infer<
  typeof givingTransactionListResponseSchema
>;
export type GivingStatementListResponse = z.infer<
  typeof givingStatementListResponseSchema
>;
export type PaymentProviderEventListResponse = z.infer<
  typeof paymentProviderEventListResponseSchema
>;
export type GivingFundListResponse = z.infer<
  typeof givingFundListResponseSchema
>;
export type GivingExportResponse = z.infer<typeof givingExportResponseSchema>;
export type GivingWebhookAckResponse = z.infer<
  typeof givingWebhookAckResponseSchema
>;
