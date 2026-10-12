import {
  auditLogListResponseSchema,
  groupAttendanceListResponseSchema,
  groupAttendanceRecordSchema,
  groupMaterialAssignmentListResponseSchema,
  groupMaterialAssignmentSchema,
  ministryGroupSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("group ministry v2 routes", () => {
  it("lets admins assign group materials and record attendance without copying source content", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const member = await loginMember(app, {
      email: "group-v2-member@example.com",
      displayName: "Member Alpha"
    });

    const groupResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/groups",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        name: "Growth Group",
        description: "A group using sermon and reading materials.",
        meetingTime: "Friday 7:30 PM",
        location: "Room 201",
        leaderName: "Leader Lin",
        visibility: "members",
        status: "active"
      }
    });
    expect(groupResponse.statusCode).toBe(200);
    const group = expectResponseData(
      groupResponse,
      ministryGroupSchema,
      "admin group create"
    );

    const applicationResponse = await app.inject({
      method: "POST",
      url: `/v1/groups/${group.id}/applications`,
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {}
    });
    expect(applicationResponse.statusCode).toBe(200);
    const applicationId = applicationResponse.json().data.id as string;
    const approvalResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/applications/${applicationId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: { status: "approved" }
    });
    expect(approvalResponse.statusCode).toBe(200);

    const invalidAttendanceResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/groups/${group.id}/attendance`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        meetingDate: "2026-06-28T17:00:00.000Z",
        memberUserId: "not-a-group-member",
        memberDisplayName: "Not A Member",
        status: "present",
        note: ""
      }
    });
    expect(invalidAttendanceResponse.statusCode).toBe(409);
    expect(invalidAttendanceResponse.json().error).toMatchObject({
      code: "group_attendance_invalid",
      sourceLayer: "domain"
    });

    const invalidMaterialResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/groups/${group.id}/materials`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        materialType: "reading_plan",
        materialId: "missing-reading-plan",
        title: "Missing plan",
        status: "assigned"
      }
    });
    expect(invalidMaterialResponse.statusCode).toBe(409);
    expect(invalidMaterialResponse.json().error).toMatchObject({
      code: "group_material_reference_not_found",
      sourceLayer: "feature"
    });

    const materialResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/groups/${group.id}/materials`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        materialType: "course",
        materialId: "foundations-course",
        title: "Foundations of Faith",
        status: "assigned",
        dueAt: "2026-06-28T17:00:00.000Z"
      }
    });
    expect(materialResponse.statusCode).toBe(200);
    const material = expectResponseData(
      materialResponse,
      groupMaterialAssignmentSchema,
      "admin group material assignment"
    );
    expect(material).toMatchObject({
      groupId: group.id,
      materialType: "course",
      materialId: "foundations-course",
      status: "assigned"
    });

    const incompleteMaterialUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/materials/${material.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        materialId: "missing-course"
      }
    });
    expect(incompleteMaterialUpdateResponse.statusCode).toBe(400);

    const invalidMaterialUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/materials/${material.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        materialType: "course",
        materialId: "missing-course"
      }
    });
    expect(invalidMaterialUpdateResponse.statusCode).toBe(409);
    expect(invalidMaterialUpdateResponse.json().error).toMatchObject({
      code: "group_material_reference_not_found",
      sourceLayer: "feature"
    });

    const materialUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/materials/${material.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "completed"
      }
    });
    expect(materialUpdateResponse.statusCode).toBe(200);
    const updatedMaterial = expectResponseData(
      materialUpdateResponse,
      groupMaterialAssignmentSchema,
      "admin group material update"
    );
    expect(updatedMaterial.status).toBe("completed");

    const missingMaterialUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/groups/${group.id}/materials/missing-assignment`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "needs_follow_up"
      }
    });
    expect(missingMaterialUpdateResponse.statusCode).toBe(404);
    expect(missingMaterialUpdateResponse.json().error).toMatchObject({
      code: "group_material_assignment_not_found",
      sourceLayer: "feature"
    });

    const materialListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/groups/${group.id}/materials`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(materialListResponse.statusCode).toBe(200);
    const materialList = expectResponseData(
      materialListResponse,
      groupMaterialAssignmentListResponseSchema,
      "admin group material list"
    );
    expect(materialList.items.map((item) => item.id)).toContain(material.id);
    expect(JSON.stringify(materialListResponse.json())).not.toContain(
      "What promise stands out"
    );

    const attendanceResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/groups/${group.id}/attendance`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        meetingDate: "2026-06-28T17:00:00.000Z",
        memberUserId: member.memberId,
        status: "present",
        note: "Arrived early and helped set up."
      }
    });
    expect(attendanceResponse.statusCode).toBe(200);
    const attendance = expectResponseData(
      attendanceResponse,
      groupAttendanceRecordSchema,
      "admin group attendance upsert"
    );
    expect(attendance).toMatchObject({
      groupId: group.id,
      memberUserId: member.memberId,
      memberDisplayName: "Member Alpha",
      status: "present"
    });

    const attendanceUpdateResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/groups/${group.id}/attendance`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        meetingDate: "2026-06-28T17:00:00.000Z",
        memberUserId: member.memberId,
        status: "excused",
        note: "Corrected by admin."
      }
    });
    expect(attendanceUpdateResponse.statusCode).toBe(200);
    const updatedAttendance = expectResponseData(
      attendanceUpdateResponse,
      groupAttendanceRecordSchema,
      "admin group attendance correction"
    );
    expect(updatedAttendance.id).toBe(attendance.id);
    expect(updatedAttendance.status).toBe("excused");

    const attendanceListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/groups/${group.id}/attendance`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(attendanceListResponse.statusCode).toBe(200);
    const attendanceList = expectResponseData(
      attendanceListResponse,
      groupAttendanceListResponseSchema,
      "admin group attendance list"
    );
    expect(attendanceList.items[0]?.id).toBe(attendance.id);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=group_attendance_record&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "group attendance audit"
    );
    const correctedAudit = audit.items.find((item) => {
      const after = item.afterJson as { status?: string };
      return after.status === "excused";
    });
    expect(correctedAudit?.afterJson).toMatchObject({
      groupId: group.id,
      memberUserId: member.memberId,
      status: "excused",
      hasNote: true
    });
    expect(JSON.stringify(auditResponse.json())).not.toContain(
      "Corrected by admin"
    );

    await harness.close();
  });
});
