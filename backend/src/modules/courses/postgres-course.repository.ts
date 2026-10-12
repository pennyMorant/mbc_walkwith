import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentListQuery,
  CourseEnrollmentUpdateRequest,
  CourseLesson,
  CourseLessonUpdateRequest,
  CourseLessonUpsertRequest,
  CourseListQuery,
  CourseUpdateRequest,
  CourseUpsertRequest
} from "@mbc/api-contracts";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

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
  CourseEnrollmentUpdateDecision,
  CourseLessonUpdateValidator,
  CourseRepository,
  CourseUpdateValidator
} from "./course.repository.js";
import { PostgresCourseEnrollmentStore } from "./postgres_course_enrollment_store.js";
import { courseLessonFromRow } from "./postgres_course_mappers.js";

export class PostgresCourseRepository implements CourseRepository {
  private readonly enrollmentStore: PostgresCourseEnrollmentStore;

  constructor(private readonly db: AppDb) {
    this.enrollmentStore = new PostgresCourseEnrollmentStore(db);
  }

  async list(query: CourseListQuery): Promise<Course[]> {
    const rows = await this.selectCourses(query);
    return Promise.all(rows.map((row) => this.courseFromRow(row)));
  }

  async listForMember(
    query: CourseListQuery,
    userId: string
  ): Promise<Course[]> {
    const rows = await this.selectCourses(query, ["public", "members"], true);
    return Promise.all(
      rows.map(async (row) =>
        this.withMemberState(await this.courseFromRow(row), userId)
      )
    );
  }

  async listForPublic(query: CourseListQuery): Promise<Course[]> {
    const rows = await this.selectCourses(query, ["public"], true);
    return Promise.all(rows.map((row) => this.courseFromRow(row)));
  }

  async listMine(userId: string): Promise<Course[]> {
    const rows = await this.db
      .select({ course: courses })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          or(
            eq(courseEnrollments.status, "submitted"),
            eq(courseEnrollments.status, "enrolled"),
            eq(courseEnrollments.status, "waitlisted"),
            eq(courseEnrollments.status, "completed")
          )
        )
      )
      .orderBy(desc(courseEnrollments.updatedAt));
    const seen = new Set<string>();
    const uniqueRows = rows
      .map((row) => row.course)
      .filter((row) => {
        if (seen.has(row.id)) {
          return false;
        }
        seen.add(row.id);
        return true;
      });
    return Promise.all(
      uniqueRows.map(async (row) =>
        this.withMemberState(await this.courseFromRow(row), userId)
      )
    );
  }

  async getById(id: string): Promise<Course | null> {
    const [row] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    return row ? this.courseFromRow(row) : null;
  }

  async getByIdForMember(
    id: string,
    userId: string
  ): Promise<Course | null> {
    const [row] = await this.db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.id, id),
          or(eq(courses.visibility, "public"), eq(courses.visibility, "members"))
        )
      )
      .limit(1);
    return row
      ? this.withMemberState(await this.courseFromRow(row), userId)
      : null;
  }

  async getByIdForPublic(id: string): Promise<Course | null> {
    const [row] = await this.db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), eq(courses.visibility, "public")))
      .limit(1);
    return row ? this.courseFromRow(row) : null;
  }

  async create(input: CourseUpsertRequest): Promise<Course> {
    const [row] = await this.db
      .insert(courses)
      .values({
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        teacherName: input.teacherName?.trim() ?? "",
        location: input.location?.trim() ?? "",
        scheduleText: input.scheduleText?.trim() ?? "",
        visibility: input.visibility,
        status: input.status,
        capacity: input.capacity ?? null,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create course.");
    }
    return this.courseFromRow(row);
  }

  async update(
    id: string,
    input: CourseUpdateRequest,
    validate: CourseUpdateValidator
  ): Promise<Course | null> {
    const row = await this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(courses)
        .where(eq(courses.id, id))
        .for("update")
        .limit(1);
      if (!existing) {
        return null;
      }
      const [countRow] = await transaction
        .select({ total: sql<number>`count(*)` })
        .from(courseEnrollments)
        .where(
          and(
            eq(courseEnrollments.courseId, id),
            eq(courseEnrollments.status, "enrolled")
          )
        );
      validate({
        status: existing.status,
        enrolledCount: Number(countRow?.total ?? 0)
      });
      const [updated] = await transaction
        .update(courses)
        .set({
          title: input.title?.trim() ?? existing.title,
          description:
            input.description === undefined
              ? existing.description
              : input.description.trim(),
          teacherName:
            input.teacherName === undefined
              ? existing.teacherName
              : input.teacherName.trim(),
          location:
            input.location === undefined
              ? existing.location
              : input.location.trim(),
          scheduleText:
            input.scheduleText === undefined
              ? existing.scheduleText
              : input.scheduleText.trim(),
          visibility: input.visibility ?? existing.visibility,
          status: input.status ?? existing.status,
          capacity:
            input.capacity === undefined ? existing.capacity : input.capacity,
          updatedAt: new Date()
        })
        .where(eq(courses.id, id))
        .returning();
      return updated ?? null;
    });
    return row ? this.courseFromRow(row) : null;
  }

  async listLessons(courseId: string): Promise<CourseLesson[]> {
    const rows = await this.db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(asc(courseLessons.sortOrder), asc(courseLessons.title));
    return rows.map(courseLessonFromRow);
  }

  async createLesson(
    courseId: string,
    input: CourseLessonUpsertRequest
  ): Promise<CourseLesson> {
    const [row] = await this.db
      .insert(courseLessons)
      .values({
        courseId,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        status: input.status,
        sortOrder: input.sortOrder,
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create course lesson.");
    }
    await this.touchCourse(courseId);
    return courseLessonFromRow(row);
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    input: CourseLessonUpdateRequest,
    validate: CourseLessonUpdateValidator
  ): Promise<CourseLesson | null> {
    const row = await this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(courseLessons)
        .where(
          and(
            eq(courseLessons.courseId, courseId),
            eq(courseLessons.id, lessonId)
          )
        )
        .for("update")
        .limit(1);
      if (!existing) {
        return null;
      }
      validate({ status: existing.status });
      const [updated] = await transaction
        .update(courseLessons)
        .set({
          title: input.title?.trim() ?? existing.title,
          description:
            input.description === undefined
              ? existing.description
              : input.description.trim(),
          startsAt:
            input.startsAt === undefined
              ? existing.startsAt
              : input.startsAt
                ? new Date(input.startsAt)
                : null,
          status: input.status ?? existing.status,
          sortOrder: input.sortOrder ?? existing.sortOrder,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(courseLessons.courseId, courseId),
            eq(courseLessons.id, lessonId)
          )
        )
        .returning();
      await transaction
        .update(courses)
        .set({ updatedAt: new Date() })
        .where(eq(courses.id, courseId));
      return updated ?? null;
    });
    return row ? courseLessonFromRow(row) : null;
  }

  async listEnrollments(
    courseId: string,
    query: CourseEnrollmentListQuery
  ): Promise<CourseEnrollment[]> {
    return this.enrollmentStore.list(courseId, query);
  }

  async getEnrollmentById(
    courseId: string,
    enrollmentId: string
  ): Promise<CourseEnrollment | null> {
    return this.enrollmentStore.getById(courseId, enrollmentId);
  }

  async enroll(
    input: CourseEnrollmentCreateInput,
    decideStatus: CourseEnrollmentStatusDecision
  ): Promise<CourseEnrollmentAttempt | null> {
    return this.enrollmentStore.enroll(input, decideStatus);
  }

  async updateEnrollment(
    courseId: string,
    enrollmentId: string,
    input: CourseEnrollmentUpdateRequest,
    decide: CourseEnrollmentUpdateDecision
  ): Promise<CourseEnrollment | null> {
    return this.enrollmentStore.update(courseId, enrollmentId, input, decide);
  }

  async countEnrolled(courseId: string): Promise<number> {
    return this.enrollmentStore.countEnrolled(courseId);
  }

  private async selectCourses(
    query: CourseListQuery,
    allowedVisibility?: string[],
    visibleStatusesOnly = false
  ) {
    const filters = [
      query.status
        ? eq(courses.status, query.status)
        : visibleStatusesOnly
          ? or(eq(courses.status, "open"), eq(courses.status, "in_progress"))
          : undefined,
      query.visibility ? eq(courses.visibility, query.visibility) : undefined,
      allowedVisibility?.length === 1
        ? eq(courses.visibility, allowedVisibility[0] as "public")
        : allowedVisibility?.length === 2
          ? or(eq(courses.visibility, "public"), eq(courses.visibility, "members"))
          : undefined,
      query.query
        ? or(
            ilike(courses.title, `%${query.query}%`),
            ilike(courses.description, `%${query.query}%`),
            ilike(courses.teacherName, `%${query.query}%`),
            ilike(courses.location, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);
    return this.db
      .select()
      .from(courses)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(courses.updatedAt))
      .limit(query.limit);
  }

  private async courseFromRow(
    row: typeof courses.$inferSelect
  ): Promise<Course> {
    const lessons = await this.listLessons(row.id);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      teacherName: row.teacherName,
      location: row.location,
      scheduleText: row.scheduleText,
      visibility: row.visibility,
      status: row.status,
      capacity: row.capacity,
      enrolledCount: await this.countEnrolled(row.id),
      lessonCount: lessons.length,
      myEnrollmentStatus: null,
      myCompletedLessonCount: 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lessons
    };
  }

  private async withMemberState(course: Course, userId: string) {
    const enrollment = await this.enrollmentStore.getLatestForUser(
      course.id,
      userId
    );
    return {
      ...course,
      myEnrollmentStatus: enrollment?.status ?? null,
      myCompletedLessonCount: enrollment?.completedLessonCount ?? 0
    };
  }

  private async touchCourse(courseId: string) {
    await this.db
      .update(courses)
      .set({ updatedAt: new Date() })
      .where(eq(courses.id, courseId));
  }
}
