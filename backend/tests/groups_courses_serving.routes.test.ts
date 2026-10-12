import {
  auditLogListResponseSchema,
  groupApplicationListResponseSchema,
  groupApplicationSchema,
  memberListResponseSchema,
  ministryGroupListResponseSchema,
  ministryGroupSchema,
  servingAssignmentListResponseSchema,
  servingAssignmentSchema,
  servingRoleSchema,
  servingTeamSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("groups, courses, and serving routes", () => {
  it("returns an empty public group catalog when no active groups exist", async () => {
    const harness = await buildTestApp();

    const response = await harness.app.inject({
      method: "GET",
      url: "/v1/groups?limit=20"
    });

    expect(response.statusCode).toBe(200);
    expectResponseData(
      response,
      ministryGroupListResponseSchema,
      "empty public group list"
    );
    expect(response.json().data.items).toEqual([]);
  });

  it("supports group applications and admin approval", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "group-member@example.com",
      displayName: "Group Member"
    });

    const createGroupResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/groups",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        name: "Northside Fellowship",
        description: "A weekday Bible sharing group.",
        meetingTime: "Wednesday 7 PM",
        location: "Room 201",
        leaderName: "Pastor Lee",
        visibility: "public",
        status: "active",
        capacity: 12
      }
    });
    expect(createGroupResponse.statusCode).toBe(200);
    const createdGroup = expectResponseData(
      createGroupResponse,
      ministryGroupSchema,
      "admin group create"
    );
    expect(createdGroup).toMatchObject({
      name: "Northside Fellowship",
      status: "active",
      memberCount: 0
    });
    const groupId = createdGroup.id;

    const guestGroupsResponse = await app.inject({
      method: "GET",
      url: "/v1/groups"
    });
    expect(guestGroupsResponse.statusCode).toBe(200);
    const guestGroups = expectResponseData(
      guestGroupsResponse,
      ministryGroupListResponseSchema,
      "guest group list"
    );
    expect(guestGroups.items.map((group) => group.id)).toContain(groupId);

    const memberGroupsResponse = await app.inject({
      method: "GET",
      url: "/v1/groups",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberGroupsResponse.statusCode).toBe(200);
    const memberGroups = expectResponseData(
      memberGroupsResponse,
      ministryGroupListResponseSchema,
      "member group list"
    );
    expect(
      memberGroups.items.map((group: { id: string }) => group.id)
    ).toContain(groupId);

    const applyResponse = await app.inject({
      method: "POST",
      url: `/v1/groups/${groupId}/applications`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        note: "I would like to join this fellowship."
      }
    });
    expect(applyResponse.statusCode).toBe(200);
    const application = expectResponseData(
      applyResponse,
      groupApplicationSchema,
      "member group application"
    );
    expect(application).toMatchObject({
      groupId,
      status: "submitted",
      memberEmail: "group-member@example.com"
    });
    const applicationId = application.id;

    const duplicateApplyResponse = await app.inject({
      method: "POST",
      url: `/v1/groups/${groupId}/applications`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        note: "A repeated submission must return canonical state."
      }
    });
    expect(duplicateApplyResponse.statusCode).toBe(200);
    expectResponseData(
      duplicateApplyResponse,
      groupApplicationSchema,
      "duplicate member group application"
    );
    expect(duplicateApplyResponse.json().data.id).toBe(applicationId);

    const applicationsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/groups/${groupId}/applications`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(applicationsResponse.statusCode).toBe(200);
    const applications = expectResponseData(
      applicationsResponse,
      groupApplicationListResponseSchema,
      "admin group applications"
    );
    expect(applications.items[0]).toMatchObject({
      id: applicationId,
      status: "submitted"
    });

    const approveResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${groupId}/applications/${applicationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "approved"
      }
    });
    expect(approveResponse.statusCode).toBe(200);
    const approvedApplication = expectResponseData(
      approveResponse,
      groupApplicationSchema,
      "admin group application approve"
    );
    expect(approvedApplication.status).toBe("approved");

    const memberGroupsAfterApproval = await app.inject({
      method: "GET",
      url: "/v1/groups",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberGroupsAfterApproval.statusCode).toBe(200);
    const approvedGroups = expectResponseData(
      memberGroupsAfterApproval,
      ministryGroupListResponseSchema,
      "member groups after approval"
    );
    expect(
      approvedGroups.items.find(
        (group: { id: string }) => group.id === groupId
      )
    ).toMatchObject({
      myApplicationStatus: "approved",
      myMembershipStatus: "active",
      memberCount: 1
    });

    const myGroupsResponse = await app.inject({
      method: "GET",
      url: "/v1/me/groups",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(myGroupsResponse.statusCode).toBe(200);
    const myGroups = expectResponseData(
      myGroupsResponse,
      ministryGroupListResponseSchema,
      "member canonical groups"
    );
    expect(myGroups.items).toContainEqual(
      expect.objectContaining({
        id: groupId,
        myApplicationId: applicationId,
        myApplicationStatus: "approved",
        myMembershipStatus: "active"
      })
    );

    const invalidReviewResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${groupId}/applications/${applicationId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "declined"
      }
    });
    expect(invalidReviewResponse.statusCode).toBe(409);
    expect(invalidReviewResponse.json().error).toMatchObject({
      code: "group_application_transition_invalid",
      sourceLayer: "domain"
    });

    const membersResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/members?fellowshipGroupId=${groupId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(membersResponse.statusCode).toBe(200);
    const members = expectResponseData(
      membersResponse,
      memberListResponseSchema,
      "admin group members"
    );
    expect(
      members.items.map((item: { email: string }) => item.email)
    ).toContain("group-member@example.com");

    const groupOnlyUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${groupId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        visibility: "group"
      }
    });
    expect(groupOnlyUpdateResponse.statusCode).toBe(200);

    const memberGroupDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/groups/${groupId}`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberGroupDetailResponse.statusCode).toBe(200);
    const memberGroupDetail = expectResponseData(
      memberGroupDetailResponse,
      ministryGroupSchema,
      "member group-only detail"
    );
    expect(memberGroupDetail).toMatchObject({
      id: groupId,
      visibility: "group",
      myMembershipStatus: "active"
    });

    const memberGroupOnlyListResponse = await app.inject({
      method: "GET",
      url: "/v1/groups",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberGroupOnlyListResponse.statusCode).toBe(200);
    const memberGroupOnlyList = expectResponseData(
      memberGroupOnlyListResponse,
      ministryGroupListResponseSchema,
      "member group-only list"
    );
    expect(
      memberGroupOnlyList.items.map((group: { id: string }) => group.id)
    ).toContain(groupId);

    const otherMember = await loginMember(app, {
      email: "group-other@example.com",
      displayName: "Other Group Member"
    });
    const otherGroupDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/groups/${groupId}`,
      headers: {
        authorization: `Bearer ${otherMember.accessToken}`
      }
    });
    expect(otherGroupDetailResponse.statusCode).toBe(404);

    const otherGroupListResponse = await app.inject({
      method: "GET",
      url: "/v1/groups",
      headers: {
        authorization: `Bearer ${otherMember.accessToken}`
      }
    });
    expect(otherGroupListResponse.statusCode).toBe(200);
    const otherGroupList = expectResponseData(
      otherGroupListResponse,
      ministryGroupListResponseSchema,
      "other member group list"
    );
    expect(
      otherGroupList.items.map((group: { id: string }) => group.id)
    ).not.toContain(groupId);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=group_application&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "group application audit"
    );
    expect(
      audit.items.map((log: { action: string }) => log.action)
    ).toEqual(
      expect.arrayContaining([
        "group.application.submit",
        "group.application.duplicate",
        "group.application.review"
      ])
    );

    await harness.close();
  });

  it("lets only the applicant withdraw a submitted group application", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const applicant = await loginMember(app, {
      email: "group-withdraw@example.com",
      displayName: "Withdraw Applicant"
    });
    const otherMember = await loginMember(app, {
      email: "group-withdraw-other@example.com",
      displayName: "Other Member"
    });
    const groupResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/groups",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        name: "Withdrawal Group",
        visibility: "members",
        status: "active"
      }
    });
    const group = expectResponseData(
      groupResponse,
      ministryGroupSchema,
      "withdrawal group create"
    );
    const applyResponse = await app.inject({
      method: "POST",
      url: `/v1/groups/${group.id}/applications`,
      headers: { authorization: `Bearer ${applicant.accessToken}` },
      payload: {}
    });
    const application = expectResponseData(
      applyResponse,
      groupApplicationSchema,
      "withdrawal group application"
    );

    const foreignWithdrawalResponse = await app.inject({
      method: "PATCH",
      url: `/v1/groups/${group.id}/applications/${application.id}`,
      headers: { authorization: `Bearer ${otherMember.accessToken}` },
      payload: { status: "withdrawn" }
    });
    expect(foreignWithdrawalResponse.statusCode).toBe(404);

    const withdrawalResponse = await app.inject({
      method: "PATCH",
      url: `/v1/groups/${group.id}/applications/${application.id}`,
      headers: { authorization: `Bearer ${applicant.accessToken}` },
      payload: { status: "withdrawn" }
    });
    expect(withdrawalResponse.statusCode).toBe(200);
    expectResponseData(
      withdrawalResponse,
      groupApplicationSchema,
      "group application withdrawal"
    );
    expect(withdrawalResponse.json().data.status).toBe("withdrawn");

    const duplicateWithdrawalResponse = await app.inject({
      method: "PATCH",
      url: `/v1/groups/${group.id}/applications/${application.id}`,
      headers: { authorization: `Bearer ${applicant.accessToken}` },
      payload: { status: "withdrawn" }
    });
    expect(duplicateWithdrawalResponse.statusCode).toBe(200);

    const terminalReviewResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/applications/${application.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "approved" }
    });
    expect(terminalReviewResponse.statusCode).toBe(409);
    expect(terminalReviewResponse.json().error).toMatchObject({
      code: "group_application_transition_invalid"
    });

    const reapplyResponse = await app.inject({
      method: "POST",
      url: `/v1/groups/${group.id}/applications`,
      headers: { authorization: `Bearer ${applicant.accessToken}` },
      payload: {}
    });
    expect(reapplyResponse.statusCode).toBe(200);
    expect(reapplyResponse.json().data.id).not.toBe(application.id);

    await harness.close();
  });

  it("serializes group capacity decisions and protects group lifecycle", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const firstMember = await loginMember(app, {
      email: "group-capacity-first@example.com",
      displayName: "First Capacity Member"
    });
    const secondMember = await loginMember(app, {
      email: "group-capacity-second@example.com",
      displayName: "Second Capacity Member"
    });
    const groupResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/groups",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        name: "Capacity Group",
        visibility: "members",
        status: "active",
        capacity: 1
      }
    });
    const group = expectResponseData(
      groupResponse,
      ministryGroupSchema,
      "capacity group create"
    );
    const applicationIds = await Promise.all(
      [firstMember, secondMember].map(async (member) => {
        const response = await app.inject({
          method: "POST",
          url: `/v1/groups/${group.id}/applications`,
          headers: { authorization: `Bearer ${member.accessToken}` },
          payload: {}
        });
        expect(response.statusCode).toBe(200);
        return response.json().data.id as string;
      })
    );
    const approvalResponses = await Promise.all(
      applicationIds.map((applicationId) =>
        app.inject({
          method: "PATCH",
          url: `/v1/admin/groups/${group.id}/applications/${applicationId}`,
          headers: { authorization: `Bearer ${accessToken}` },
          payload: { status: "approved" }
        })
      )
    );
    expect(approvalResponses.map((response) => response.statusCode).sort()).toEqual([
      200,
      409
    ]);
    const rejectedApproval = approvalResponses.find(
      (response) => response.statusCode === 409
    );
    expect(rejectedApproval?.json().error).toMatchObject({
      code: "group_capacity_full"
    });

    const reopenCapacityResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { capacity: null }
    });
    expect(reopenCapacityResponse.statusCode).toBe(200);
    const pendingApplicationId = applicationIds.find(
      (_, index) => approvalResponses[index]?.statusCode === 409
    );
    const secondApprovalResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/applications/${pendingApplicationId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "approved" }
    });
    expect(secondApprovalResponse.statusCode).toBe(200);

    const invalidCapacityResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { capacity: 1 }
    });
    expect(invalidCapacityResponse.statusCode).toBe(409);
    expect(invalidCapacityResponse.json().error).toMatchObject({
      code: "group_capacity_below_member_count"
    });

    const invalidStatusResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "draft" }
    });
    expect(invalidStatusResponse.statusCode).toBe(409);
    expect(invalidStatusResponse.json().error).toMatchObject({
      code: "group_status_transition_invalid"
    });

    await harness.close();
  });

  it("supports serving assignments and member responses", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "serving-member@example.com",
      displayName: "Serving Member"
    });

    const teamResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/teams",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        name: "Hospitality",
        description: "Welcome team",
        status: "active"
      }
    });
    expect(teamResponse.statusCode).toBe(200);
    const teamId = expectResponseData(
      teamResponse,
      servingTeamSchema,
      "admin serving team create"
    ).id;

    const roleResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/roles",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        teamId,
        name: "Usher",
        description: "Welcome and seating",
        status: "active"
      }
    });
    expect(roleResponse.statusCode).toBe(200);
    const roleId = expectResponseData(
      roleResponse,
      servingRoleSchema,
      "admin serving role create"
    ).id;

    const techTeamResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/teams",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        name: "Audio Visual",
        description: "Sound and slides team",
        status: "active"
      }
    });
    expect(techTeamResponse.statusCode).toBe(200);
    const techTeamId = expectResponseData(
      techTeamResponse,
      servingTeamSchema,
      "admin serving second team create"
    ).id;

    const techRoleResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/roles",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        teamId: techTeamId,
        name: "Sound",
        description: "Operate sanctuary audio",
        status: "active"
      }
    });
    expect(techRoleResponse.statusCode).toBe(200);
    const techRoleId = expectResponseData(
      techRoleResponse,
      servingRoleSchema,
      "admin serving second role create"
    ).id;

    const assignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        teamId,
        roleId,
        userId: member.memberId,
        title: "Sunday worship usher",
        startsAt: "2026-07-05T16:30:00.000Z",
        endsAt: "2026-07-05T18:30:00.000Z",
        location: "Main Sanctuary",
        status: "scheduled",
        note: "Arrive 20 minutes early."
      }
    });
    expect(assignmentResponse.statusCode).toBe(200);
    const assignment = expectResponseData(
      assignmentResponse,
      servingAssignmentSchema,
      "admin serving assignment create"
    );
    expect(assignment).toMatchObject({
      userId: member.memberId,
      status: "scheduled",
      teamName: "Hospitality",
      roleName: "Usher"
    });
    const assignmentId = assignment.id;

    const assignedRoleMoveResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/serving/roles/${roleId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        teamId: techTeamId
      }
    });
    expect(assignedRoleMoveResponse.statusCode).toBe(409);
    expect(assignedRoleMoveResponse.json().error).toMatchObject({
      code: "serving_role_in_use",
      evidence: { roleId, assignmentIds: [assignmentId] }
    });

    const invalidRoleUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/serving/assignments/${assignmentId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        roleId: techRoleId
      }
    });
    expect(invalidRoleUpdateResponse.statusCode).toBe(404);
    expect(invalidRoleUpdateResponse.json().error).toMatchObject({
      code: "serving_role_not_found"
    });

    const invalidTeamUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/serving/assignments/${assignmentId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        teamId: techTeamId
      }
    });
    expect(invalidTeamUpdateResponse.statusCode).toBe(404);
    expect(invalidTeamUpdateResponse.json().error).toMatchObject({
      code: "serving_role_not_found"
    });

    const myAssignmentsResponse = await app.inject({
      method: "GET",
      url: "/v1/me/serving-assignments",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(myAssignmentsResponse.statusCode).toBe(200);
    const myAssignments = expectResponseData(
      myAssignmentsResponse,
      servingAssignmentListResponseSchema,
      "my serving assignment list"
    );
    expect(
      myAssignments.items.map((item: { id: string }) => item.id)
    ).toContain(assignmentId);

    const confirmResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignmentId}/confirm`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(confirmResponse.statusCode).toBe(200);
    const confirmed = expectResponseData(
      confirmResponse,
      servingAssignmentSchema,
      "member serving assignment confirm"
    );
    expect(confirmed.status).toBe("confirmed");

    const leaveResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignmentId}/leave-request`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        note: "I am out of town."
      }
    });
    expect(leaveResponse.statusCode).toBe(200);
    const leave = expectResponseData(
      leaveResponse,
      servingAssignmentSchema,
      "member serving assignment leave request"
    );
    expect(leave).toMatchObject({
      status: "declined",
      responseNote: "I am out of town."
    });

    const adminAssignmentsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/serving/assignments?userId=${member.memberId}`,
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(adminAssignmentsResponse.statusCode).toBe(200);
    const adminAssignments = expectResponseData(
      adminAssignmentsResponse,
      servingAssignmentListResponseSchema,
      "admin serving assignment list"
    );
    expect(adminAssignments.items[0]).toMatchObject({
      id: assignmentId,
      status: "declined"
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=serving_assignment&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "serving assignment audit"
    );
    expect(
      audit.items.map((log: { action: string }) => log.action)
    ).toEqual(
      expect.arrayContaining([
        "serving.assignment.create",
        "serving.assignment.confirm",
        "serving.assignment.leave_request"
      ])
    );

    await harness.close();
  });
});
