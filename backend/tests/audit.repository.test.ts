import { auditLogListResponseSchema } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemoryAuditRepository } from "../src/modules/audit/in-memory-audit.repository.js";
import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("InMemoryAuditRepository", () => {
  it("paginates deterministically when audit logs share a timestamp", async () => {
    const repository = new InMemoryAuditRepository();
    const createdAt = "2026-10-27T12:00:00.000Z";
    repository.logs.push(
      createAuditLog("00000000-0000-4000-8000-000000000001", createdAt),
      createAuditLog("00000000-0000-4000-8000-000000000003", createdAt),
      createAuditLog("00000000-0000-4000-8000-000000000002", createdAt)
    );

    const firstPage = await repository.list({ limit: 2 });

    expect(firstPage.logs.map((log) => log.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
      "00000000-0000-4000-8000-000000000002"
    ]);
    expect(firstPage.nextCursor).not.toBeNull();

    const filteredPage = await repository.list({
      action: "MEMBER.LIST",
      limit: 10
    });
    expect(filteredPage.logs).toHaveLength(3);

    const secondPage = await repository.list({
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined
    });

    expect(secondPage.logs.map((log) => log.id)).toEqual([
      "00000000-0000-4000-8000-000000000001"
    ]);
    expect(secondPage.nextCursor).toBeNull();
  });

  it("returns the repository cursor through the admin route", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const headers = { authorization: `Bearer ${accessToken}` };

    for (let index = 0; index < 3; index += 1) {
      const response = await app.inject({
        method: "GET",
        url: "/v1/admin/members?limit=10",
        headers
      });
      expect(response.statusCode).toBe(200);
    }

    const firstResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?action=member.list&resourceType=member&resourceId=list&limit=2",
      headers
    });
    expect(firstResponse.statusCode).toBe(200);
    const firstPage = expectResponseData(
      firstResponse,
      auditLogListResponseSchema,
      "audit first page"
    );
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toEqual(expect.any(String));

    const secondResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=member.list&resourceType=member&resourceId=list&limit=2&cursor=${encodeURIComponent(firstPage.nextCursor ?? "")}`,
      headers
    });
    expect(secondResponse.statusCode).toBe(200);
    const secondPage = expectResponseData(
      secondResponse,
      auditLogListResponseSchema,
      "audit second page"
    );
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[1]?.id);

    await harness.close();
  });
});

function createAuditLog(id: string, createdAt: string) {
  return {
    id,
    actorUserId: null,
    action: "member.list",
    resourceType: "member",
    resourceId: "list",
    beforeJson: null,
    afterJson: null,
    createdAt
  };
}
