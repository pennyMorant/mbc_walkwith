import {
  givingFundListQuerySchema,
  givingFundUpdateRequestSchema,
  givingFundUpsertRequestSchema,
  givingStatementGenerateRequestSchema,
  givingStatementListQuerySchema,
  givingReconciliationQuerySchema,
  givingTransactionListQuerySchema,
  paymentProviderEventListQuerySchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../../shared/http/api-response.js";
import { appError } from "../../../shared/http/app-error.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { GivingService } from "../../giving/giving.service.js";
import {
  fundParamsSchema,
  statementParamsSchema,
  transactionParamsSchema,
  yearParamsSchema
} from "./admin_giving_route_schemas.js";

type AdminPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminGivingRoutes(
  app: FastifyInstance,
  service: GivingService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/giving/funds",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const query = givingFundListQuerySchema.parse(request.query);
      const funds = await service.listFunds(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.funds.list",
        resourceType: "giving_fund",
        resourceId: "list",
        afterJson: {
          query,
          count: funds.length
        }
      });
      return ok({ items: funds });
    }
  );

  app.post(
    "/v1/admin/giving/funds",
    { preHandler: permissionPreHandler("giving:manage") },
    async (request) => {
      const body = givingFundUpsertRequestSchema.parse(request.body);
      const fund = await service.createFund(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.fund.create",
        resourceType: "giving_fund",
        resourceId: fund.id,
        afterJson: fund
      });
      return ok(fund);
    }
  );

  app.patch(
    "/v1/admin/giving/funds/:fundId",
    { preHandler: permissionPreHandler("giving:manage") },
    async (request) => {
      const params = fundParamsSchema.parse(request.params);
      const body = givingFundUpdateRequestSchema.parse(request.body);
      const result = await service.updateFund(params.fundId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.fund.update",
        resourceType: "giving_fund",
        resourceId: result.fund.id,
        beforeJson: result.before,
        afterJson: result.fund
      });
      return ok(result.fund);
    }
  );

  app.get(
    "/v1/admin/giving/provider-events",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const query = paymentProviderEventListQuerySchema.parse(request.query);
      const events = await service.listProviderEvents(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.provider_events.list",
        resourceType: "payment_provider_event",
        resourceId: "list",
        afterJson: {
          query,
          count: events.length
        }
      });
      return ok({ items: events });
    }
  );

  app.get(
    "/v1/admin/giving/reconciliation",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const query = givingReconciliationQuerySchema.parse(request.query);
      const summary = await service.summarizeReconciliation(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.reconciliation.view",
        resourceType: "giving_reconciliation",
        resourceId: `${summary.provider ?? "all"}:${summary.year}`,
        afterJson: {
          query,
          summary
        }
      });
      return ok(summary);
    }
  );

  app.get(
    "/v1/admin/giving/transactions",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const query = givingTransactionListQuerySchema.parse(request.query);
      const response = await service.listTransactions(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.transactions.list",
        resourceType: "giving_transaction",
        resourceId: "list",
        afterJson: {
          query,
          count: response.items.length,
          summary: response.summary
        }
      });
      return ok(response);
    }
  );

  app.get(
    "/v1/admin/giving/transactions/:transactionId",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const params = transactionParamsSchema.parse(request.params);
      const transaction = await service.getTransactionById(
        params.transactionId
      );
      if (!transaction) {
        throw appError({
          code: "giving_transaction_not_found",
          category: "not_found",
          sourceLayer: "feature",
          statusCode: 404,
          message: "Giving transaction not found.",
          recoverable: true,
          retryable: false,
          evidence: { transactionId: params.transactionId },
          nextAction: "refresh"
        });
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.transaction.view",
        resourceType: "giving_transaction",
        resourceId: transaction.id,
        afterJson: {
          amountCents: transaction.amountCents,
          currency: transaction.currency,
          category: transaction.category,
          status: transaction.status,
          givenAt: transaction.givenAt
        }
      });
      return ok(transaction);
    }
  );

  app.get(
    "/v1/admin/giving/statements",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const query = givingStatementListQuerySchema.parse(request.query);
      const statements = await service.listStatements(query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.statements.list",
        resourceType: "giving_statement",
        resourceId: "list",
        afterJson: {
          query,
          count: statements.length
        }
      });
      return ok({ items: statements });
    }
  );

  app.get(
    "/v1/admin/giving/statements/:statementId",
    { preHandler: permissionPreHandler("giving:read") },
    async (request) => {
      const params = statementParamsSchema.parse(request.params);
      const statement = await service.getStatementById(params.statementId);
      if (!statement) {
        throw appError({
          code: "statement_not_ready",
          category: "not_found",
          sourceLayer: "feature",
          statusCode: 404,
          message: "Giving statement is not ready.",
          recoverable: true,
          retryable: false,
          evidence: { statementId: params.statementId },
          nextAction: "refresh"
        });
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.statement.view",
        resourceType: "giving_statement",
        resourceId: statement.id,
        afterJson: {
          taxYear: statement.taxYear,
          totalAmountCents: statement.totalAmountCents,
          status: statement.status,
          hasPdfObjectKey: Boolean(statement.pdfObjectKey)
        }
      });
      return ok(statement);
    }
  );

  app.get(
    "/v1/admin/giving/statements/:statementId/download",
    { preHandler: permissionPreHandler("giving:export") },
    async (request) => {
      const params = statementParamsSchema.parse(request.params);
      const result = await service.exportStatementById(params.statementId);
      if (!result) {
        throw appError({
          code: "statement_not_ready",
          category: "not_found",
          sourceLayer: "feature",
          statusCode: 404,
          message: "Giving statement is not ready.",
          recoverable: true,
          retryable: false,
          evidence: { statementId: params.statementId },
          nextAction: "refresh"
        });
      }
      const filename = `giving-statement-${result.statement.taxYear}-${result.statement.id}.csv`;
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.statement.download",
        resourceType: "giving_statement",
        resourceId: result.statement.id,
        afterJson: {
          taxYear: result.statement.taxYear,
          donorName: result.statement.donorName,
          hasDonorEmail: Boolean(result.statement.donorEmail),
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

  app.post(
    "/v1/admin/giving/statements/:year/generate",
    { preHandler: permissionPreHandler("giving:export") },
    async (request) => {
      const params = yearParamsSchema.parse(request.params);
      const body = givingStatementGenerateRequestSchema.parse(request.body);
      const statement = await service.generateStatement(params.year, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.statement.generate",
        resourceType: "giving_statement",
        resourceId: statement.id,
        afterJson: {
          taxYear: statement.taxYear,
          totalAmountCents: statement.totalAmountCents,
          status: statement.status,
          userId: statement.userId,
          hasDonorEmail: Boolean(statement.donorEmail)
        }
      });
      return ok(statement);
    }
  );

  app.get(
    "/v1/admin/giving/export",
    { preHandler: permissionPreHandler("giving:export") },
    async (request) => {
      const query = givingTransactionListQuerySchema.parse(request.query);
      const csv = await service.exportTransactionsCsv({
        ...query,
        limit: query.limit ?? 200
      });
      const filename = `giving-${query.year ?? "all"}.csv`;
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "giving.transactions.export",
        resourceType: "giving_transaction",
        resourceId: "export",
        afterJson: {
          query,
          filename,
          byteLength: Buffer.byteLength(csv, "utf8")
        }
      });
      return ok({
        filename,
        contentType: "text/csv",
        csv
      });
    }
  );
}
