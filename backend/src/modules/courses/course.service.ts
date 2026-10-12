import type {
  CourseEnrollmentStatus,
  CourseLessonStatus,
  CourseStatus,
  CourseEnrollmentListQuery,
  CourseEnrollmentRequest,
  CourseEnrollmentUpdateRequest,
  CourseLessonUpdateRequest,
  CourseLessonUpsertRequest,
  CourseListQuery,
  CourseUpdateRequest,
  CourseUpsertRequest
} from "@mbc/api-contracts";

import {
  courseCapacityExceeded,
  courseEnrollmentClosed,
  courseEnrollmentNotFound,
  courseEnrollmentProgressUnavailable,
  courseEnrollmentStatusTransitionInvalid,
  courseLessonNotFound,
  courseLessonStatusTransitionInvalid,
  courseNotFound,
  courseProgressOutOfRange,
  courseStatusTransitionInvalid
} from "./course-errors.js";
import type { CourseRepository } from "./course.repository.js";

export class CourseService {
  constructor(private readonly repository: CourseRepository) {}

  list(query: CourseListQuery) {
    return this.repository.list(query);
  }

  listVisible(query: CourseListQuery, userId: string | null) {
    if (query.status && !visibleCourseStatuses.has(query.status)) {
      return [];
    }
    return userId
      ? this.repository.listForMember(query, userId)
      : this.repository.listForPublic(query);
  }

  listMine(userId: string) {
    return this.repository.listMine(userId);
  }

  getById(id: string) {
    return this.repository.getById(id);
  }

  async getVisibleById(id: string, userId: string | null) {
    const course = userId
      ? await this.repository.getByIdForMember(id, userId)
      : await this.repository.getByIdForPublic(id);
    if (!course) {
      throw courseNotFound(id);
    }
    if (
      !visibleCourseStatuses.has(course.status) &&
      (!userId ||
        !course.myEnrollmentStatus ||
        !historicalEnrollmentStatuses.has(course.myEnrollmentStatus))
    ) {
      throw courseNotFound(id);
    }
    return course;
  }

  create(input: CourseUpsertRequest) {
    return this.repository.create(input);
  }

  async update(id: string, input: CourseUpdateRequest) {
    const course = await this.repository.update(id, input, (context) => {
      if (
        input.status &&
        !transitionAllowed(courseStatusTransitions, context.status, input.status)
      ) {
        throw courseStatusTransitionInvalid(id, context.status, input.status);
      }
      if (
        input.capacity !== undefined &&
        input.capacity !== null &&
        input.capacity < context.enrolledCount
      ) {
        throw courseCapacityExceeded(
          id,
          input.capacity,
          context.enrolledCount
        );
      }
    });
    if (!course) {
      throw courseNotFound(id);
    }
    return course;
  }

  async listLessons(courseId: string) {
    await this.requireCourse(courseId);
    return this.repository.listLessons(courseId);
  }

  async createLesson(courseId: string, input: CourseLessonUpsertRequest) {
    await this.requireCourse(courseId);
    return this.repository.createLesson(courseId, input);
  }

  async updateLesson(
    courseId: string,
    lessonId: string,
    input: CourseLessonUpdateRequest
  ) {
    await this.requireCourse(courseId);
    const lesson = await this.repository.updateLesson(
      courseId,
      lessonId,
      input,
      (context) => {
        if (
          input.status &&
          !transitionAllowed(
            lessonStatusTransitions,
            context.status,
            input.status
          )
        ) {
          throw courseLessonStatusTransitionInvalid(
            courseId,
            lessonId,
            context.status,
            input.status
          );
        }
      }
    );
    if (!lesson) {
      throw courseLessonNotFound(courseId, lessonId);
    }
    return lesson;
  }

  async enroll(
    courseId: string,
    user: { id: string; displayName: string; email: string },
    input: CourseEnrollmentRequest
  ) {
    const attempt = await this.repository.enroll(
      {
        courseId,
        userId: user.id,
        memberDisplayName: user.displayName,
        memberEmail: user.email,
        note: input.note?.trim() ?? ""
      },
      (context) => {
        if (
          !visibleCourseStatuses.has(context.status) ||
          !memberCourseVisibilities.has(context.visibility)
        ) {
          throw courseEnrollmentClosed(courseId);
        }
        return context.capacity !== null &&
          context.enrolledCount >= context.capacity
          ? "waitlisted"
          : "enrolled";
      }
    );
    if (!attempt) {
      throw courseEnrollmentClosed(courseId);
    }
    return attempt;
  }

  async listEnrollments(
    courseId: string,
    query: CourseEnrollmentListQuery
  ) {
    await this.requireCourse(courseId);
    return this.repository.listEnrollments(courseId, query);
  }

  async updateEnrollment(
    courseId: string,
    enrollmentId: string,
    input: CourseEnrollmentUpdateRequest
  ) {
    await this.requireCourse(courseId);
    const enrollment = await this.repository.updateEnrollment(
      courseId,
      enrollmentId,
      input,
      (context) => {
        const nextStatus = input.status ?? context.enrollment.status;
        if (
          input.status &&
          !transitionAllowed(
            enrollmentStatusTransitions,
            context.enrollment.status,
            input.status
          )
        ) {
          throw courseEnrollmentStatusTransitionInvalid(
            courseId,
            enrollmentId,
            context.enrollment.status,
            input.status
          );
        }
        if (
          nextStatus === "enrolled" &&
          context.enrollment.status !== "enrolled" &&
          context.capacity !== null &&
          context.enrolledCount >= context.capacity
        ) {
          throw courseCapacityExceeded(
            courseId,
            context.capacity,
            context.enrolledCount
          );
        }
        if (
          input.completedLessonCount !== undefined &&
          !progressEnrollmentStatuses.has(nextStatus)
        ) {
          throw courseEnrollmentProgressUnavailable(
            courseId,
            enrollmentId,
            nextStatus
          );
        }
        const completedLessonCount = progressEnrollmentStatuses.has(nextStatus)
          ? (input.completedLessonCount ??
            context.enrollment.completedLessonCount)
          : 0;
        if (completedLessonCount > context.lessonCount) {
          throw courseProgressOutOfRange(
            courseId,
            completedLessonCount,
            context.lessonCount
          );
        }
        return { status: nextStatus, completedLessonCount };
      }
    );
    if (!enrollment) {
      throw courseEnrollmentNotFound(courseId, enrollmentId);
    }
    return enrollment;
  }

  private async requireCourse(courseId: string) {
    const course = await this.repository.getById(courseId);
    if (!course) {
      throw courseNotFound(courseId);
    }
    return course;
  }
}

const visibleCourseStatuses = new Set(["open", "in_progress"]);
const historicalEnrollmentStatuses = new Set([
  "submitted",
  "enrolled",
  "waitlisted",
  "completed"
]);
const memberCourseVisibilities = new Set(["public", "members"]);
const progressEnrollmentStatuses = new Set(["enrolled", "completed"]);

const courseStatusTransitions: ReadonlyMap<CourseStatus, ReadonlySet<CourseStatus>> =
  new Map([
    ["draft", new Set(["open", "archived"])],
    ["open", new Set(["closed", "in_progress", "completed", "archived"])],
    ["closed", new Set(["open", "in_progress", "completed", "archived"])],
    ["in_progress", new Set(["closed", "completed", "archived"])],
    ["completed", new Set(["archived"])],
    ["archived", new Set()]
  ]);

const lessonStatusTransitions: ReadonlyMap<
  CourseLessonStatus,
  ReadonlySet<CourseLessonStatus>
> = new Map([
  ["scheduled", new Set(["published", "completed"])],
  ["published", new Set(["completed"])],
  ["completed", new Set()]
]);

const enrollmentStatusTransitions: ReadonlyMap<
  CourseEnrollmentStatus,
  ReadonlySet<CourseEnrollmentStatus>
> = new Map([
  ["submitted", new Set(["enrolled", "waitlisted", "cancelled"])],
  ["enrolled", new Set(["cancelled", "completed"])],
  ["waitlisted", new Set(["enrolled", "cancelled"])],
  ["cancelled", new Set()],
  ["completed", new Set()]
]);

function transitionAllowed<T extends string>(
  transitions: ReadonlyMap<T, ReadonlySet<T>>,
  from: T,
  to: T
) {
  return from === to || transitions.get(from)?.has(to) === true;
}
