import {
  auditLogListResponseSchema,
  readingPlanAssignmentDetailSchema,
  readingPlanAssignmentListResponseSchema,
  readingPlanAssignmentSchema,
  readingPlanDayListResponseSchema,
  readingPlanDayProgressSchema,
  readingPlanDaySchema,
  readingPlanListResponseSchema,
  readingPlanSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("reading plan routes", () => {
  it("supports published plan references, assignments, and progress without Bible text", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const member = await loginMember(app, {
      email: "reading-plan-member@example.com",
      displayName: "Reading Plan Member"
    });

    const directPublishResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Invalid Published Plan",
        status: "published",
        visibility: "public",
        locale: "en",
        durationDays: 1
      }
    });
    expect(directPublishResponse.statusCode).toBe(409);
    expect(directPublishResponse.json().error).toMatchObject({
      code: "reading_plan_transition_invalid",
      evidence: {
        fromStatus: "new",
        toStatus: "published",
        reason: "new_plan_must_start_as_draft"
      }
    });

    const planResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "One Day in John",
        description: "A focused church reading plan.",
        status: "draft",
        visibility: "public",
        locale: "en",
        durationDays: 1
      }
    });
    expect(planResponse.statusCode).toBe(200);
    const planDraft = expectResponseData(
      planResponse,
      readingPlanSchema,
      "reading plan create"
    );
    expect(planDraft).toMatchObject({
      title: "One Day in John",
      status: "draft",
      visibility: "public"
    });

    const dayResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/reading-plans/${planDraft.id}/days`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        dayNumber: 1,
        title: "Abide in the Word",
        references: [
          {
            bookId: "john",
            chapter: 1,
            startVerse: 1,
            endVerse: 18,
            referenceLabel: "John 1:1-18"
          }
        ]
      }
    });
    expect(dayResponse.statusCode).toBe(200);
    const day = expectResponseData(
      dayResponse,
      readingPlanDaySchema,
      "reading plan day upsert"
    );
    expect(day.references[0]).toMatchObject({
      bookId: "john",
      chapter: 1,
      startVerse: 1,
      endVerse: 18
    });

    const publishPlanResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${planDraft.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "published"
      }
    });
    expect(publishPlanResponse.statusCode).toBe(200);
    const plan = expectResponseData(
      publishPlanResponse,
      readingPlanSchema,
      "reading plan publish"
    );
    expect(plan.status).toBe("published");

    const lockedDayResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/reading-plans/${plan.id}/days`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        dayNumber: 1,
        title: "Changed after publication",
        references: [
          {
            bookId: "john",
            chapter: 1,
            startVerse: 1,
            endVerse: 18
          }
        ]
      }
    });
    expect(lockedDayResponse.statusCode).toBe(409);
    expect(lockedDayResponse.json().error).toMatchObject({
      code: "reading_plan_transition_invalid",
      evidence: { reason: "plan_days_locked" }
    });

    const lockedContentResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${plan.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Changed without pausing"
      }
    });
    expect(lockedContentResponse.statusCode).toBe(409);
    expect(lockedContentResponse.json().error).toMatchObject({
      code: "reading_plan_transition_invalid",
      evidence: { reason: "plan_content_locked" }
    });

    const publicPlanResponse = await app.inject({
      method: "GET",
      url: "/v1/reading-plans"
    });
    expect(publicPlanResponse.statusCode).toBe(200);
    const publicPlans = expectResponseData(
      publicPlanResponse,
      readingPlanListResponseSchema,
      "public reading plan list"
    );
    expect(publicPlans.items.map((item) => item.id)).toContain(plan.id);

    const publicDayResponse = await app.inject({
      method: "GET",
      url: `/v1/reading-plans/${plan.id}/days`
    });
    expect(publicDayResponse.statusCode).toBe(200);
    const publicDays = expectResponseData(
      publicDayResponse,
      readingPlanDayListResponseSchema,
      "public reading plan days"
    );
    expect(publicDays.items).toHaveLength(1);
    expect(JSON.stringify(publicDayResponse.json())).not.toContain(
      "In the beginning"
    );

    const draftPlanResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Draft Reading Plan",
        description: "Not ready to assign.",
        status: "draft",
        visibility: "public",
        locale: "en",
        durationDays: 3
      }
    });
    expect(draftPlanResponse.statusCode).toBe(200);
    const draftPlan = expectResponseData(
      draftPlanResponse,
      readingPlanSchema,
      "draft reading plan create"
    );

    const draftAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        planId: draftPlan.id,
        userType: "member",
        userId: member.memberId,
        sourceType: "admin"
      }
    });
    expect(draftAssignmentResponse.statusCode).toBe(409);
    expect(draftAssignmentResponse.json().error).toMatchObject({
      code: "reading_plan_assignment_closed",
      evidence: {
        planId: draftPlan.id,
        status: "draft"
      }
    });

    const outOfRangeDayResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/reading-plans/${draftPlan.id}/days`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        dayNumber: 4,
        references: [
          {
            bookId: "john",
            chapter: 2,
            startVerse: 1,
            endVerse: 5
          }
        ]
      }
    });
    expect(outOfRangeDayResponse.statusCode).toBe(400);
    expect(outOfRangeDayResponse.json().error).toMatchObject({
      code: "reading_plan_day_out_of_range",
      evidence: {
        planId: draftPlan.id,
        dayNumber: 4,
        durationDays: 3
      }
    });

    const incompletePublishResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${draftPlan.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        status: "published"
      }
    });
    expect(incompletePublishResponse.statusCode).toBe(409);
    expect(incompletePublishResponse.json().error).toMatchObject({
      code: "reading_plan_publish_incomplete",
      evidence: {
        planId: draftPlan.id,
        durationDays: 3,
        missingDayNumbers: [1, 2, 3]
      }
    });

    const membersOnlyPlanResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        title: "Members Only Reading Plan",
        description: "For signed-in members.",
        status: "draft",
        visibility: "members",
        locale: "en",
        durationDays: 1
      }
    });
    expect(membersOnlyPlanResponse.statusCode).toBe(200);
    const membersOnlyPlanDraft = expectResponseData(
      membersOnlyPlanResponse,
      readingPlanSchema,
      "members-only reading plan draft create"
    );

    const membersOnlyDayResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/reading-plans/${membersOnlyPlanDraft.id}/days`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        dayNumber: 1,
        references: [
          {
            bookId: "john",
            chapter: 3,
            startVerse: 16,
            endVerse: 21
          }
        ]
      }
    });
    expect(membersOnlyDayResponse.statusCode).toBe(200);

    const publishMembersOnlyPlanResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${membersOnlyPlanDraft.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: { status: "published" }
    });
    expect(publishMembersOnlyPlanResponse.statusCode).toBe(200);
    const membersOnlyPlan = expectResponseData(
      publishMembersOnlyPlanResponse,
      readingPlanSchema,
      "members-only reading plan publish"
    );

    const externalPlanListResponse = await app.inject({
      method: "GET",
      url: "/v1/reading-plans",
      headers: { "x-external-user-id": "ext_reading_plan_browser" }
    });
    expect(externalPlanListResponse.statusCode).toBe(200);
    const externalPlanList = expectResponseData(
      externalPlanListResponse,
      readingPlanListResponseSchema,
      "external reading plan list"
    );
    expect(externalPlanList.items.map((item) => item.id)).toContain(plan.id);
    expect(externalPlanList.items.map((item) => item.id)).not.toContain(
      membersOnlyPlan.id
    );

    const memberPlanListResponse = await app.inject({
      method: "GET",
      url: "/v1/reading-plans",
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(memberPlanListResponse.statusCode).toBe(200);
    const memberPlanList = expectResponseData(
      memberPlanListResponse,
      readingPlanListResponseSchema,
      "member reading plan list"
    );
    expect(memberPlanList.items.map((item) => item.id)).toContain(
      membersOnlyPlan.id
    );

    const externalMembersOnlyAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        planId: membersOnlyPlan.id,
        userType: "external",
        userId: "ext_reading_plan_guest_002",
        sourceType: "admin"
      }
    });
    expect(externalMembersOnlyAssignmentResponse.statusCode).toBe(403);
    expect(externalMembersOnlyAssignmentResponse.json().error).toMatchObject({
      code: "reading_plan_permission_denied"
    });

    const externalId = "ext_reading_plan_guest_001";
    const [externalAssignmentResponse, duplicateAssignmentResponse] =
      await Promise.all([
        app.inject({
          method: "POST",
          url: `/v1/reading-plans/${plan.id}/assignments`,
          headers: {
            "x-external-user-id": externalId
          }
        }),
        app.inject({
          method: "POST",
          url: `/v1/reading-plans/${plan.id}/assignments`,
          headers: {
            "x-external-user-id": externalId
          }
        })
      ]);
    expect(externalAssignmentResponse.statusCode).toBe(200);
    expect(duplicateAssignmentResponse.statusCode).toBe(200);
    const externalAssignment = expectResponseData(
      externalAssignmentResponse,
      readingPlanAssignmentSchema,
      "external reading plan assignment"
    );
    expect(externalAssignment).toMatchObject({
      planId: plan.id,
      planTitle: "One Day in John",
      planDurationDays: 1,
      attemptNumber: 1,
      userType: "external",
      userId: externalId,
      status: "not_started"
    });
    const duplicateAssignment = expectResponseData(
      duplicateAssignmentResponse,
      readingPlanAssignmentSchema,
      "duplicate external reading plan assignment"
    );
    expect(duplicateAssignment.id).toBe(externalAssignment.id);

    const progressResponse = await app.inject({
      method: "PATCH",
      url: `/v1/reading-plans/assignments/${externalAssignment.id}/days/${day.id}`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        status: "completed",
        note: "Finished day one.",
        completedAt: "2020-01-01T00:00:00.000Z"
      }
    });
    expect(progressResponse.statusCode).toBe(200);
    const progress = expectResponseData(
      progressResponse,
      readingPlanDayProgressSchema,
      "external reading plan progress"
    );
    expect(progress).toMatchObject({
      assignmentId: externalAssignment.id,
      dayId: day.id,
      status: "completed"
    });
    expect(progress.completedAt).toEqual(expect.any(String));
    expect(progress.completedAt).not.toBe("2020-01-01T00:00:00.000Z");

    const externalAssignmentsResponse = await app.inject({
      method: "GET",
      url: "/v1/me/reading-plans",
      headers: {
        "x-external-user-id": externalId
      }
    });
    expect(externalAssignmentsResponse.statusCode).toBe(200);
    const externalAssignments = expectResponseData(
      externalAssignmentsResponse,
      readingPlanAssignmentListResponseSchema,
      "external reading plan assignment list"
    );
    expect(externalAssignments.items[0]?.progress[0]).toMatchObject({
      dayId: day.id,
      status: "completed"
    });
    expect(externalAssignments.items[0]).toMatchObject({
      status: "completed"
    });
    expect(externalAssignments.items[0]?.completedAt).toEqual(
      expect.any(String)
    );

    const missedProgressResponse = await app.inject({
      method: "PATCH",
      url: `/v1/reading-plans/assignments/${externalAssignment.id}/days/${day.id}`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: {
        status: "missed",
        note: "Need to revisit this reading."
      }
    });
    expect(missedProgressResponse.statusCode).toBe(409);
    expect(missedProgressResponse.json().error).toMatchObject({
      code: "reading_plan_progress_closed",
      evidence: {
        assignmentId: externalAssignment.id,
        assignmentStatus: "completed"
      }
    });

    const historyAssignmentsResponse = await app.inject({
      method: "GET",
      url: "/v1/me/reading-plans?scope=history",
      headers: {
        "x-external-user-id": externalId
      }
    });
    expect(historyAssignmentsResponse.statusCode).toBe(200);
    const historyAssignments = expectResponseData(
      historyAssignmentsResponse,
      readingPlanAssignmentListResponseSchema,
      "external reading plan history"
    );
    expect(historyAssignments.items).toHaveLength(1);
    expect(historyAssignments.items[0]).toMatchObject({
      id: externalAssignment.id,
      status: "completed",
      attemptNumber: 1
    });
    expect(historyAssignments.items[0]?.endedAt).toEqual(expect.any(String));

    const historyDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/me/reading-plans/${externalAssignment.id}`,
      headers: { "x-external-user-id": externalId }
    });
    expect(historyDetailResponse.statusCode).toBe(200);
    const historyDetail = expectResponseData(
      historyDetailResponse,
      readingPlanAssignmentDetailSchema,
      "external reading plan history detail"
    );
    expect(historyDetail.assignment.id).toBe(externalAssignment.id);
    expect(historyDetail.days[0]?.id).toBe(day.id);
    expect(historyDetail.canRestart).toBe(true);

    const repeatedAssignmentResponse = await app.inject({
      method: "POST",
      url: `/v1/reading-plans/${plan.id}/assignments`,
      headers: { "x-external-user-id": externalId }
    });
    expect(repeatedAssignmentResponse.statusCode).toBe(200);
    const repeatedAssignment = expectResponseData(
      repeatedAssignmentResponse,
      readingPlanAssignmentSchema,
      "repeated reading plan assignment"
    );
    expect(repeatedAssignment).toMatchObject({
      planId: plan.id,
      status: "not_started",
      attemptNumber: 2
    });
    expect(repeatedAssignment.id).not.toBe(externalAssignment.id);

    const activeAssignmentsResponse = await app.inject({
      method: "GET",
      url: "/v1/me/reading-plans?scope=active",
      headers: { "x-external-user-id": externalId }
    });
    const activeAssignments = expectResponseData(
      activeAssignmentsResponse,
      readingPlanAssignmentListResponseSchema,
      "external active reading plan assignments"
    );
    expect(activeAssignments.items.map((item) => item.id)).toEqual([
      repeatedAssignment.id
    ]);

    const historyWithOpenAttemptResponse = await app.inject({
      method: "GET",
      url: `/v1/me/reading-plans/${externalAssignment.id}`,
      headers: { "x-external-user-id": externalId }
    });
    const historyWithOpenAttempt = expectResponseData(
      historyWithOpenAttemptResponse,
      readingPlanAssignmentDetailSchema,
      "history with open reading plan attempt"
    );
    expect(historyWithOpenAttempt.canRestart).toBe(false);

    for (const finalStatus of [
      "active",
      "paused",
      "active",
      "abandoned"
    ] as const) {
      const lifecycleResponse = await app.inject({
        method: "PATCH",
        url: `/v1/reading-plans/assignments/${repeatedAssignment.id}/status`,
        headers: { "x-external-user-id": externalId },
        payload: { status: finalStatus }
      });
      expect(lifecycleResponse.statusCode).toBe(200);
      expect(
        expectResponseData(
          lifecycleResponse,
          readingPlanAssignmentSchema,
          `reading plan assignment ${finalStatus}`
        ).status
      ).toBe(finalStatus);
    }

    const closedTransitionResponse = await app.inject({
      method: "PATCH",
      url: `/v1/reading-plans/assignments/${repeatedAssignment.id}/status`,
      headers: { "x-external-user-id": externalId },
      payload: { status: "active" }
    });
    expect(closedTransitionResponse.statusCode).toBe(409);
    expect(closedTransitionResponse.json().error).toMatchObject({
      code: "reading_plan_assignment_transition_invalid"
    });

    const missingMemberAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        planId: plan.id,
        userType: "member",
        userId: "00000000-0000-4000-8000-000000000099",
        sourceType: "admin"
      }
    });
    expect(missingMemberAssignmentResponse.statusCode).toBe(404);
    expect(missingMemberAssignmentResponse.json().error).toMatchObject({
      code: "reading_plan_assignment_user_not_found",
      evidence: {
        userType: "member",
        userId: "00000000-0000-4000-8000-000000000099"
      }
    });

    const adminAssignmentResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/reading-plans/assignments",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        planId: plan.id,
        userType: "member",
        userId: member.memberId,
        sourceType: "admin"
      }
    });
    expect(adminAssignmentResponse.statusCode).toBe(200);
    const memberAssignment = expectResponseData(
      adminAssignmentResponse,
      readingPlanAssignmentSchema,
      "admin member reading plan assignment"
    );
    expect(memberAssignment).toMatchObject({
      planId: plan.id,
      userType: "member",
      userId: member.memberId
    });

    const pausePlanResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${plan.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: { status: "paused" }
    });
    expect(pausePlanResponse.statusCode).toBe(200);

    const pausedPlanHistoryDetailResponse = await app.inject({
      method: "GET",
      url: `/v1/me/reading-plans/${externalAssignment.id}`,
      headers: { "x-external-user-id": externalId }
    });
    const pausedPlanHistoryDetail = expectResponseData(
      pausedPlanHistoryDetailResponse,
      readingPlanAssignmentDetailSchema,
      "paused plan reading history detail"
    );
    expect(pausedPlanHistoryDetail.canRestart).toBe(false);

    const pausedProgressResponse = await app.inject({
      method: "PATCH",
      url: `/v1/reading-plans/assignments/${externalAssignment.id}/days/${day.id}`,
      headers: {
        "x-external-user-id": externalId
      },
      payload: { status: "completed" }
    });
    expect(pausedProgressResponse.statusCode).toBe(409);
    expect(pausedProgressResponse.json().error).toMatchObject({
      code: "reading_plan_progress_closed",
      evidence: {
        planId: plan.id,
        assignmentId: externalAssignment.id,
        planStatus: "paused"
      }
    });

    const assignedDayEditResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/reading-plans/${plan.id}/days`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        dayNumber: 1,
        references: [
          {
            bookId: "john",
            chapter: 1,
            startVerse: 1,
            endVerse: 5
          }
        ]
      }
    });
    expect(assignedDayEditResponse.statusCode).toBe(409);
    expect(assignedDayEditResponse.json().error).toMatchObject({
      code: "reading_plan_structure_locked",
      evidence: { planId: plan.id }
    });

    const assignedDurationEditResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${plan.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: { durationDays: 2 }
    });
    expect(assignedDurationEditResponse.statusCode).toBe(409);
    expect(assignedDurationEditResponse.json().error).toMatchObject({
      code: "reading_plan_structure_locked",
      evidence: { planId: plan.id }
    });

    const pausedCopyEditResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/reading-plans/${plan.id}`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: { description: "Updated copy while the plan is paused." }
    });
    expect(pausedCopyEditResponse.statusCode).toBe(200);

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?resourceType=reading_plan_assignment&limit=20",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "reading plan assignment audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      planId: plan.id,
      userType: "member",
      sourceType: "admin"
    });

    await harness.close();
  });
});
