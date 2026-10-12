import { z } from "zod";

export const transactionParamsSchema = z.object({
  transactionId: z.string()
});

export const fundParamsSchema = z.object({
  fundId: z.string()
});

export const yearParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

export const statementParamsSchema = z.object({
  statementId: z.string().uuid()
});
