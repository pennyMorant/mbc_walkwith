import {
  auditLogListResponseSchema,
  groupApplicationSchema,
  groupMembershipListResponseSchema,
  groupMembershipSchema,
  memberProfileSchema,
  ministryGroupSchema
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("group membership admin routes", () => {
  it("manages canonical membership, projection, capacity, and audit state", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const firstMember = await loginMember(app, {
      email: "group-member-one@example.com",
      displayName: "Member One"
    });
    const secondMember = await loginMember(app, {
      email: "group-member-two@example.com",
      displayName: "Member Two"
    });
    const groupId = await createGroup(app, adminToken);

    await applyAndApprove(
      app,
      adminToken,
      firstMember.accessToken,
      groupId
    );

    const membershipListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/groups/${groupId}/memberships`,
      headers: authorization(adminToken)
    });
    expect(membershipListResponse.statusCode).toBe(200);
    const membershipList = expectResponseData(
      membershipListResponse,
      groupMembershipListResponseSchema,
      "group membership list"
    );
    expect(membershipList.items).toContainEqual(
      expect.objectContaining({
        userId: firstMember.memberId,
        memberDisplayName: "Member One",
        memberEmail: "group-member-one@example.com",
        status: "active"
      })
    );

    const leaderResponse = await updateMembership(
      app,
      adminToken,
      groupId,
      firstMember.memberId,
      "leader"
    );
    expect(leaderResponse.status).toBe("leader");
    const duplicateLeaderResponse = await updateMembership(
      app,
      adminToken,
      groupId,
      firstMember.memberId,
      "leader"
    );
    expect(duplicateLeaderResponse.status).toBe("leader");

    const inactiveResponse = await updateMembership(
      app,
      adminToken,
      groupId,
      firstMember.memberId,
      "inactive"
    );
    expect(inactiveResponse.status).toBe("inactive");

    const memberSessionResponse = await app.inject({
      method: "GET",
      url: "/v1/member/auth/me",
      headers: authorization(firstMember.accessToken)
    });
    expect(memberSessionResponse.statusCode).toBe(200);
    const memberSession = expectResponseData(
      memberSessionResponse,
      z.object({ member: memberProfileSchema }),
      "member group projection after removal"
    );
    expect(memberSession.member.fellowshipGroupId).toBeNull();

    await applyAndApprove(
      app,
      adminToken,
      secondMember.accessToken,
      groupId
    );
    const fullGroupResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${groupId}/memberships/${firstMember.memberId}`,
      headers: authorization(adminToken),
      payload: { status: "active" }
    });
    expect(fullGroupResponse.statusCode).toBe(409);
    expect(fullGroupResponse.json().error).toMatchObject({
      code: "group_capacity_full",
      sourceLayer: "domain"
    });

    const inactiveListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/groups/${groupId}/memberships?status=inactive`,
      headers: authorization(adminToken)
    });
    const inactiveList = expectResponseData(
      inactiveListResponse,
      groupMembershipListResponseSchema,
      "inactive group membership list"
    );
    expect(inactiveList.items.map((item) => item.userId)).toEqual([
      firstMember.memberId
    ]);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=group_membership&limit=20",
      headers: authorization(adminToken)
    });
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "group membership audit"
    );
    expect(audit.items.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "group.membership.update",
        "group.membership.update_duplicate"
      ])
    );
    expect(JSON.stringify(auditResponse.json())).not.toContain(
      "group-member-one@example.com"
    );

    const missingGroupResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/missing-group/memberships/${firstMember.memberId}`,
      headers: authorization(adminToken),
      payload: { status: "active" }
    });
    expect(missingGroupResponse.statusCode).toBe(404);
    expect(missingGroupResponse.json().error).toMatchObject({
      code: "group_not_found",
      sourceLayer: "feature"
    });

    await harness.close();
  });
});

async function createGroup(app: FastifyInstance, adminToken: string) {
  const response = await app.inject({
    method: "POST",
    url: "/v1/admin/groups",
    headers: authorization(adminToken),
    payload: {
      name: "Capacity Group",
      description: "Membership lifecycle test group.",
      meetingTime: "Sunday 1 PM",
      location: "Room 101",
      leaderName: "Leader",
      visibility: "members",
      status: "active",
      capacity: 1
    }
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(
    response,
    ministryGroupSchema,
    "membership test group create"
  ).id;
}

async function applyAndApprove(
  app: FastifyInstance,
  adminToken: string,
  memberToken: string,
  groupId: string
) {
  const applicationResponse = await app.inject({
    method: "POST",
    url: `/v1/groups/${groupId}/applications`,
    headers: authorization(memberToken),
    payload: {}
  });
  expect(applicationResponse.statusCode).toBe(200);
  const application = expectResponseData(
    applicationResponse,
    groupApplicationSchema,
    "group membership application"
  );
  const approvalResponse = await app.inject({
    method: "PATCH",
    url: `/v1/admin/groups/${groupId}/applications/${application.id}`,
    headers: authorization(adminToken),
    payload: { status: "approved" }
  });
  expect(approvalResponse.statusCode).toBe(200);
}

async function updateMembership(
  app: FastifyInstance,
  adminToken: string,
  groupId: string,
  userId: string,
  status: "active" | "inactive" | "leader"
) {
  const response = await app.inject({
    method: "PATCH",
    url: `/v1/admin/groups/${groupId}/memberships/${userId}`,
    headers: authorization(adminToken),
    payload: { status }
  });
  expect(response.statusCode).toBe(200);
  return expectResponseData(
    response,
    groupMembershipSchema,
    `group membership ${status}`
  );
}

function authorization(token: string) {
  return { authorization: `Bearer ${token}` };
}
