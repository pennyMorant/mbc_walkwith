import {
  auditLogListResponseSchema,
  newcomerFollowUpListResponseSchema,
  newcomerFollowUpSchema,
  newcomerProfileListResponseSchema,
  newcomerProfileSchema,
  newcomerSubmissionSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("newcomer follow-up routes", () => {
  it("accepts public newcomer submissions and keeps follow-up notes admin-only", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/newcomers",
      headers: {
        "x-external-user-id": "ext_installation_1"
      },
      payload: {
        externalUserId: "ext_installation_1",
        displayName: "New Friend",
        email: "new.friend@example.com",
        phone: "626-555-0100",
        preferredLanguage: "zh-Hans",
        source: "app",
        interest: "Please contact me about Sunday worship."
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const newcomer = expectResponseData(
      createResponse,
      newcomerSubmissionSchema,
      "newcomer create"
    );
    expect(newcomer).toMatchObject({
      displayName: "New Friend",
      status: "new"
    });
    expect(createResponse.json().data).not.toHaveProperty("email");
    expect(createResponse.json().data).not.toHaveProperty("phone");
    expect(createResponse.json().data).not.toHaveProperty("interest");
    expect(createResponse.json().data).not.toHaveProperty("externalUserId");

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/newcomers?limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const list = expectResponseData(
      listResponse,
      newcomerProfileListResponseSchema,
      "admin newcomer list"
    );
    expect(list.items.map((item) => item.id)).toContain(newcomer.id);

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/newcomers/${newcomer.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "assigned",
        assigneeName: "Pastor Lee",
        nextFollowUpAt: "2026-07-12T18:00:00.000Z"
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updated = expectResponseData(
      updateResponse,
      newcomerProfileSchema,
      "admin newcomer update"
    );
    expect(updated).toMatchObject({
      id: newcomer.id,
      status: "assigned",
      assigneeName: "Pastor Lee",
      nextFollowUpAt: "2026-07-12T18:00:00.000Z"
    });

    const followUpResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/newcomers/${newcomer.id}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        note: "Called and invited them to lunch after service.",
        status: "completed"
      }
    });
    expect(followUpResponse.statusCode).toBe(200);
    const followUp = expectResponseData(
      followUpResponse,
      newcomerFollowUpSchema,
      "admin newcomer follow-up create"
    );
    expect(followUp).toMatchObject({
      newcomerId: newcomer.id,
      status: "completed",
      note: "Called and invited them to lunch after service."
    });

    const followUpsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/newcomers/${newcomer.id}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(followUpsResponse.statusCode).toBe(200);
    const followUps = expectResponseData(
      followUpsResponse,
      newcomerFollowUpListResponseSchema,
      "admin newcomer follow-up list"
    );
    expect(followUps.items[0]?.id).toBe(followUp.id);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=newcomer_follow_up&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "newcomer follow-up audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      newcomerId: newcomer.id,
      status: "completed",
      hasNote: true
    });
    expect(JSON.stringify(auditResponse.json())).not.toContain(
      "Called and invited"
    );

    const submissionAuditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=newcomer&resourceId=${newcomer.id}&limit=20`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(submissionAuditResponse.statusCode).toBe(200);
    expect(JSON.stringify(submissionAuditResponse.json())).not.toContain(
      "Please contact me"
    );

    await harness.close();
  });

  it("requires a usable contact method or installation identity", async () => {
    const harness = await buildTestApp();
    try {
      const { accessToken: adminToken } = await login(harness.app);
      const missingIdentityResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/newcomers",
        payload: {
          displayName: "Unreachable New Friend"
        }
      });
      expect(missingIdentityResponse.statusCode).toBe(400);

      const conflictingIdentityResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/newcomers",
        headers: {
          "x-external-user-id": "ext_installation_header"
        },
        payload: {
          externalUserId: "ext_installation_body",
          displayName: "Conflicting Identity",
          email: "conflicting@example.com"
        }
      });
      expect(conflictingIdentityResponse.statusCode).toBe(400);
      expect(conflictingIdentityResponse.json().error).toMatchObject({
        code: "newcomer_external_identity_conflict"
      });

      const headerIdentityResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/newcomers",
        headers: {
          "x-external-user-id": "ext_installation_header"
        },
        payload: {
          displayName: "Header Identity",
          interest: "Please contact me about a Sunday visit."
        }
      });
      expect(headerIdentityResponse.statusCode).toBe(200);
      const newcomer = expectResponseData(
        headerIdentityResponse,
        newcomerSubmissionSchema,
        "header identity newcomer create"
      );
      const adminResponse = await harness.app.inject({
        method: "GET",
        url: `/v1/admin/newcomers/${newcomer.id}`,
        headers: { authorization: `Bearer ${adminToken}` }
      });
      const adminNewcomer = expectResponseData(
        adminResponse,
        newcomerProfileSchema,
        "header identity admin newcomer"
      );
      expect(adminNewcomer.externalUserId).toBe("ext_installation_header");
    } finally {
      await harness.close();
    }
  });

  it("rejects empty updates and inconsistent follow-up lifecycle values", async () => {
    const harness = await buildTestApp();
    try {
      const { accessToken: adminToken } = await login(harness.app);
      const createResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/newcomers",
        headers: { "x-external-user-id": "ext_lifecycle_test" },
        payload: { displayName: "Lifecycle Test" }
      });
      const newcomer = expectResponseData(
        createResponse,
        newcomerSubmissionSchema,
        "newcomer lifecycle create"
      );

      const emptyUpdate = await harness.app.inject({
        method: "PATCH",
        url: `/v1/admin/newcomers/${newcomer.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {}
      });
      expect(emptyUpdate.statusCode).toBe(400);

      const missingPlan = await harness.app.inject({
        method: "POST",
        url: `/v1/admin/newcomers/${newcomer.id}/follow-ups`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { note: "Plan a call", status: "planned" }
      });
      expect(missingPlan.statusCode).toBe(400);
      expect(missingPlan.json().error).toMatchObject({
        code: "newcomer_followup_invalid"
      });

      const inconsistentCompletion = await harness.app.inject({
        method: "POST",
        url: `/v1/admin/newcomers/${newcomer.id}/follow-ups`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          note: "Cancelled call",
          status: "cancelled",
          plannedAt: "2026-07-14T18:00:00.000Z",
          completedAt: "2026-07-13T18:00:00.000Z"
        }
      });
      expect(inconsistentCompletion.statusCode).toBe(400);
      expect(inconsistentCompletion.json().error).toMatchObject({
        code: "newcomer_followup_invalid"
      });
    } finally {
      await harness.close();
    }
  });
});
