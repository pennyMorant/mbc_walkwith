import type { CourseEnrollment, CourseLesson } from "@mbc/api-contracts";

import {
  courseEnrollments,
  courseLessons
} from "../../shared/db/schema.js";

export function courseLessonFromRow(
  row: typeof courseLessons.$inferSelect
): CourseLesson {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt?.toISOString() ?? null,
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function courseEnrollmentFromRow(
  row: typeof courseEnrollments.$inferSelect
): CourseEnrollment {
  return {
    id: row.id,
    courseId: row.courseId,
    userId: row.userId,
    memberDisplayName: row.memberDisplayName,
    memberEmail: row.memberEmail,
    status: row.status,
    note: row.note,
    completedLessonCount: row.completedLessonCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}
