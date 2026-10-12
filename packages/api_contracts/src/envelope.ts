import { z } from "zod";

export const paginationMetaSchema = z.object({
  limit: z.number().int().positive(),
  nextCursor: z.string().nullable()
});

export const responseMetaSchema = z
  .object({
    pagination: paginationMetaSchema.optional()
  })
  .catchall(z.unknown());

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    category: z.string().optional(),
    sourceLayer: z
      .enum([
        "surface",
        "feature",
        "domain",
        "capability",
        "repository",
        "external",
        "unknown"
      ])
      .optional(),
    message: z.string(),
    recoverable: z.boolean().optional(),
    retryable: z.boolean().optional(),
    evidence: z.record(z.unknown()).optional(),
    nextAction: z.string().optional(),
    details: z.record(z.unknown()).optional()
  }),
  requestId: z.string().optional()
});

export const deletedResponseSchema = z.object({
  deleted: z.boolean()
});

export function apiEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: responseMetaSchema.default({})
  });
}

export type ApiEnvelope<T> = {
  data: T;
  meta: z.infer<typeof responseMetaSchema>;
};

export type ApiErrorEnvelope = z.infer<typeof apiErrorSchema>;
