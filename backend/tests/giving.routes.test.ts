import {
  auditLogListResponseSchema,
  givingExportResponseSchema,
  givingReconciliationResponseSchema,
  givingStatementListResponseSchema,
  givingStatementSchema,
  givingTransactionListResponseSchema,
  givingTransactionSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import {
  buildTestApp,
  login,
  loginMember,
  testConfig
} from "./route_test_harness.js";

describe("giving routes", () => {
  it("reports giving transactions and generates annual statements", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const transactionsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/transactions?year=2026&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(transactionsResponse.statusCode).toBe(200);
    const transactions = expectResponseData(
      transactionsResponse,
      givingTransactionListResponseSchema,
      "admin giving transactions"
    );
    expect(transactions.summary.totalAmountCents).toBe(17500);
    expect(
      transactions.items.map((transaction: { id: string }) => transaction.id)
    ).toContain("giving-2026-offering-1");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/transactions/giving-2026-offering-1",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(detailResponse.statusCode).toBe(200);
    const detail = expectResponseData(
      detailResponse,
      givingTransactionSchema,
      "admin giving transaction detail"
    );
    expect(detail.amountCents).toBe(5000);

    const fundReconciliationResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/reconciliation?year=2026&fundId=fund-offering",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(fundReconciliationResponse.statusCode).toBe(200);
    const fundReconciliation = expectResponseData(
      fundReconciliationResponse,
      givingReconciliationResponseSchema,
      "admin giving fund reconciliation"
    );
    expect(fundReconciliation.grossAmountCents).toBe(7500);
    expect(fundReconciliation.refundedAmountCents).toBe(2500);
    expect(fundReconciliation.transactionCount).toBe(2);

    const statementResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/giving/statements/2026/generate",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        userId: "member-lee",
        donorName: "李恩典",
        donorEmail: "grace@example.com"
      }
    });
    expect(statementResponse.statusCode).toBe(200);
    const statement = expectResponseData(
      statementResponse,
      givingStatementSchema,
      "admin giving statement generate"
    );
    expect(statement.status).toBe("ready");
    expect(statement.totalAmountCents).toBe(5000);

    const statementsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/statements?year=2026",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statementsResponse.statusCode).toBe(200);
    const statements = expectResponseData(
      statementsResponse,
      givingStatementListResponseSchema,
      "admin giving statements"
    );
    expect(
      statements.items.map((statementItem: { id: string }) => statementItem.id)
    ).toContain(statement.id);

    const statementDownloadResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/giving/statements/${statement.id}/download`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statementDownloadResponse.statusCode).toBe(200);
    const statementDownload = expectResponseData(
      statementDownloadResponse,
      givingExportResponseSchema,
      "admin giving statement download"
    );
    expect(statementDownload.filename).toBe(
      `giving-statement-2026-${statement.id}.csv`
    );
    expect(statementDownload.csv).toContain("statementId");
    expect(statementDownload.csv).toContain("giving-2026-offering-1");
    expect(statementDownload.pdfBase64).toBeTypeOf("string");
    expect(
      Buffer.from(statementDownload.pdfBase64 ?? "", "base64").toString(
        "utf8",
        0,
        8
      )
    ).toBe("%PDF-1.4");

    const exportResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/export?year=2026",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(exportResponse.statusCode).toBe(200);
    const exportData = expectResponseData(
      exportResponse,
      givingExportResponseSchema,
      "admin giving export"
    );
    expect(exportData.filename).toBe("giving-2026.csv");
    expect(exportData.csv).toContain("giving-2026-offering-1");

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=giving_statement&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "admin giving statement audit"
    );
    const downloadAudit = audit.items.find(
      (item) => item.action === "giving.statement.download"
    );
    expect(downloadAudit?.afterJson).toMatchObject({
      donorName: "李恩典",
      byteLength: Buffer.byteLength(statementDownload.csv, "utf8")
    });
    expect(Buffer.byteLength(statementDownload.csv, "utf8")).toBeGreaterThan(
      statementDownload.csv.length
    );
    await harness.close();
  });

  it("generates all-donor statements only when confirmed gifts exist", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const allDonorsResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/giving/statements/2026/generate",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {}
    });
    expect(allDonorsResponse.statusCode).toBe(200);
    const allDonorsStatement = expectResponseData(
      allDonorsResponse,
      givingStatementSchema,
      "admin all-donor giving statement generate"
    );
    expect(allDonorsStatement.donorName).toBe("All donors");
    expect(allDonorsStatement.totalAmountCents).toBe(17500);

    const emptyYearResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/giving/statements/2099/generate",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {}
    });
    expect(emptyYearResponse.statusCode).toBe(409);
    expect(emptyYearResponse.json().error).toMatchObject({
      code: "statement_no_confirmed_gifts",
      category: "state_conflict",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "select_year_with_confirmed_gifts",
      evidence: {
        requestId: expect.any(String),
        year: 2099,
        userId: null,
        donorEmail: null,
        donorName: "All donors"
      }
    });

    await harness.close();
  });

  it("shows signed-in members only their own giving records and statements", async () => {
    const harness = await buildTestApp({
      debugMemberEmail: "grace@example.com",
      debugMemberDisplayName: "Grace Lee"
    });
    const { app } = harness;
    const accessToken = testConfig.debugMemberAccessToken;

    const transactionsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?year=2026&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(transactionsResponse.statusCode).toBe(200);
    const transactions = expectResponseData(
      transactionsResponse,
      givingTransactionListResponseSchema,
      "member giving transactions"
    );
    expect(transactions.summary.totalAmountCents).toBe(5000);
    const transactionIds = transactions.items.map(
      (transaction: { id: string }) => transaction.id
    );
    expect(transactionIds).toContain("giving-2026-offering-1");
    expect(transactionIds).toContain("giving-2026-refund-1");
    expect(transactionIds).not.toContain("giving-2026-missions-1");

    const statementsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/statements?year=2025",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statementsResponse.statusCode).toBe(200);
    const statements = expectResponseData(
      statementsResponse,
      givingStatementListResponseSchema,
      "member giving statements"
    );
    expect(statements.items[0]?.id).toBe("statement-2025-lee");

    const statementResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/statements/2025",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statementResponse.statusCode).toBe(200);
    const statement = expectResponseData(
      statementResponse,
      givingStatementSchema,
      "member giving statement"
    );
    expect(statement.userId).toBe("member-lee");

    const statementDownloadResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/statements/2025/download",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(statementDownloadResponse.statusCode).toBe(200);
    const statementDownload = expectResponseData(
      statementDownloadResponse,
      givingExportResponseSchema,
      "member giving statement download"
    );
    expect(statementDownload.csv).toContain("giving-2025-offering-1");
    expect(statementDownload.csv).not.toContain("giving-2026-missions-1");

    const { accessToken: adminAccessToken } = await login(app);
    const downloadAuditResponse = await app.inject({
      method: "GET",
      url:
        "/v1/admin/audit-logs?action=giving.statement.download" +
        "&resourceType=giving_statement&resourceId=statement-2025-lee&limit=20",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(downloadAuditResponse.statusCode).toBe(200);
    const downloadAudit = expectResponseData(
      downloadAuditResponse,
      auditLogListResponseSchema,
      "member giving statement download audit"
    );
    expect(downloadAudit.items).toHaveLength(1);
    expect(downloadAudit.items[0]).toMatchObject({
      actorUserId: "member-lee",
      action: "giving.statement.download",
      resourceType: "giving_statement",
      resourceId: "statement-2025-lee",
      beforeJson: null,
      afterJson: {
        actorType: "member",
        taxYear: 2025,
        filename: "giving-statement-2025.csv",
        byteLength: Buffer.byteLength(statementDownload.csv, "utf8")
      }
    });
    expect(JSON.stringify(downloadAudit)).not.toContain("grace@example.com");
    expect(JSON.stringify(downloadAudit)).not.toContain("pdfBase64");
    expect(JSON.stringify(downloadAudit)).not.toContain("giving-2025-offering-1");

    const missingStatementResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/statements/2099/download",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(missingStatementResponse.statusCode).toBe(404);
    expect(missingStatementResponse.json().error).toMatchObject({
      code: "statement_not_ready",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        requestId: expect.any(String),
        year: 2099
      }
    });

    const auditAfterMissingResponse = await app.inject({
      method: "GET",
      url:
        "/v1/admin/audit-logs?action=giving.statement.download" +
        "&resourceType=giving_statement&limit=20",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    const auditAfterMissing = expectResponseData(
      auditAfterMissingResponse,
      auditLogListResponseSchema,
      "member missing giving statement download audit"
    );
    expect(auditAfterMissing.items).toHaveLength(1);

    const unauthenticatedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions"
    });
    expect(unauthenticatedResponse.statusCode).toBe(401);
    await harness.close();
  });

});
