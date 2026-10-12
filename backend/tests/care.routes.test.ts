import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  adminLoginResponseSchema,
  adminUserSchema,
  auditLogListResponseSchema,
  careAssigneeListResponseSchema,
  careFollowUpListResponseSchema,
  careFollowUpSchema,
  careRequestAdminListResponseSchema,
  careRequestAdminSchema,
  careRequestSummaryListResponseSchema,
  careRequestSummarySchema,
  memberAuthRegisterResponseSchema,
  memberAuthSessionSchema,
  type AdminRole
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import { expectResponseData } from "./contract_assertions.js";

describe("care routes", () => {
  it("keeps member care requests private while admins manage follow-up", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const adminSession = await loginAdmin(app);
    const adminToken = adminSession.accessToken;
    const member = await loginMember(app, {
      email: "care-member@example.com",
      displayName: "Care Member"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/me/care-requests",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        title: "Pastoral visit",
        body: "Please ask a pastor to call me this week.",
        privacyLevel: "pastoral_only"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const createdCareRequest = expectResponseData(
      createResponse,
      careRequestSummarySchema,
      "member care request create"
    );
    expect(createdCareRequest).toMatchObject({
      title: "Pastoral visit",
      status: "submitted",
      privacyLevel: "pastoral_only",
      version: 1,
      userId: member.memberId
    });
    const careRequestId = createdCareRequest.id;

    const mineResponse = await app.inject({
      method: "GET",
      url: "/v1/me/care-requests",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(mineResponse.statusCode).toBe(200);
    const mine = expectResponseData(
      mineResponse,
      careRequestSummaryListResponseSchema,
      "member care request list"
    );
    expect(mine.items[0]).toMatchObject({
      id: careRequestId,
      title: "Pastoral visit"
    });
    expect(JSON.stringify(mineResponse.json())).not.toContain("internalNote");
    expect(JSON.stringify(mineResponse.json())).not.toContain("followUps");

    const filteredMineResponse = await app.inject({
      method: "GET",
      url: "/v1/me/care-requests?status=resolved&limit=20",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(filteredMineResponse.statusCode).toBe(200);
    const filteredMine = expectResponseData(
      filteredMineResponse,
      careRequestSummaryListResponseSchema,
      "filtered member care request list"
    );
    expect(filteredMine.items).toEqual([]);

    const invalidMineQueryResponse = await app.inject({
      method: "GET",
      url: "/v1/me/care-requests?limit=0",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(invalidMineQueryResponse.statusCode).toBe(400);

    const secondCreateResponse = await app.inject({
      method: "POST",
      url: "/v1/me/care-requests",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        title: "Meal support",
        body: "Please help coordinate a meal this weekend.",
        privacyLevel: "pastoral_only"
      }
    });
    expect(secondCreateResponse.statusCode).toBe(200);
    const limitedMineResponse = await app.inject({
      method: "GET",
      url: "/v1/me/care-requests?limit=1",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(limitedMineResponse.statusCode).toBe(200);
    const limitedMine = expectResponseData(
      limitedMineResponse,
      careRequestSummaryListResponseSchema,
      "limited member care request list"
    );
    expect(limitedMine.items).toHaveLength(1);

    const assigneesResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-assignees",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(assigneesResponse.statusCode).toBe(200);
    const assignees = expectResponseData(
      assigneesResponse,
      careAssigneeListResponseSchema,
      "care assignee directory"
    );
    expect(assignees.items).toContainEqual({
      id: adminSession.user.id,
      name: adminSession.user.name
    });
    expect(JSON.stringify(assigneesResponse.json())).not.toContain(
      adminSession.user.email
    );

    const adminListResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-requests?query=Pastoral%20visit&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(adminListResponse.statusCode).toBe(200);
    const adminList = expectResponseData(
      adminListResponse,
      careRequestAdminListResponseSchema,
      "admin care request list"
    );
    expect(
      adminList.items.map((request: { id: string }) => request.id)
    ).toContain(careRequestId);

    const invalidAssigneeResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        assigneeAdminUserId: "not-an-admin-uuid"
      }
    });
    expect(invalidAssigneeResponse.statusCode).toBe(400);

    const missingAssigneeId = randomUUID();
    const missingAssigneeResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        assigneeAdminUserId: missingAssigneeId
      }
    });
    expect(missingAssigneeResponse.statusCode).toBe(400);
    expect(missingAssigneeResponse.json().error).toMatchObject({
      code: "care_assignee_invalid",
      sourceLayer: "domain",
      evidence: { assigneeAdminUserId: missingAssigneeId }
    });

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "assigned",
        assigneeAdminUserId: adminSession.user.id,
        nextFollowUpAt: "2026-07-10T18:00:00.000Z",
        internalNote: "Use only inside pastoral care team."
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updatedCareRequest = expectResponseData(
      updateResponse,
      careRequestAdminSchema,
      "admin care request update"
    );
    expect(updatedCareRequest).toMatchObject({
      id: careRequestId,
      status: "assigned",
      version: 2,
      assigneeAdminUserId: adminSession.user.id,
      assigneeName: adminSession.user.name,
      internalNote: "Use only inside pastoral care team."
    });

    const invalidPlannedFollowUpResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/care-requests/${careRequestId}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        note: "A plan without a date is not actionable.",
        status: "planned"
      }
    });
    expect(invalidPlannedFollowUpResponse.statusCode).toBe(400);

    const plannedFollowUpResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/care-requests/${careRequestId}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        note: "Plan a home visit next week.",
        status: "planned",
        plannedAt: "2026-07-12T18:00:00.000Z"
      }
    });
    expect(plannedFollowUpResponse.statusCode).toBe(200);
    const plannedFollowUp = expectResponseData(
      plannedFollowUpResponse,
      careFollowUpSchema,
      "admin care planned follow-up create"
    );
    expect(plannedFollowUp).toMatchObject({
      careRequestId,
      status: "planned",
      completedAt: null
    });

    const detailAfterPlannedResponse = await app.inject({
      method: "GET",
      url: `/v1/me/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(detailAfterPlannedResponse.statusCode).toBe(200);
    const detailAfterPlanned = expectResponseData(
      detailAfterPlannedResponse,
      careRequestSummarySchema,
      "member care request detail after planned follow-up"
    );
    expect(detailAfterPlanned.status).toBe("assigned");

    const followUpResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/care-requests/${careRequestId}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        note: "Called member and scheduled a visit.",
        status: "completed"
      }
    });
    expect(followUpResponse.statusCode).toBe(200);
    const followUp = expectResponseData(
      followUpResponse,
      careFollowUpSchema,
      "admin care follow-up create"
    );
    expect(followUp).toMatchObject({
      careRequestId,
      status: "completed",
      note: "Called member and scheduled a visit."
    });

    const followUpsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/care-requests/${careRequestId}/follow-ups`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(followUpsResponse.statusCode).toBe(200);
    const followUps = expectResponseData(
      followUpsResponse,
      careFollowUpListResponseSchema,
      "admin care follow-up list"
    );
    expect(followUps.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([plannedFollowUp.id, followUp.id])
    );

    const adminListAfterFollowUpResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-requests?query=Pastoral%20visit&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(adminListAfterFollowUpResponse.statusCode).toBe(200);
    const adminListAfterFollowUp = expectResponseData(
      adminListAfterFollowUpResponse,
      careRequestAdminListResponseSchema,
      "admin care request list after follow-up"
    );
    const listedCareRequest = adminListAfterFollowUp.items.find(
      (request) => request.id === careRequestId
    );
    expect(listedCareRequest?.followUps).toEqual([]);
    expect(JSON.stringify(adminListAfterFollowUpResponse.json())).not.toContain(
      "Called member and scheduled a visit."
    );

    const memberDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/me/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberDetailResponse.statusCode).toBe(200);
    const memberDetail = expectResponseData(
      memberDetailResponse,
      careRequestSummarySchema,
      "member care request detail"
    );
    expect(memberDetail).toMatchObject({
      id: careRequestId,
      status: "in_progress",
      version: 3,
      assigneeName: adminSession.user.name
    });
    expect(JSON.stringify(memberDetailResponse.json())).not.toContain(
      "internalNote"
    );
    expect(JSON.stringify(memberDetailResponse.json())).not.toContain(
      "Called member"
    );

    const otherMember = await loginMember(app, {
      email: "care-other@example.com",
      displayName: "Other Care Member"
    });
    const deniedResponse = await app.inject({
      method: "GET",
      url: `/v1/me/care-requests/${careRequestId}`,
      headers: {
        authorization: `Bearer ${otherMember.accessToken}`
      }
    });
    expect(deniedResponse.statusCode).toBe(403);
    expect(deniedResponse.json().error).toMatchObject({
      code: "care_privacy_denied",
      sourceLayer: "domain"
    });

    const requestAuditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=care_request&resourceId=${careRequestId}&limit=20`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(requestAuditResponse.statusCode).toBe(200);
    const requestAudit = expectResponseData(
      requestAuditResponse,
      auditLogListResponseSchema,
      "care request audit"
    );
    expect(
      requestAudit.items.map((log: { action: string }) => log.action)
    ).toEqual(
      expect.arrayContaining([
        "care.request.submit",
        "care.request.update",
        "care.request.follow_up_advance"
      ])
    );
    const updateAudit = requestAudit.items.find(
      (log: { action: string }) => log.action === "care.request.update"
    );
    expect(updateAudit?.beforeJson).toMatchObject({
      status: "submitted",
      version: 1,
      hasInternalNote: false
    });
    expect(updateAudit?.afterJson).toMatchObject({
      status: "assigned",
      version: 2,
      hasAssigneeName: true,
      nextFollowUpAt: "2026-07-10T18:00:00.000Z",
      hasInternalNote: true,
      internalNoteLength: "Use only inside pastoral care team.".length
    });
    const followUpAdvanceAudit = requestAudit.items.find(
      (log: { action: string }) =>
        log.action === "care.request.follow_up_advance"
    );
    expect(followUpAdvanceAudit?.beforeJson).toMatchObject({
      status: "assigned",
      version: 2
    });
    expect(followUpAdvanceAudit?.afterJson).toMatchObject({
      status: "in_progress",
      version: 3
    });
    expect(JSON.stringify(requestAuditResponse.json())).not.toContain(
      "Please ask a pastor"
    );
    expect(JSON.stringify(requestAuditResponse.json())).not.toContain(
      "Use only inside"
    );

    const requestListAuditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=care_request&resourceId=list&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(requestListAuditResponse.statusCode).toBe(200);
    const requestListAudit = expectResponseData(
      requestListAuditResponse,
      auditLogListResponseSchema,
      "care request list audit"
    );
    const searchedListAudit = requestListAudit.items.find(
      (log: { afterJson: unknown }) =>
        JSON.stringify(log.afterJson).includes('"hasQuery":true')
    );
    expect(searchedListAudit?.afterJson).toMatchObject({
      hasQuery: true,
      queryLength: "Pastoral visit".length,
      count: expect.any(Number)
    });
    expect(JSON.stringify(requestListAuditResponse.json())).not.toContain(
      "Pastoral visit"
    );

    const followUpListAuditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=care.follow_up.list&resourceType=care_request&resourceId=${careRequestId}&limit=20`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(followUpListAuditResponse.statusCode).toBe(200);
    const followUpListAudit = expectResponseData(
      followUpListAuditResponse,
      auditLogListResponseSchema,
      "care follow-up list audit"
    );
    expect(followUpListAudit.items[0]?.afterJson).toMatchObject({
      careRequestId,
      count: followUps.items.length
    });

    const followUpAuditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=care_follow_up&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(followUpAuditResponse.statusCode).toBe(200);
    const followUpAudit = expectResponseData(
      followUpAuditResponse,
      auditLogListResponseSchema,
      "care follow-up audit"
    );
    expect(followUpAudit.items[0]?.afterJson).toMatchObject({
      careRequestId,
      status: "completed",
      hasNote: true
    });
    expect(JSON.stringify(followUpAuditResponse.json())).not.toContain(
      "Called member"
    );

    await harness.close();
  });

  it("enforces admin care roles and privacy levels", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: ownerToken } = await loginAdmin(app);

    await createAdminUser(app, ownerToken, {
      email: "pastor-care@example.com",
      name: "Pastor Care",
      role: "pastor",
      password: "password123"
    });
    await createAdminUser(app, ownerToken, {
      email: "content-care@example.com",
      name: "Content Care",
      role: "content_editor",
      password: "password123"
    });

    const { accessToken: pastorToken } = await loginAdmin(app, {
      email: "pastor-care@example.com",
      password: "password123"
    });
    const { accessToken: contentEditorToken } = await loginAdmin(app, {
      email: "content-care@example.com",
      password: "password123"
    });
    const member = await loginMember(app, {
      email: "restricted-care-member@example.com",
      displayName: "Restricted Care Member"
    });

    const restrictedResponse = await app.inject({
      method: "POST",
      url: "/v1/me/care-requests",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        title: "Restricted concern",
        body: "Please keep this with administrators.",
        privacyLevel: "admin_restricted"
      }
    });
    expect(restrictedResponse.statusCode).toBe(200);
    const restrictedCareRequestId = expectResponseData(
      restrictedResponse,
      careRequestSummarySchema,
      "restricted care request create"
    ).id;

    const pastoralResponse = await app.inject({
      method: "POST",
      url: "/v1/me/care-requests",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        title: "Pastoral concern",
        body: "Please ask a pastor to follow up.",
        privacyLevel: "pastoral_only"
      }
    });
    expect(pastoralResponse.statusCode).toBe(200);
    const pastoralCareRequestId = expectResponseData(
      pastoralResponse,
      careRequestSummarySchema,
      "pastoral care request create"
    ).id;

    const contentEditorResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-requests?limit=20",
      headers: {
        authorization: `Bearer ${contentEditorToken}`
      }
    });
    expect(contentEditorResponse.statusCode).toBe(403);
    expect(contentEditorResponse.json().error).toMatchObject({
      code: "admin_permission_denied"
    });

    const pastorListResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-requests?limit=20",
      headers: {
        authorization: `Bearer ${pastorToken}`
      }
    });
    expect(pastorListResponse.statusCode).toBe(200);
    const pastorCareRequestIds = expectResponseData(
      pastorListResponse,
      careRequestAdminListResponseSchema,
      "pastor care request list"
    ).items.map((request: { id: string }) => request.id);
    expect(pastorCareRequestIds).toContain(pastoralCareRequestId);
    expect(pastorCareRequestIds).not.toContain(restrictedCareRequestId);

    const pastorAssigneesResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/care-assignees",
      headers: {
        authorization: `Bearer ${pastorToken}`
      }
    });
    expect(pastorAssigneesResponse.statusCode).toBe(200);
    const pastorAssignees = expectResponseData(
      pastorAssigneesResponse,
      careAssigneeListResponseSchema,
      "pastor care assignee directory"
    );
    expect(pastorAssignees.items.map((assignee) => assignee.name)).toContain(
      "Pastor Care"
    );
    expect(pastorAssignees.items.map((assignee) => assignee.name)).not.toContain(
      "Content Care"
    );

    const pastorFollowUpsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/care-requests/${restrictedCareRequestId}/follow-ups`,
      headers: {
        authorization: `Bearer ${pastorToken}`
      }
    });
    expect(pastorFollowUpsResponse.statusCode).toBe(403);
    expect(pastorFollowUpsResponse.json().error).toMatchObject({
      code: "care_privacy_denied",
      sourceLayer: "domain"
    });

    const pastorUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/care-requests/${restrictedCareRequestId}`,
      headers: {
        authorization: `Bearer ${pastorToken}`
      },
      payload: {
        status: "assigned"
      }
    });
    expect(pastorUpdateResponse.statusCode).toBe(403);
    expect(pastorUpdateResponse.json().error).toMatchObject({
      code: "care_privacy_denied",
      sourceLayer: "domain"
    });

    await harness.close();
  });
});

async function loginAdmin(
  app: Awaited<ReturnType<typeof buildApp>>,
  input = {
    email: testConfig.devAdminEmail,
    password: testConfig.devAdminPassword
  }
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/auth/login",
    payload: input
  });

  expect(response.statusCode).toBe(200);
  return expectResponseData(response, adminLoginResponseSchema, "admin login");
}

async function createAdminUser(
  app: Awaited<ReturnType<typeof buildApp>>,
  ownerToken: string,
  input: {
    email: string;
    name: string;
    role: AdminRole;
    password: string;
  }
) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/users",
    headers: {
      authorization: `Bearer ${ownerToken}`
    },
    payload: input
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(response, adminUserSchema, "admin user create");
}

async function loginMember(
  app: Awaited<ReturnType<typeof buildApp>>,
  input: { email: string; displayName: string; password?: string }
) {
  const password = input.password ?? "MemberPass123!";
  const registerResponse = await app.inject({
    method: "POST",
    url: "/v1/member/auth/register",
    payload: {
      email: input.email,
      displayName: input.displayName,
      password
    }
  });
  expect(registerResponse.statusCode).toBe(200);
  const registration = expectResponseData(
    registerResponse,
    memberAuthRegisterResponseSchema,
    "member auth register"
  );
  if (registration.status === "signed_in") {
    return {
      accessToken: registration.session.accessToken,
      memberId: registration.session.member.id
    };
  }
  if (registration.status === "pending_approval") {
    throw new Error("member registration requires approval in test helper");
  }
  const devCode = registration.codeRequest.devCode;
  expect(devCode).toEqual(expect.any(String));
  if (!devCode) {
    throw new Error("member auth request code missing devCode in test mode");
  }

  const verifyResponse = await app.inject({
    method: "POST",
    url: "/v1/member/auth/verify-code",
    payload: {
      challengeId: registration.codeRequest.challengeId,
      code: devCode
    }
  });
  expect(verifyResponse.statusCode).toBe(200);
  const session = expectResponseData(
    verifyResponse,
    memberAuthSessionSchema,
    "member auth verify"
  );
  return {
    accessToken: session.accessToken,
    memberId: session.member.id
  };
}

async function buildTestApp(configOverrides: Partial<AppConfig> = {}) {
  const mediaUploadDir = await mkdtemp(join(tmpdir(), "mbc-care-media-"));
  const app = await buildApp({
    ...testConfig,
    ...configOverrides,
    mediaUploadDir
  });

  return {
    app,
    async close() {
      await app.close();
      await rm(mediaUploadDir, { recursive: true, force: true });
    }
  };
}

const testConfig: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 0,
  publicApiBaseUrl: "http://localhost:3020/v1",
  adminWebOrigin: "http://localhost:5173",
  useMockData: true,
  databaseUrl: undefined,
  mediaStorageDriver: "local",
  mediaUploadDir: "uploads-test",
  s3Endpoint: undefined,
  s3Region: "us-east-1",
  s3Bucket: undefined,
  s3AccessKeyId: undefined,
  s3SecretAccessKey: undefined,
  s3ForcePathStyle: true,
  authSecret: "test-secret-minimum-32-characters",
  appUserAuthSecret: "test-member-secret-minimum-32-characters",
  devAdminEmail: "admin@mbc.local",
  devAdminPassword: "password123",
  bootstrapDevAdmin: true,
  fcmServiceAccountJson: undefined,
  firebaseServiceAccountJson: undefined,
  memberAuthRateLimitWindowMs: 60000,
  memberAuthRateLimitPerWindow: 10,
  fcmHttpTimeoutMs: 10000,
  stripeSecretKey: undefined,
  stripeWebhookSecret: undefined,
  stripeApiBaseUrl: "https://api.stripe.test",
  givingCheckoutSuccessUrl: "mbcwalkwith://life/giving?checkout=success",
  givingCheckoutCancelUrl: "mbcwalkwith://life/giving?checkout=cancel"
};
