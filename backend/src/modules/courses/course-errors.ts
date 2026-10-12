import { appError } from "../../shared/http/app-error.js";

export function courseNotFound(courseId: string) {
  return appError({
    code: "course_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Course not found.",
    recoverable: true,
    retryable: false,
    evidence: { courseId },
    nextAction: "refresh"
  });
}

export function courseEnrollmentClosed(courseId: string) {
  return appError({
    code: "course_enrollment_closed",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "This course is not accepting enrollments.",
    recoverable: true,
    retryable: false,
    evidence: { courseId },
    nextAction: "refresh"
  });
}

export function courseEnrollmentNotFound(
  courseId: string,
  enrollmentId: string
) {
  return appError({
    code: "course_enrollment_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Course enrollment not found.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, enrollmentId },
    nextAction: "refresh"
  });
}

export function courseLessonNotFound(courseId: string, lessonId: string) {
  return appError({
    code: "course_lesson_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Course lesson not found.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, lessonId },
    nextAction: "refresh"
  });
}

export function courseProgressOutOfRange(
  courseId: string,
  completedLessonCount: number,
  lessonCount: number
) {
  return appError({
    code: "course_progress_out_of_range",
    category: "validation",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Completed lesson count exceeds the course lesson count.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, completedLessonCount, lessonCount },
    nextAction: "review_input"
  });
}

export function courseCapacityExceeded(
  courseId: string,
  capacity: number,
  enrolledCount: number
) {
  return appError({
    code: "course_capacity_exceeded",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Course capacity cannot accommodate this enrollment state.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, capacity, enrolledCount },
    nextAction: "refresh"
  });
}

export function courseStatusTransitionInvalid(
  courseId: string,
  from: string,
  to: string
) {
  return appError({
    code: "course_status_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Course status transition is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, from, to },
    nextAction: "refresh"
  });
}

export function courseLessonStatusTransitionInvalid(
  courseId: string,
  lessonId: string,
  from: string,
  to: string
) {
  return appError({
    code: "course_lesson_status_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Course lesson status transition is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, lessonId, from, to },
    nextAction: "refresh"
  });
}

export function courseEnrollmentStatusTransitionInvalid(
  courseId: string,
  enrollmentId: string,
  from: string,
  to: string
) {
  return appError({
    code: "course_enrollment_status_transition_invalid",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Course enrollment status transition is not allowed.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, enrollmentId, from, to },
    nextAction: "refresh"
  });
}

export function courseEnrollmentProgressUnavailable(
  courseId: string,
  enrollmentId: string,
  status: string
) {
  return appError({
    code: "course_enrollment_progress_unavailable",
    category: "state_conflict",
    sourceLayer: "domain",
    statusCode: 409,
    message: "Learning progress is unavailable for this enrollment status.",
    recoverable: true,
    retryable: false,
    evidence: { courseId, enrollmentId, status },
    nextAction: "refresh"
  });
}
