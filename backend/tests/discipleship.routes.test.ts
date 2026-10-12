import {
  auditLogListResponseSchema,
  discipleshipAssignmentListResponseSchema,
  discipleshipAssignmentSchema,
  discipleshipJourneySchema,
  memberDiscipleshipAssignmentListResponseSchema,
  discipleshipStageListResponseSchema,
  discipleshipStageSchema,
  discipleshipTaskListResponseSchema,
  discipleshipTaskProgressSchema,
  discipleshipTaskSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("discipleship journey routes", () => {
  it("lets admins create a journey and assign member progress", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const member = await loginMember(app, {
      email: "journey-member@example.com",
      displayName: "Journey Member"
    });

    const journeyResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/journeys",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "New Believer Path",
        description: "A first path for new believers.",
        status: "active"
      }
    });
    expect(journeyResponse.statusCode).toBe(200);
    const journey = expectResponseData(
      journeyResponse,
      discipleshipJourneySchema,
      "discipleship journey create"
    );
    expect(journey).toMatchObject({
      title: "New Believer Path",
      status: "active"
    });

    const stageResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/discipleship/journeys/${journey.id}/stages`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Gospel Foundations",
        sortOrder: 10
      }
    });
    expect(stageResponse.statusCode).toBe(200);
    const stage = expectResponseData(
      stageResponse,
      discipleshipStageSchema,
      "discipleship stage create"
    );
    expect(stage.journeyId).toBe(journey.id);

    const stageAuditResponse = await app.inject({
      method: "GET",
      url:
        `/v1/admin/audit-logs?resourceType=discipleship_stage` +
        `&resourceId=${stage.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(stageAuditResponse.statusCode).toBe(200);
    const stageAudit = expectResponseData(
      stageAuditResponse,
      auditLogListResponseSchema,
      "discipleship stage audit"
    );
    expect(stageAudit.items[0]?.afterJson).toMatchObject({
      id: stage.id,
      journeyId: journey.id,
      sortOrder: 10
    });
    expect(JSON.stringify(stageAuditResponse.json())).not.toContain(
      "Gospel Foundations"
    );

    const stageListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/discipleship/journeys/${journey.id}/stages`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(stageListResponse.statusCode).toBe(200);
    const stages = expectResponseData(
      stageListResponse,
      discipleshipStageListResponseSchema,
      "discipleship stage list"
    );
    expect(stages.items.map((item) => item.id)).toEqual([stage.id]);

    const otherJourneyResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/journeys",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Serving Path",
        description: "A separate journey for serving preparation.",
        status: "active"
      }
    });
    expect(otherJourneyResponse.statusCode).toBe(200);
    const otherJourney = expectResponseData(
      otherJourneyResponse,
      discipleshipJourneySchema,
      "second discipleship journey create"
    );
    const mismatchedStageTaskResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/discipleship/journeys/${otherJourney.id}/tasks`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        stageId: stage.id,
        title: "Mismatched stage task",
        referenceType: "manual_review"
      }
    });
    expect(mismatchedStageTaskResponse.statusCode).toBe(404);

    const missingReferenceTaskResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/discipleship/journeys/${journey.id}/tasks`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        stageId: stage.id,
        title: "Read assigned sermon",
        referenceType: "sermon",
        sortOrder: 15
      }
    });
    expect(missingReferenceTaskResponse.statusCode).toBe(409);
    expect(missingReferenceTaskResponse.json().error).toMatchObject({
      code: "discipleship_reference_invalid",
      evidence: {
        referenceType: "sermon",
        referenceId: ""
      }
    });

    const unknownReferenceTaskResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/discipleship/journeys/${journey.id}/tasks`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        stageId: stage.id,
        title: "Unknown sermon",
        referenceType: "sermon",
        referenceId: "00000000-0000-4000-8000-000000000099"
      }
    });
    expect(unknownReferenceTaskResponse.statusCode).toBe(409);
    expect(unknownReferenceTaskResponse.json().error).toMatchObject({
      code: "discipleship_reference_invalid"
    });

    const taskResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/discipleship/journeys/${journey.id}/tasks`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        stageId: stage.id,
        title: "Read John 1",
        referenceType: "manual_review",
        referenceId: "john-1",
        sortOrder: 20
      }
    });
    expect(taskResponse.statusCode).toBe(200);
    const task = expectResponseData(
      taskResponse,
      discipleshipTaskSchema,
      "discipleship task create"
    );
    expect(task).toMatchObject({
      journeyId: journey.id,
      stageId: stage.id,
      referenceType: "manual_review",
      referenceId: "john-1"
    });

    const taskAuditResponse = await app.inject({
      method: "GET",
      url:
        `/v1/admin/audit-logs?resourceType=discipleship_task` +
        `&resourceId=${task.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(taskAuditResponse.statusCode).toBe(200);
    const taskAudit = expectResponseData(
      taskAuditResponse,
      auditLogListResponseSchema,
      "discipleship task audit"
    );
    expect(taskAudit.items[0]?.afterJson).toMatchObject({
      id: task.id,
      journeyId: journey.id,
      stageId: stage.id,
      referenceType: "manual_review",
      hasReferenceId: true,
      required: true,
      sortOrder: 20
    });
    expect(JSON.stringify(taskAuditResponse.json())).not.toContain(
      "Read John 1"
    );

    const taskListResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/discipleship/journeys/${journey.id}/tasks`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(taskListResponse.statusCode).toBe(200);
    const tasks = expectResponseData(
      taskListResponse,
      discipleshipTaskListResponseSchema,
      "discipleship task list"
    );
    expect(tasks.items.map((item) => item.id)).toEqual([task.id]);

    const draftJourneyResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/journeys",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Draft Path",
        description: "Not ready to assign.",
        status: "draft"
      }
    });
    expect(draftJourneyResponse.statusCode).toBe(200);
    const draftJourney = expectResponseData(
      draftJourneyResponse,
      discipleshipJourneySchema,
      "draft discipleship journey create"
    );

    const draftAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        journeyId: draftJourney.id,
        userId: member.memberId,
        sourceType: "member",
        assigneeName: "Pastor Lee"
      }
    });
    expect(draftAssignmentResponse.statusCode).toBe(409);
    expect(draftAssignmentResponse.json().error).toMatchObject({
      code: "discipleship_assignment_closed",
      evidence: {
        journeyId: draftJourney.id,
        status: "draft"
      }
    });

    const unknownMemberAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/assignments",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        journeyId: journey.id,
        userId: "missing-member",
        sourceType: "member"
      }
    });
    expect(unknownMemberAssignmentResponse.statusCode).toBe(409);
    expect(unknownMemberAssignmentResponse.json().error).toMatchObject({
      code: "discipleship_source_invalid"
    });

    const assignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/discipleship/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        journeyId: journey.id,
        userId: member.memberId,
        sourceType: "member",
        assigneeName: "Pastor Lee"
      }
    });
    expect(assignmentResponse.statusCode).toBe(200);
    const assignment = expectResponseData(
      assignmentResponse,
      discipleshipAssignmentSchema,
      "discipleship assignment create"
    );
    expect(assignment).toMatchObject({
      journeyId: journey.id,
      userId: member.memberId,
      status: "not_started",
      taskTotalCount: 1,
      completedTaskCount: 0
    });

    const memberListResponse = await app.inject({
      method: "GET",
      url: "/v1/me/discipleship",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      }
    });
    expect(memberListResponse.statusCode).toBe(200);
    const memberList = expectResponseData(
      memberListResponse,
      memberDiscipleshipAssignmentListResponseSchema,
      "member discipleship list"
    );
    expect(memberList.items.map((item) => item.id)).toContain(assignment.id);
    const memberPayload = JSON.stringify(memberListResponse.json());
    expect(memberPayload).not.toContain("assigneeAdminUserId");
    expect(memberPayload).not.toContain("sourceType");
    expect(memberPayload).not.toContain("sourceId");
    expect(memberPayload).not.toContain('"note"');

    const forgedCompletionTimeResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/discipleship/assignments/${assignment.id}/tasks/${task.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "completed",
        note: "Attempted client timestamp",
        completedAt: "2000-01-01T00:00:00.000Z"
      }
    });
    expect(forgedCompletionTimeResponse.statusCode).toBe(400);

    const progressResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/discipleship/assignments/${assignment.id}/tasks/${task.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "completed",
        note: "Member completed the first reading conversation."
      }
    });
    expect(progressResponse.statusCode).toBe(200);
    const progress = expectResponseData(
      progressResponse,
      discipleshipTaskProgressSchema,
      "discipleship task progress update"
    );
    expect(progress).toMatchObject({
      assignmentId: assignment.id,
      taskId: task.id,
      status: "completed"
    });
    expect(progress.completedAt).toEqual(expect.any(String));

    const adminAssignmentResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/discipleship/assignments?userId=${member.memberId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(adminAssignmentResponse.statusCode).toBe(200);
    const adminAssignments = expectResponseData(
      adminAssignmentResponse,
      discipleshipAssignmentListResponseSchema,
      "admin discipleship assignment list"
    );
    expect(adminAssignments.items[0]?.progress[0]).toMatchObject({
      taskId: task.id,
      status: "completed",
      note: "Member completed the first reading conversation."
    });
    expect(adminAssignments.items[0]).toMatchObject({
      status: "completed",
      taskTotalCount: 1,
      completedTaskCount: 1
    });
    expect(adminAssignments.items[0]?.completedAt).toEqual(expect.any(String));

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=discipleship_task_progress&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "discipleship progress audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      assignmentId: assignment.id,
      taskId: task.id,
      status: "completed",
      hasNote: true
    });
    expect(JSON.stringify(auditResponse.json())).not.toContain(
      "first reading conversation"
    );

    const reviewResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/discipleship/assignments/${assignment.id}/tasks/${task.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "needs_review",
        note: "Sensitive pastoral follow-up note."
      }
    });
    expect(reviewResponse.statusCode).toBe(200);
    const reviewProgress = expectResponseData(
      reviewResponse,
      discipleshipTaskProgressSchema,
      "discipleship task progress review update"
    );
    expect(reviewProgress).toMatchObject({
      assignmentId: assignment.id,
      taskId: task.id,
      status: "needs_review",
      completedAt: null
    });

    const reviewAssignmentResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/discipleship/assignments?userId=${member.memberId}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(reviewAssignmentResponse.statusCode).toBe(200);
    const reviewAssignments = expectResponseData(
      reviewAssignmentResponse,
      discipleshipAssignmentListResponseSchema,
      "admin discipleship assignment review list"
    );
    expect(reviewAssignments.items[0]).toMatchObject({
      status: "in_progress",
      completedAt: null,
      taskTotalCount: 1,
      completedTaskCount: 0
    });
    expect(reviewAssignments.items[0]?.progress[0]).toMatchObject({
      taskId: task.id,
      status: "needs_review",
      completedAt: null
    });

    const reviewAuditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=discipleship_task_progress&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(reviewAuditResponse.statusCode).toBe(200);
    const reviewAudit = expectResponseData(
      reviewAuditResponse,
      auditLogListResponseSchema,
      "discipleship progress review audit"
    );
    const reviewAuditItem = reviewAudit.items.find(
      (item) =>
        (item.afterJson as { status?: string } | null)?.status ===
        "needs_review"
    );
    expect(reviewAuditItem?.afterJson).toMatchObject({
      assignmentId: assignment.id,
      taskId: task.id,
      status: "needs_review",
      hasNote: true
    });
    expect(JSON.stringify(reviewAuditResponse.json())).not.toContain(
      "Sensitive pastoral follow-up note"
    );

    await harness.close();
  });
});
