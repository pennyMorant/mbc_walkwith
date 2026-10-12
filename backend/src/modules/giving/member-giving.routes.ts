import {
  givingCheckoutSessionRequestSchema,
  memberGivingStatementListQuerySchema,
  memberGivingTransactionListQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import { appError } from "../../shared/http/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import type { GivingService } from "./giving.service.js";

export async function registerMemberGivingRoutes(
  app: FastifyInstance,
  service: GivingService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  app.get(
    "/v1/member/giving/funds",
    { preHandler: requireMember(memberAuthService) },
    async () => ok({ items: await service.listActiveFunds() })
  );

  app.post(
    "/v1/member/giving/checkout-sessions",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const body = givingCheckoutSessionRequestSchema.parse(request.body);
      return ok(await service.createCheckoutSession(request.member!.id, body));
    }
  );

  app.get(
    "/v1/member/giving/transactions",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const query = memberGivingTransactionListQuerySchema.parse(request.query);
      const response = await service.listMemberTransactions(
        request.member!.id,
        query
      );
      return ok(response);
    }
  );

  app.get(
    "/v1/member/giving/statements",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const query = memberGivingStatementListQuerySchema.parse(request.query);
      const statements = await service.listMemberStatements(
        request.member!.id,
        query
      );
      return ok({ items: statements });
    }
  );

  app.get(
    "/v1/member/giving/statements/:year",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const params = yearParamsSchema.parse(request.params);
      const statement = await service.getMemberStatementByYear(
        request.member!.id,
        params.year
      );
      if (!statement) {
        throw appError({
          code: "statement_not_ready",
          category: "not_found",
          sourceLayer: "feature",
          statusCode: 404,
          message: "Giving statement is not ready.",
          recoverable: true,
          retryable: false,
          evidence: { year: params.year },
          nextAction: "refresh"
        });
      }
      return ok(statement);
    }
  );

  app.get(
    "/v1/member/giving/statements/:year/download",
    { preHandler: requireMember(memberAuthService) },
    async (request) => {
      const params = yearParamsSchema.parse(request.params);
      const result = await service.exportMemberStatementCsv(
        request.member!.id,
        params.year
      );
      if (!result) {
        throw appError({
          code: "statement_not_ready",
          category: "not_found",
          sourceLayer: "feature",
          statusCode: 404,
          message: "Giving statement is not ready.",
          recoverable: true,
          retryable: false,
          evidence: { year: params.year },
          nextAction: "refresh"
        });
      }
      const filename = `giving-statement-${params.year}.csv`;
      await auditService.record({
        actorUserId: request.member!.id,
        action: "giving.statement.download",
        resourceType: "giving_statement",
        resourceId: result.statement.id,
        afterJson: {
          actorType: "member",
          taxYear: result.statement.taxYear,
          filename,
          byteLength: Buffer.byteLength(result.csv, "utf8")
        }
      });
      return ok({
        filename,
        contentType: "text/csv",
        csv: result.csv,
        pdfBase64: result.pdfBase64
      });
    }
  );
}

export async function registerStripeGivingWebhookRoutes(
  app: FastifyInstance,
  service: GivingService
) {
  await app.register(async (stripeWebhookApp) => {
    stripeWebhookApp.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_request, body, done) => done(null, body)
    );
    stripeWebhookApp.post("/v1/webhooks/giving/stripe", async (request) => {
      const payload = rawBuffer(request);
      const signature = headerValue(request.headers["stripe-signature"]);
      return ok(await service.handleStripeWebhook(payload, signature));
    });
  });
}

const yearParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100)
});

function rawBuffer(request: FastifyRequest) {
  if (!Buffer.isBuffer(request.body)) {
    throw appError({
      code: "provider_event_unhandled",
      category: "validation_error",
      sourceLayer: "external",
      statusCode: 400,
      message: "Stripe webhook body must be raw JSON.",
      recoverable: false,
      retryable: false,
      nextAction: "check_provider_payload",
      evidence: { provider: "stripe" }
    });
  }
  return request.body;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
