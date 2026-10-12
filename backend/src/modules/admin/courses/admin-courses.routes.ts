import {
  courseEnrollmentListQuerySchema,
  courseEnrollmentUpdateRequestSchema,
  courseLessonUpdateRequestSchema,
  courseLessonUpsertRequestSchema,
  courseListQuerySchema,
  courseUpdateRequestSchema,
  courseUpsertRequestSchema,
  type AdminPermission,
  type Course,
  type CourseEnrollment,
  type CourseLesson
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import type { CourseService } from "../../courses/course.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminCourseRoutes(
  app: FastifyInstance,
  service: CourseService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/courses",
    { preHandler: permissionPreHandler("courses:read") },
    async (request) => {
      const query = courseListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.post(
    "/v1/admin/courses",
    { preHandler: permissionPreHandler("courses:manage") },
    async (request) => {
      const body = courseUpsertRequestSchema.parse(request.body);
      const course = await service.create(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "course.create",
        resourceType: "course",
        resourceId: course.id,
        afterJson: courseAuditSnapshot(course)
      });
      return ok(course);
    }
  );

  app.patch(
    "/v1/admin/courses/:courseId",
    { preHandler: permissionPreHandler("courses:manage") },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      const body = courseUpdateRequestSchema.parse(request.body);
      const before = await service.getById(params.courseId);
      const course = await service.update(params.courseId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "course.update",
        resourceType: "course",
        resourceId: course.id,
        beforeJson: before ? courseAuditSnapshot(before) : null,
        afterJson: courseAuditSnapshot(course)
      });
      return ok(course);
    }
  );

  app.get(
    "/v1/admin/courses/:courseId/lessons",
    { preHandler: permissionPreHandler("courses:read") },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      return ok({ items: await service.listLessons(params.courseId) });
    }
  );

  app.post(
    "/v1/admin/courses/:courseId/lessons",
    { preHandler: permissionPreHandler("courses:manage") },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      const body = courseLessonUpsertRequestSchema.parse(request.body);
      const lesson = await service.createLesson(params.courseId, body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "course.lesson.create",
        resourceType: "course_lesson",
        resourceId: lesson.id,
        afterJson: lessonAuditSnapshot(lesson)
      });
      return ok(lesson);
    }
  );

  app.patch(
    "/v1/admin/courses/:courseId/lessons/:lessonId",
    { preHandler: permissionPreHandler("courses:manage") },
    async (request) => {
      const params = lessonParamsSchema.parse(request.params);
      const body = courseLessonUpdateRequestSchema.parse(request.body);
      const lesson = await service.updateLesson(
        params.courseId,
        params.lessonId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "course.lesson.update",
        resourceType: "course_lesson",
        resourceId: lesson.id,
        afterJson: lessonAuditSnapshot(lesson)
      });
      return ok(lesson);
    }
  );

  app.get(
    "/v1/admin/courses/:courseId/enrollments",
    { preHandler: permissionPreHandler("courses:read") },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      const query = courseEnrollmentListQuerySchema.parse(request.query);
      return ok({ items: await service.listEnrollments(params.courseId, query) });
    }
  );

  app.patch(
    "/v1/admin/courses/:courseId/enrollments/:enrollmentId",
    { preHandler: permissionPreHandler("courses:manage") },
    async (request) => {
      const params = enrollmentParamsSchema.parse(request.params);
      const body = courseEnrollmentUpdateRequestSchema.parse(request.body ?? {});
      const enrollment = await service.updateEnrollment(
        params.courseId,
        params.enrollmentId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "course.enrollment.update",
        resourceType: "course_enrollment",
        resourceId: enrollment.id,
        afterJson: enrollmentAuditSnapshot(enrollment)
      });
      return ok(enrollment);
    }
  );
}

const courseParamsSchema = z.object({
  courseId: z.string()
});

const lessonParamsSchema = courseParamsSchema.extend({
  lessonId: z.string()
});

const enrollmentParamsSchema = courseParamsSchema.extend({
  enrollmentId: z.string()
});

function courseAuditSnapshot(course: Course) {
  return {
    id: course.id,
    status: course.status,
    visibility: course.visibility,
    capacity: course.capacity,
    enrolledCount: course.enrolledCount,
    lessonCount: course.lessonCount
  };
}

function lessonAuditSnapshot(lesson: CourseLesson) {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    status: lesson.status,
    sortOrder: lesson.sortOrder
  };
}

function enrollmentAuditSnapshot(enrollment: CourseEnrollment) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    userId: enrollment.userId,
    status: enrollment.status,
    completedLessonCount: enrollment.completedLessonCount
  };
}
