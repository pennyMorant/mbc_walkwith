import {
  auditLogListResponseSchema,
  servingAssignmentSchema,
  servingAvailabilityListResponseSchema,
  servingAvailabilityRecordSchema,
  servingCheckInListResponseSchema,
  servingCheckInRecordSchema,
  servingMemberListResponseSchema,
  servingRoleSchema,
  servingTeamSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("serving schedule v2 routes", () => {
  it("records member availability and check-ins as backend-owned state", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const member = await loginMember(app, {
      email: "serving-v2-member@example.com",
      displayName: "Serving Member"
    });
    const otherMember = await loginMember(app, {
      email: "serving-v2-other@example.com",
      displayName: "Other Serving Member"
    });

    const teamResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/teams",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: "Sunday Service Team", status: "active" }
    });
    expect(teamResponse.statusCode).toBe(200);
    const team = expectResponseData(
      teamResponse,
      servingTeamSchema,
      "serving team create"
    );

    const roleResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/roles",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        teamId: team.id,
        name: "Usher",
        status: "active"
      }
    });
    expect(roleResponse.statusCode).toBe(200);
    const role = expectResponseData(
      roleResponse,
      servingRoleSchema,
      "serving role create"
    );

    const memberDirectoryResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/serving/members?status=active&query=serving-v2-member",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    expect(memberDirectoryResponse.statusCode).toBe(200);
    const memberDirectory = expectResponseData(
      memberDirectoryResponse,
      servingMemberListResponseSchema,
      "serving member directory"
    );
    expect(memberDirectory.items).toContainEqual(
      expect.objectContaining({
        id: member.memberId,
        displayName: "Serving Member",
        email: "serving-v2-member@example.com"
      })
    );

    const missingMemberResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        teamId: team.id,
        roleId: role.id,
        userId: "missing-member",
        title: "Missing member assignment",
        startsAt: "2026-06-27T16:30:00.000Z",
        status: "scheduled"
      }
    });
    expect(missingMemberResponse.statusCode).toBe(404);
    expect(missingMemberResponse.json().error).toMatchObject({
      code: "serving_member_not_found",
      sourceLayer: "feature"
    });

    const assignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        teamId: team.id,
        roleId: role.id,
        userId: member.memberId,
        title: "Sunday usher",
        startsAt: "2026-06-28T16:30:00.000Z",
        endsAt: "2026-06-28T18:30:00.000Z",
        location: "Main Sanctuary",
        status: "scheduled"
      }
    });
    expect(assignmentResponse.statusCode).toBe(200);
    const assignment = expectResponseData(
      assignmentResponse,
      servingAssignmentSchema,
      "serving assignment create"
    );
    expect(assignment).toMatchObject({
      memberDisplayName: "Serving Member",
      memberEmail: "serving-v2-member@example.com"
    });

    const coveredAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        teamId: team.id,
        roleId: role.id,
        userId: member.memberId,
        title: "Covered usher slot",
        startsAt: "2026-06-28T19:00:00.000Z",
        status: "covered"
      }
    });
    expect(coveredAssignmentResponse.statusCode).toBe(200);
    const coveredAssignment = expectResponseData(
      coveredAssignmentResponse,
      servingAssignmentSchema,
      "covered serving assignment create"
    );

    const coveredConfirmResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${coveredAssignment.id}/confirm`,
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(coveredConfirmResponse.statusCode).toBe(409);
    expect(coveredConfirmResponse.json().error).toMatchObject({
      code: "serving_assignment_conflict",
      sourceLayer: "domain"
    });

    const cancelledAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        teamId: team.id,
        roleId: role.id,
        userId: member.memberId,
        title: "Cancelled usher slot",
        startsAt: "2026-06-28T20:00:00.000Z",
        status: "cancelled"
      }
    });
    expect(cancelledAssignmentResponse.statusCode).toBe(200);
    const cancelledAssignment = expectResponseData(
      cancelledAssignmentResponse,
      servingAssignmentSchema,
      "cancelled serving assignment create"
    );

    const invalidMemberCheckInResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${cancelledAssignment.id}/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: { status: "checked_in" }
    });
    expect(invalidMemberCheckInResponse.statusCode).toBe(409);
    expect(invalidMemberCheckInResponse.json().error).toMatchObject({
      code: "serving_check_in_invalid",
      sourceLayer: "domain"
    });

    const invalidAdminCheckInResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/serving/assignments/${cancelledAssignment.id}/check-in`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "missed" }
    });
    expect(invalidAdminCheckInResponse.statusCode).toBe(409);
    expect(invalidAdminCheckInResponse.json().error).toMatchObject({
      code: "serving_check_in_invalid",
      sourceLayer: "domain"
    });

    const availabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        startsAt: "2026-06-28T15:00:00.000Z",
        endsAt: "2026-06-28T20:00:00.000Z",
        status: "available",
        note: "Available before and after worship."
      }
    });
    expect(availabilityResponse.statusCode).toBe(200);
    const availability = expectResponseData(
      availabilityResponse,
      servingAvailabilityRecordSchema,
      "member serving availability create"
    );
    expect(availability).toMatchObject({
      userId: member.memberId,
      status: "available"
    });

    const adminAvailabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/availability",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        userId: otherMember.memberId,
        startsAt: "2026-06-29T15:00:00.000Z",
        endsAt: "2026-06-29T20:00:00.000Z",
        status: "preferred",
        note: "Admin recorded preferred time."
      }
    });
    expect(adminAvailabilityResponse.statusCode).toBe(200);
    const adminAvailability = expectResponseData(
      adminAvailabilityResponse,
      servingAvailabilityRecordSchema,
      "admin serving availability create"
    );
    expect(adminAvailability).toMatchObject({
      userId: otherMember.memberId,
      status: "preferred"
    });

    const myAvailabilityResponse = await app.inject({
      method: "GET",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(myAvailabilityResponse.statusCode).toBe(200);
    const myAvailability = expectResponseData(
      myAvailabilityResponse,
      servingAvailabilityListResponseSchema,
      "member serving availability list"
    );
    expect(myAvailability.items[0]?.id).toBe(availability.id);

    const forgedMissedResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: { status: "missed" }
    });
    expect(forgedMissedResponse.statusCode).toBe(409);
    expect(forgedMissedResponse.json().error).toMatchObject({
      code: "serving_check_in_invalid"
    });

    const forgedCheckInTimeResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        status: "checked_in",
        checkedInAt: "2026-01-01T00:00:00.000Z"
      }
    });
    expect(forgedCheckInTimeResponse.statusCode).toBe(409);
    expect(forgedCheckInTimeResponse.json().error).toMatchObject({
      code: "serving_check_in_invalid"
    });

    const checkInResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        status: "checked_in",
        note: "Checked in at sanctuary door."
      }
    });
    expect(checkInResponse.statusCode).toBe(200);
    const checkIn = expectResponseData(
      checkInResponse,
      servingCheckInRecordSchema,
      "member serving check-in"
    );
    expect(checkIn).toMatchObject({
      assignmentId: assignment.id,
      userId: member.memberId,
      status: "checked_in"
    });

    const reasonlessCorrectionResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/serving/assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "missed" }
    });
    expect(reasonlessCorrectionResponse.statusCode).toBe(409);
    expect(reasonlessCorrectionResponse.json().error).toMatchObject({
      code: "serving_check_in_reason_required"
    });

    const normalizedAdminCheckInResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/serving/assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        status: "checked_in",
        checkedInAt: null,
        note: "Verified the original check-in time."
      }
    });
    expect(normalizedAdminCheckInResponse.statusCode).toBe(200);
    const normalizedAdminCheckIn = expectResponseData(
      normalizedAdminCheckInResponse,
      servingCheckInRecordSchema,
      "normalized admin serving check-in"
    );
    expect(normalizedAdminCheckIn.checkedInAt).not.toBeNull();

    const adminCheckInResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/serving/assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        status: "missed",
        note: "Corrected after review."
      }
    });
    expect(adminCheckInResponse.statusCode).toBe(200);
    const adminCheckIn = expectResponseData(
      adminCheckInResponse,
      servingCheckInRecordSchema,
      "admin serving check-in correction"
    );
    expect(adminCheckIn.id).toBe(checkIn.id);
    expect(adminCheckIn.status).toBe("missed");
    expect(adminCheckIn.checkedInAt).toBeNull();

    const memberOverrideResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignment.id}/check-in`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: { status: "checked_in" }
    });
    expect(memberOverrideResponse.statusCode).toBe(409);
    expect(memberOverrideResponse.json().error).toMatchObject({
      code: "serving_check_in_invalid"
    });

    const memberCheckInListResponse = await app.inject({
      method: "GET",
      url: "/v1/me/serving-check-ins",
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(memberCheckInListResponse.statusCode).toBe(200);
    const memberCheckIns = expectResponseData(
      memberCheckInListResponse,
      servingCheckInListResponseSchema,
      "member serving check-in list"
    );
    expect(memberCheckIns.items).toHaveLength(1);
    expect(memberCheckIns.items[0]).toMatchObject({
      assignmentId: assignment.id,
      userId: member.memberId,
      status: "missed"
    });

    const otherMemberCheckInListResponse = await app.inject({
      method: "GET",
      url: "/v1/me/serving-check-ins",
      headers: { authorization: `Bearer ${otherMember.accessToken}` }
    });
    expect(otherMemberCheckInListResponse.statusCode).toBe(200);
    const otherMemberCheckIns = expectResponseData(
      otherMemberCheckInListResponse,
      servingCheckInListResponseSchema,
      "other member serving check-in list"
    );
    expect(otherMemberCheckIns.items).toEqual([]);

    const checkInListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/serving/check-ins?assignmentId=${assignment.id}`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    expect(checkInListResponse.statusCode).toBe(200);
    const checkIns = expectResponseData(
      checkInListResponse,
      servingCheckInListResponseSchema,
      "admin serving check-in list"
    );
    expect(checkIns.items[0]?.id).toBe(checkIn.id);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=serving_check_in&limit=20",
      headers: { authorization: `Bearer ${adminToken}` }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "serving check-in audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      assignmentId: assignment.id,
      userId: member.memberId,
      status: "missed",
      hasNote: true
    });
    expect(JSON.stringify(auditResponse.json())).not.toContain(
      "Corrected after review"
    );

    await harness.close();
  });

  it("protects serving time ranges, ownership, and schedule conflicts", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const member = await loginMember(app, {
      email: "serving-rules-member@example.com",
      displayName: "Serving Rules Member"
    });
    const otherMember = await loginMember(app, {
      email: "serving-rules-other@example.com",
      displayName: "Serving Rules Other"
    });

    const teamResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/teams",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: "Serving Rules Team", status: "active" }
    });
    const team = expectResponseData(
      teamResponse,
      servingTeamSchema,
      "serving rules team"
    );
    const roleResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/roles",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { teamId: team.id, name: "Host", status: "active" }
    });
    const role = expectResponseData(
      roleResponse,
      servingRoleSchema,
      "serving rules role"
    );
    const assignmentPayload = {
      teamId: team.id,
      roleId: role.id,
      userId: member.memberId,
      title: "Sunday host",
      startsAt: "2026-07-12T16:00:00.000Z",
      endsAt: "2026-07-12T18:00:00.000Z",
      status: "scheduled" as const
    };

    const invalidRangeResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        ...assignmentPayload,
        title: "Invalid serving range",
        endsAt: "2026-07-12T15:00:00.000Z"
      }
    });
    expect(invalidRangeResponse.statusCode).toBe(409);
    expect(invalidRangeResponse.json().error).toMatchObject({
      code: "serving_time_range_invalid",
      evidence: { resourceType: "assignment" }
    });

    const assignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: assignmentPayload
    });
    const assignment = expectResponseData(
      assignmentResponse,
      servingAssignmentSchema,
      "serving rules assignment"
    );

    const overlapResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        ...assignmentPayload,
        title: "Overlapping serving slot",
        startsAt: "2026-07-12T17:30:00.000Z",
        endsAt: "2026-07-12T19:00:00.000Z"
      }
    });
    expect(overlapResponse.statusCode).toBe(409);
    expect(overlapResponse.json().error).toMatchObject({
      code: "serving_assignment_conflict",
      evidence: {
        conflictingAssignmentIds: [assignment.id]
      }
    });

    const foreignConfirmResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${assignment.id}/confirm`,
      headers: { authorization: `Bearer ${otherMember.accessToken}` },
      payload: {}
    });
    expect(foreignConfirmResponse.statusCode).toBe(403);
    expect(foreignConfirmResponse.json().error).toMatchObject({
      code: "serving_permission_denied"
    });

    const declinedAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/serving/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        ...assignmentPayload,
        title: "Declined overlapping slot",
        status: "declined"
      }
    });
    const declinedAssignment = expectResponseData(
      declinedAssignmentResponse,
      servingAssignmentSchema,
      "declined serving rules assignment"
    );
    const conflictingConfirmResponse = await app.inject({
      method: "POST",
      url: `/v1/serving-assignments/${declinedAssignment.id}/confirm`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {}
    });
    expect(conflictingConfirmResponse.statusCode).toBe(409);
    expect(conflictingConfirmResponse.json().error).toMatchObject({
      code: "serving_assignment_conflict",
      evidence: { conflictingAssignmentIds: [assignment.id] }
    });

    const invalidAvailabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        startsAt: "2026-07-11T18:00:00.000Z",
        endsAt: "2026-07-11T17:00:00.000Z",
        status: "available"
      }
    });
    expect(invalidAvailabilityResponse.statusCode).toBe(409);
    expect(invalidAvailabilityResponse.json().error).toMatchObject({
      code: "serving_time_range_invalid",
      evidence: { resourceType: "availability" }
    });

    const availabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        startsAt: "2026-07-11T15:00:00.000Z",
        endsAt: "2026-07-11T17:00:00.000Z",
        status: "available"
      }
    });
    const availability = expectResponseData(
      availabilityResponse,
      servingAvailabilityRecordSchema,
      "serving rules availability"
    );
    const overlapAvailabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        startsAt: "2026-07-11T16:00:00.000Z",
        endsAt: "2026-07-11T18:00:00.000Z",
        status: "preferred"
      }
    });
    expect(overlapAvailabilityResponse.statusCode).toBe(409);
    expect(overlapAvailabilityResponse.json().error).toMatchObject({
      code: "serving_availability_conflict",
      evidence: { conflictingRecordIds: [availability.id] }
    });

    const adjacentAvailabilityResponse = await app.inject({
      method: "POST",
      url: "/v1/me/serving-availability",
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {
        startsAt: "2026-07-11T17:00:00.000Z",
        endsAt: "2026-07-11T18:00:00.000Z",
        status: "preferred"
      }
    });
    expect(adjacentAvailabilityResponse.statusCode).toBe(200);

    await harness.close();
  });
});
