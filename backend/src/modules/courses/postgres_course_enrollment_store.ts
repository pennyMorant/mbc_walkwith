import type {
  CourseEnrollment,
  CourseEnrollmentListQuery,
  CourseEnrollmentUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import {
  courseEnrollments,
  courseLessons,
  courses
} from "../../shared/db/schema.js";
import type {
  CourseEnrollmentAttempt,
  CourseEnrollmentCreateInput,
  CourseEnrollmentStatusDecision,
  CourseEnrollmentUpdateDecision
} from "./course.repository.js";
import { courseEnrollmentFromRow } from "./postgres_course_mappers.js";

export class PostgresCourseEnrollmentStore {
  constructor(private readonly db: AppDb) {}

  async list(
    courseId: string,
    query: CourseEnrollmentListQuery
  ): Promise<CourseEnrollment[]> {
    const filters = [
      eq(courseEnrollments.courseId, courseId),
      query.status ? eq(courseEnrollments.status, query.status) : undefined,
      query.query
        ? or(
            ilike(courseEnrollments.memberDisplayName, `%${query.query}%`),
            ilike(courseEnrollments.memberEmail, `%${query.query}%`),
            ilike(courseEnrollments.note, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    const rows = await this.db
      .select()
      .from(courseEnrollments)
      .where(and(...filters))
      .orderBy(desc(courseEnrollments.updatedAt))
      .limit(query.limit);
    return rows.map(courseEnrollmentFromRow);
  }

  async getById(courseId: string, enrollmentId: string) {
    const [row] = await this.db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.id, enrollmentId)
        )
      )
      .limit(1);
    return row ? courseEnrollmentFromRow(row) : null;
  }

  async getLatestForUser(courseId: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          eq(courseEnrollments.userId, userId)
        )
      )
      .orderBy(desc(courseEnrollments.updatedAt))
      .limit(1);
    return row ? courseEnrollmentFromRow(row) : null;
  }

  async enroll(
    input: CourseEnrollmentCreateInput,
    decideStatus: CourseEnrollmentStatusDecision
  ): Promise<CourseEnrollmentAttempt | null> {
    return this.db.transaction(async (transaction) => {
      const [course] = await transaction
        .select({
          status: courses.status,
          visibility: courses.visibility,
          capacity: courses.capacity
        })
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .for("update")
        .limit(1);
      if (!course) {
        return null;
      }
      const [existing] = await transaction
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, input.courseId),
            eq(courseEnrollments.userId, input.userId),
            or(
              eq(courseEnrollments.status, "submitted"),
              eq(courseEnrollments.status, "enrolled"),
              eq(courseEnrollments.status, "waitlisted")
            )
          )
        )
        .orderBy(desc(courseEnrollments.updatedAt))
        .limit(1);
      if (existing) {
        return { enrollment: courseEnrollmentFromRow(existing), created: false };
      }
      const status = decideStatus({
        status: course.status,
        visibility: course.visibility,
        capacity: course.capacity,
        enrolledCount: await countEnrolled(transaction, input.courseId)
      });
      const [row] = await transaction
        .insert(courseEnrollments)
        .values({
          courseId: input.courseId,
          userId: input.userId,
          memberDisplayName: input.memberDisplayName,
          memberEmail: input.memberEmail,
          status,
          note: input.note?.trim() ?? "",
          updatedAt: new Date()
        })
        .returning();
      if (!row) {
        throw new Error("Failed to create course enrollment.");
      }
      await touchCourse(transaction, input.courseId);
      return { enrollment: courseEnrollmentFromRow(row), created: true };
    });
  }

  async update(
    courseId: string,
    enrollmentId: string,
    _input: CourseEnrollmentUpdateRequest,
    decide: CourseEnrollmentUpdateDecision
  ): Promise<CourseEnrollment | null> {
    return this.db.transaction(async (transaction) => {
      const [course] = await transaction
        .select({ status: courses.status, capacity: courses.capacity })
        .from(courses)
        .where(eq(courses.id, courseId))
        .for("update")
        .limit(1);
      if (!course) {
        return null;
      }
      const [enrollment] = await transaction
        .select()
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, courseId),
            eq(courseEnrollments.id, enrollmentId)
          )
        )
        .for("update")
        .limit(1);
      if (!enrollment) {
        return null;
      }
      const [lessonCountRow] = await transaction
        .select({ total: sql<number>`count(*)` })
        .from(courseLessons)
        .where(eq(courseLessons.courseId, courseId));
      const canonical = decide({
        courseStatus: course.status,
        capacity: course.capacity,
        enrolledCount: await countEnrolled(transaction, courseId),
        lessonCount: Number(lessonCountRow?.total ?? 0),
        enrollment: courseEnrollmentFromRow(enrollment)
      });
      const [row] = await transaction
        .update(courseEnrollments)
        .set({
          status: canonical.status,
          completedLessonCount: canonical.completedLessonCount,
          updatedAt: new Date()
        })
        .where(eq(courseEnrollments.id, enrollmentId))
        .returning();
      if (!row) {
        return null;
      }
      await touchCourse(transaction, courseId);
      return courseEnrollmentFromRow(row);
    });
  }

  countEnrolled(courseId: string) {
    return countEnrolled(this.db, courseId);
  }
}

type QueryDb = Pick<AppDb, "select">;
type WriteDb = Pick<AppDb, "update">;

async function countEnrolled(db: QueryDb, courseId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.status, "enrolled")
      )
    );
  return Number(row?.total ?? 0);
}

async function touchCourse(db: WriteDb, courseId: string) {
  await db
    .update(courses)
    .set({ updatedAt: new Date() })
    .where(eq(courses.id, courseId));
}
