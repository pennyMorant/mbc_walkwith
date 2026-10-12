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
import { randomUUID } from "node:crypto";

import type {
  CourseEnrollmentAttempt,
  CourseEnrollmentCreateInput,
  CourseEnrollmentStatusDecision,
  CourseEnrollmentUpdateDecision,
  CourseLessonUpdateValidator,
  CourseRepository,
  CourseUpdateValidator
} from "./course.repository.js";

export class InMemoryCourseRepository implements CourseRepository {
  private courses = new Map<string, Course>(
    seedCourses.map((course) => [course.id, course])
  );
  private lessons = new Map<string, CourseLesson>(
    seedLessons.map((lesson) => [lesson.id, lesson])
  );
  private enrollments = new Map<string, CourseEnrollment>();

  async list(query: CourseListQuery): Promise<Course[]> {
    return this.filteredCourses(query).slice(0, query.limit);
  }

  async listForMember(
    query: CourseListQuery,
    userId: string
  ): Promise<Course[]> {
    return this.filteredCourses(query, ["public", "members"])
      .filter((course) => query.status || visibleCourseStatuses.has(course.status))
      .map((course) => this.withMemberState(course, userId))
      .slice(0, query.limit);
  }

  async listForPublic(query: CourseListQuery): Promise<Course[]> {
    return this.filteredCourses(query, ["public"])
      .filter((course) => query.status || visibleCourseStatuses.has(course.status))
      .slice(0, query.limit);
  }

  async listMine(userId: string): Promise<Course[]> {
    const courseIds = new Set(
      [...this.enrollments.values()]
        .filter(
          (enrollment) =>
            enrollment.userId === userId && enrollment.status !== "cancelled"
        )
        .map((enrollment) => enrollment.courseId)
    );
    return [...courseIds]
      .map((courseId) => this.courses.get(courseId))
      .filter((course): course is Course => Boolean(course))
      .map((course) => this.withMemberState(course, userId));
  }

  async getById(id: string): Promise<Course | null> {
    return this.courses.get(id) ?? null;
  }

  async getByIdForMember(
    id: string,
    userId: string
  ): Promise<Course | null> {
    const course = this.courses.get(id);
    if (!course || !["public", "members"].includes(course.visibility)) {
      return null;
    }
    return this.withMemberState(course, userId);
  }

  async getByIdForPublic(id: string): Promise<Course | null> {
    const course = this.courses.get(id);
    return course?.visibility === "public" ? course : null;
  }

  async create(input: CourseUpsertRequest): Promise<Course> {
    const now = new Date().toISOString();
    const course: Course = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      teacherName: input.teacherName?.trim() ?? "",
      location: input.location?.trim() ?? "",
      scheduleText: input.scheduleText?.trim() ?? "",
      visibility: input.visibility,
      status: input.status,
      capacity: input.capacity ?? null,
      enrolledCount: 0,
      lessonCount: 0,
      myEnrollmentStatus: null,
      myCompletedLessonCount: 0,
      createdAt: now,
      updatedAt: now,
      lessons: []
    };
    this.courses.set(course.id, course);
    return course;
  }

  async update(
    id: string,
    input: CourseUpdateRequest,
    validate: CourseUpdateValidator
  ): Promise<Course | null> {
    const existing = this.courses.get(id);
    if (!existing) {
      return null;
    }
    const hydrated = this.hydrateCourse(existing);
    validate({
      status: hydrated.status,
      enrolledCount: hydrated.enrolledCount
    });
    const updated: Course = {
      ...existing,
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
        input.location === undefined ? existing.location : input.location.trim(),
      scheduleText:
        input.scheduleText === undefined
          ? existing.scheduleText
          : input.scheduleText.trim(),
      visibility: input.visibility ?? existing.visibility,
      status: input.status ?? existing.status,
      capacity: input.capacity === undefined ? existing.capacity : input.capacity,
      updatedAt: new Date().toISOString()
    };
    this.courses.set(id, this.hydrateCourse(updated));
    return this.courses.get(id) ?? null;
  }

  async listLessons(courseId: string): Promise<CourseLesson[]> {
    return this.lessonsForCourse(courseId);
  }

  async createLesson(
    courseId: string,
    input: CourseLessonUpsertRequest
  ): Promise<CourseLesson> {
    const now = new Date().toISOString();
    const lesson: CourseLesson = {
      id: randomUUID(),
      courseId,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      startsAt: input.startsAt ?? null,
      status: input.status,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now
    };
    this.lessons.set(lesson.id, lesson);
    this.refreshCourse(courseId);
    return lesson;
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    input: CourseLessonUpdateRequest,
    validate: CourseLessonUpdateValidator
  ): Promise<CourseLesson | null> {
    const existing = this.lessons.get(lessonId);
    if (!existing || existing.courseId !== courseId) {
      return null;
    }
    validate({ status: existing.status });
    const updated: CourseLesson = {
      ...existing,
      title: input.title?.trim() ?? existing.title,
      description:
        input.description === undefined
          ? existing.description
          : input.description.trim(),
      startsAt:
        input.startsAt === undefined ? existing.startsAt : input.startsAt,
      status: input.status ?? existing.status,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      updatedAt: new Date().toISOString()
    };
    this.lessons.set(lessonId, updated);
    this.refreshCourse(courseId);
    return updated;
  }

  async listEnrollments(
    courseId: string,
    query: CourseEnrollmentListQuery
  ): Promise<CourseEnrollment[]> {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.enrollments.values()]
      .filter((enrollment) => {
        if (enrollment.courseId !== courseId) {
          return false;
        }
        if (query.status && enrollment.status !== query.status) {
          return false;
        }
        if (normalizedQuery) {
          return [
            enrollment.memberDisplayName,
            enrollment.memberEmail,
            enrollment.note
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, query.limit);
  }

  async getEnrollmentById(
    courseId: string,
    enrollmentId: string
  ): Promise<CourseEnrollment | null> {
    const enrollment = this.enrollments.get(enrollmentId);
    return enrollment?.courseId === courseId ? enrollment : null;
  }

  async enroll(
    input: CourseEnrollmentCreateInput,
    decideStatus: CourseEnrollmentStatusDecision
  ): Promise<CourseEnrollmentAttempt | null> {
    const course = this.courses.get(input.courseId);
    if (!course) {
      return null;
    }
    const existing = [...this.enrollments.values()].find(
      (enrollment) =>
        enrollment.courseId === input.courseId &&
        enrollment.userId === input.userId &&
        activeEnrollmentStatuses.has(enrollment.status)
    );
    if (existing) {
      return { enrollment: existing, created: false };
    }
    const status = decideStatus({
      status: course.status,
      visibility: course.visibility,
      capacity: course.capacity,
      enrolledCount: await this.countEnrolled(input.courseId)
    });
    const now = new Date().toISOString();
    const enrollment: CourseEnrollment = {
      id: randomUUID(),
      courseId: input.courseId,
      userId: input.userId,
      memberDisplayName: input.memberDisplayName,
      memberEmail: input.memberEmail,
      status,
      note: input.note ?? "",
      completedLessonCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.enrollments.set(enrollment.id, enrollment);
    this.refreshCourse(input.courseId);
    return { enrollment, created: true };
  }

  async updateEnrollment(
    courseId: string,
    enrollmentId: string,
    input: CourseEnrollmentUpdateRequest,
    decide: CourseEnrollmentUpdateDecision
  ): Promise<CourseEnrollment | null> {
    const existing = await this.getEnrollmentById(courseId, enrollmentId);
    if (!existing) {
      return null;
    }
    const course = this.courses.get(courseId);
    if (!course) {
      return null;
    }
    const canonical = decide({
      courseStatus: course.status,
      capacity: course.capacity,
      enrolledCount: await this.countEnrolled(courseId),
      lessonCount: this.lessonsForCourse(courseId).length,
      enrollment: existing
    });
    const updated: CourseEnrollment = {
      ...existing,
      status: canonical.status,
      completedLessonCount: canonical.completedLessonCount,
      updatedAt: new Date().toISOString()
    };
    this.enrollments.set(enrollmentId, updated);
    this.refreshCourse(courseId);
    return updated;
  }

  async countEnrolled(courseId: string): Promise<number> {
    return [...this.enrollments.values()].filter(
      (enrollment) =>
        enrollment.courseId === courseId && enrollment.status === "enrolled"
    ).length;
  }

  private filteredCourses(
    query: CourseListQuery,
    allowedVisibility?: string[]
  ) {
    const normalizedQuery = query.query?.trim().toLowerCase();
    return [...this.courses.values()]
      .map((course) => this.hydrateCourse(course))
      .filter((course) => {
        if (query.status && course.status !== query.status) {
          return false;
        }
        if (query.visibility && course.visibility !== query.visibility) {
          return false;
        }
        if (
          allowedVisibility &&
          !allowedVisibility.includes(course.visibility)
        ) {
          return false;
        }
        if (normalizedQuery) {
          return [
            course.title,
            course.description,
            course.teacherName,
            course.location
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  private withMemberState(course: Course, userId: string): Course {
    const enrollment = [...this.enrollments.values()]
      .filter((item) => item.courseId === course.id && item.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return {
      ...this.hydrateCourse(course),
      myEnrollmentStatus: enrollment?.status ?? null,
      myCompletedLessonCount: enrollment?.completedLessonCount ?? 0
    };
  }

  private hydrateCourse(course: Course): Course {
    const lessons = this.lessonsForCourse(course.id);
    return {
      ...course,
      enrolledCount: [...this.enrollments.values()].filter(
        (item) => item.courseId === course.id && item.status === "enrolled"
      ).length,
      lessonCount: lessons.length,
      lessons
    };
  }

  private lessonsForCourse(courseId: string) {
    return [...this.lessons.values()]
      .filter((lesson) => lesson.courseId === courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }

  private refreshCourse(courseId: string) {
    const course = this.courses.get(courseId);
    if (course) {
      this.courses.set(courseId, {
        ...this.hydrateCourse(course),
        updatedAt: new Date().toISOString()
      });
    }
  }
}

const activeEnrollmentStatuses = new Set(["submitted", "enrolled", "waitlisted"]);
const visibleCourseStatuses = new Set(["open", "in_progress"]);

const seedCourses: Course[] = [
  {
    id: "foundations-course",
    title: "Foundations of Faith",
    description: "A four-week class for new believers and new members.",
    teacherName: "Pastor Lee",
    location: "Room 201",
    scheduleText: "Sundays 10:00 AM",
    visibility: "members",
    status: "open",
    capacity: 24,
    enrolledCount: 0,
    lessonCount: 2,
    myEnrollmentStatus: null,
    myCompletedLessonCount: 0,
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z",
    lessons: []
  }
];

const seedLessons: CourseLesson[] = [
  {
    id: "foundations-lesson-1",
    courseId: "foundations-course",
    title: "Gospel and Grace",
    description: "The heart of the Christian faith.",
    startsAt: "2026-06-07T17:00:00.000Z",
    status: "published",
    sortOrder: 1,
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  },
  {
    id: "foundations-lesson-2",
    courseId: "foundations-course",
    title: "Church Life",
    description: "Membership, fellowship, and service.",
    startsAt: "2026-06-14T17:00:00.000Z",
    status: "scheduled",
    sortOrder: 2,
    createdAt: "2026-05-01T18:00:00.000Z",
    updatedAt: "2026-05-01T18:00:00.000Z"
  }
];
