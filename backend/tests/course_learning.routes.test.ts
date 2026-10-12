import {
  auditLogListResponseSchema,
  courseEnrollmentListResponseSchema,
  courseEnrollmentSchema,
  courseLessonSchema,
  courseListResponseSchema,
  courseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("course learning routes", () => {
  it("keeps catalog, enrollment, capacity, progress, and history canonical", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "course-member@example.com",
      displayName: "Course Member"
    });
    const waitlistedMember = await loginMember(app, {
      email: "course-waitlist@example.com",
      displayName: "Waitlisted Member"
    });

    const course = expectResponseData(
      await app.inject({
        method: "POST",
        url: "/v1/admin/courses",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          title: "Membership Foundations",
          description: "A class for new members.",
          teacherName: "Pastor Lee",
          location: "Room 202",
          scheduleText: "Sundays 9 AM",
          visibility: "members",
          status: "open",
          capacity: 1
        }
      }),
      courseSchema,
      "admin course create"
    );
    const courseId = course.id;
    expect(course).toMatchObject({ status: "open", enrolledCount: 0 });

    const publicCourse = expectResponseData(
      await app.inject({
        method: "POST",
        url: "/v1/admin/courses",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          title: "Open Bible Class",
          visibility: "public",
          status: "open"
        }
      }),
      courseSchema,
      "admin public course create"
    );
    const draftCourse = expectResponseData(
      await app.inject({
        method: "POST",
        url: "/v1/admin/courses",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          title: "Draft Member Class",
          visibility: "public",
          status: "draft"
        }
      }),
      courseSchema,
      "admin draft course create"
    );

    const anonymousCatalog = expectResponseData(
      await app.inject({ method: "GET", url: "/v1/courses" }),
      courseListResponseSchema,
      "anonymous course catalog"
    );
    expect(anonymousCatalog.items.map((item) => item.id)).toContain(
      publicCourse.id
    );
    expect(anonymousCatalog.items.map((item) => item.id)).not.toContain(courseId);
    expect(anonymousCatalog.items.map((item) => item.id)).not.toContain(
      draftCourse.id
    );

    const draftDetail = await app.inject({
      method: "GET",
      url: `/v1/courses/${draftCourse.id}`,
      headers: { authorization: `Bearer ${member.accessToken}` }
    });
    expect(draftDetail.statusCode).toBe(404);

    const lesson = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/admin/courses/${courseId}/lessons`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          title: "Belonging to the Church",
          description: "Membership and fellowship.",
          startsAt: "2026-06-28T16:00:00.000Z",
          status: "published",
          sortOrder: 1
        }
      }),
      courseLessonSchema,
      "admin course lesson create"
    );
    expect(lesson).toMatchObject({ courseId, status: "published" });

    const memberCatalog = expectResponseData(
      await app.inject({
        method: "GET",
        url: "/v1/courses",
        headers: { authorization: `Bearer ${member.accessToken}` }
      }),
      courseListResponseSchema,
      "member course catalog"
    );
    expect(memberCatalog.items.map((item) => item.id)).toContain(courseId);

    const enrollment = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/courses/${courseId}/enrollments`,
        headers: { authorization: `Bearer ${member.accessToken}` },
        payload: { note: "I want to join this class." }
      }),
      courseEnrollmentSchema,
      "member course enrollment"
    );
    expect(enrollment).toMatchObject({
      courseId,
      status: "enrolled",
      memberEmail: "course-member@example.com"
    });

    const duplicateEnrollment = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/courses/${courseId}/enrollments`,
        headers: { authorization: `Bearer ${member.accessToken}` },
        payload: {}
      }),
      courseEnrollmentSchema,
      "duplicate member course enrollment"
    );
    expect(duplicateEnrollment.id).toBe(enrollment.id);

    expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${courseId}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "closed" }
      }),
      courseSchema,
      "close course with active enrollment"
    );
    const closedCourseRetry = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/courses/${courseId}/enrollments`,
        headers: { authorization: `Bearer ${member.accessToken}` },
        payload: {}
      }),
      courseEnrollmentSchema,
      "retry active enrollment after course closes"
    );
    expect(closedCourseRetry.id).toBe(enrollment.id);
    expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${courseId}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "open" }
      }),
      courseSchema,
      "reopen course after retry"
    );

    const waitlistedEnrollment = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/courses/${courseId}/enrollments`,
        headers: { authorization: `Bearer ${waitlistedMember.accessToken}` },
        payload: {}
      }),
      courseEnrollmentSchema,
      "capacity waitlist enrollment"
    );
    expect(waitlistedEnrollment.status).toBe("waitlisted");

    const overCapacityPromotion = await app.inject({
      method: "PATCH",
      url: `/v1/admin/courses/${courseId}/enrollments/${waitlistedEnrollment.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "enrolled" }
    });
    expect(overCapacityPromotion.statusCode).toBe(409);
    expect(overCapacityPromotion.json().error.code).toBe(
      "course_capacity_exceeded"
    );

    const waitlistProgress = await app.inject({
      method: "PATCH",
      url: `/v1/admin/courses/${courseId}/enrollments/${waitlistedEnrollment.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { completedLessonCount: 1 }
    });
    expect(waitlistProgress.statusCode).toBe(409);
    expect(waitlistProgress.json().error.code).toBe(
      "course_enrollment_progress_unavailable"
    );

    const enrollments = expectResponseData(
      await app.inject({
        method: "GET",
        url: `/v1/admin/courses/${courseId}/enrollments`,
        headers: { authorization: `Bearer ${accessToken}` }
      }),
      courseEnrollmentListResponseSchema,
      "admin course enrollments"
    );
    expect(enrollments.items).toHaveLength(2);

    const invalidProgress = await app.inject({
      method: "PATCH",
      url: `/v1/admin/courses/${courseId}/enrollments/${enrollment.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { completedLessonCount: 2 }
    });
    expect(invalidProgress.statusCode).toBe(409);
    expect(invalidProgress.json().error).toMatchObject({
      code: "course_progress_out_of_range",
      evidence: { completedLessonCount: 2, lessonCount: 1 }
    });

    const progress = expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${courseId}/enrollments/${enrollment.id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "completed", completedLessonCount: 1 }
      }),
      courseEnrollmentSchema,
      "admin course progress update"
    );
    expect(progress).toMatchObject({
      status: "completed",
      completedLessonCount: 1
    });

    const cancelled = expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${courseId}/enrollments/${waitlistedEnrollment.id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "cancelled" }
      }),
      courseEnrollmentSchema,
      "admin cancel waitlisted enrollment"
    );
    expect(cancelled.status).toBe("cancelled");

    const myCourses = expectResponseData(
      await app.inject({
        method: "GET",
        url: "/v1/me/courses",
        headers: { authorization: `Bearer ${member.accessToken}` }
      }),
      courseListResponseSchema,
      "member course history"
    );
    expect(myCourses.items.find((item) => item.id === courseId)).toMatchObject({
      myEnrollmentStatus: "completed",
      myCompletedLessonCount: 1,
      lessonCount: 1
    });

    const completedCourse = expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${courseId}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "completed" }
      }),
      courseSchema,
      "admin complete course"
    );
    expect(completedCourse.status).toBe("completed");

    const reopenCompletedCourse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/courses/${courseId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: "open" }
    });
    expect(reopenCompletedCourse.statusCode).toBe(409);
    expect(reopenCompletedCourse.json().error.code).toBe(
      "course_status_transition_invalid"
    );

    expect(
      (
        await app.inject({ method: "GET", url: `/v1/courses/${courseId}` })
      ).statusCode
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/v1/courses/${courseId}`,
          headers: { authorization: `Bearer ${member.accessToken}` }
        })
      ).statusCode
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/v1/courses/${courseId}`,
          headers: { authorization: `Bearer ${waitlistedMember.accessToken}` }
        })
      ).statusCode
    ).toBe(404);

    const closedEnrollment = await app.inject({
      method: "POST",
      url: `/v1/courses/${courseId}/enrollments`,
      headers: { authorization: `Bearer ${member.accessToken}` },
      payload: {}
    });
    expect(closedEnrollment.statusCode).toBe(409);
    expect(closedEnrollment.json().error.code).toBe("course_enrollment_closed");

    const audit = expectResponseData(
      await app.inject({
        method: "GET",
        url: "/v1/admin/audit-logs?resourceType=course_enrollment&limit=20",
        headers: { authorization: `Bearer ${accessToken}` }
      }),
      auditLogListResponseSchema,
      "course enrollment audit"
    );
    expect(audit.items.map((log) => log.action)).toEqual(
      expect.arrayContaining([
        "course.enrollment.submit",
        "course.enrollment.duplicate",
        "course.enrollment.update"
      ])
    );

    await harness.close();
  });

  it("clears progress when an enrollment is cancelled", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const member = await loginMember(app, {
      email: "course-cancel@example.com",
      displayName: "Course Cancel Member"
    });
    const course = expectResponseData(
      await app.inject({
        method: "POST",
        url: "/v1/admin/courses",
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          title: "Course Cancellation",
          visibility: "members",
          status: "open"
        }
      }),
      courseSchema,
      "course cancellation create"
    );
    expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/admin/courses/${course.id}/lessons`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { title: "Lesson one", status: "published", sortOrder: 0 }
      }),
      courseLessonSchema,
      "course cancellation lesson"
    );
    const enrollment = expectResponseData(
      await app.inject({
        method: "POST",
        url: `/v1/courses/${course.id}/enrollments`,
        headers: { authorization: `Bearer ${member.accessToken}` },
        payload: {}
      }),
      courseEnrollmentSchema,
      "course cancellation enrollment"
    );
    const progressed = expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${course.id}/enrollments/${enrollment.id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { completedLessonCount: 1 }
      }),
      courseEnrollmentSchema,
      "course cancellation progress"
    );
    expect(progressed.completedLessonCount).toBe(1);

    const emptyUpdate = await app.inject({
      method: "PATCH",
      url: `/v1/admin/courses/${course.id}/enrollments/${enrollment.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {}
    });
    expect(emptyUpdate.statusCode).toBe(400);

    const cancelled = expectResponseData(
      await app.inject({
        method: "PATCH",
        url: `/v1/admin/courses/${course.id}/enrollments/${enrollment.id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: "cancelled" }
      }),
      courseEnrollmentSchema,
      "course cancellation canonical state"
    );
    expect(cancelled).toMatchObject({
      status: "cancelled",
      completedLessonCount: 0
    });

    const myCourses = expectResponseData(
      await app.inject({
        method: "GET",
        url: "/v1/me/courses",
        headers: { authorization: `Bearer ${member.accessToken}` }
      }),
      courseListResponseSchema,
      "cancelled course history"
    );
    expect(myCourses.items.map((item) => item.id)).not.toContain(course.id);

    await harness.close();
  });

  it("enforces course read and manage permissions independently", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createViewer = await app.inject({
      method: "POST",
      url: "/v1/admin/users",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        email: "course-viewer@example.com",
        name: "Course Viewer",
        role: "viewer",
        password: "viewerpass123"
      }
    });
    expect(createViewer.statusCode).toBe(200);
    const viewerLogin = await app.inject({
      method: "POST",
      url: "/v1/admin/auth/login",
      payload: {
        email: "course-viewer@example.com",
        password: "viewerpass123"
      }
    });
    const viewerToken = viewerLogin.json().data.accessToken as string;

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/courses",
      headers: { authorization: `Bearer ${viewerToken}` }
    });
    expect(listResponse.statusCode).toBe(200);
    expectResponseData(listResponse, courseListResponseSchema, "viewer courses");

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/courses",
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: { title: "Forbidden course" }
    });
    expect(createResponse.statusCode).toBe(403);

    await harness.close();
  });
});
