import {
  courseEnrollmentRequestSchema,
  courseListQuerySchema,
  type CourseEnrollment
} from "@mbc/api-contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ok } from "../../shared/http/api-response.js";
import type { AuditService } from "../audit/audit.service.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import {
  optionalMember,
  requireMember
} from "../members/auth/member-auth.middleware.js";
import type { CourseService } from "./course.service.js";

export async function registerCourseRoutes(
  app: FastifyInstance,
  service: CourseService,
  memberAuthService: MemberAuthService,
  auditService: AuditService
) {
  const optionalMemberPreHandler = optionalMember(memberAuthService);
  const memberPreHandler = requireMember(memberAuthService);

  app.get(
    "/v1/courses",
    { preHandler: optionalMemberPreHandler },
    async (request) => {
      const query = courseListQuerySchema.parse(request.query);
      return ok({
        items: await service.listVisible(query, request.member?.id ?? null)
      });
    }
  );

  app.get(
    "/v1/courses/:courseId",
    { preHandler: optionalMemberPreHandler },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      return ok(
        await service.getVisibleById(params.courseId, request.member?.id ?? null)
      );
    }
  );

  app.get(
    "/v1/me/courses",
    { preHandler: memberPreHandler },
    async (request) => ok({ items: await service.listMine(request.member!.id) })
  );

  app.post(
    "/v1/courses/:courseId/enrollments",
    { preHandler: memberPreHandler },
    async (request) => {
      const params = courseParamsSchema.parse(request.params);
      const body = courseEnrollmentRequestSchema.parse(request.body ?? {});
      const attempt = await service.enroll(
        params.courseId,
        request.member!,
        body
      );
      const enrollment = attempt.enrollment;
      await auditService.record({
        actorUserId: request.member!.id,
        action: attempt.created
          ? "course.enrollment.submit"
          : "course.enrollment.duplicate",
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

function enrollmentAuditSnapshot(enrollment: CourseEnrollment) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    userId: enrollment.userId,
    status: enrollment.status,
    completedLessonCount: enrollment.completedLessonCount,
    hasNote: enrollment.note.trim().length > 0
  };
}
