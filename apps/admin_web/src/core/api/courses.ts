import {
  courseEnrollmentListResponseSchema,
  courseEnrollmentSchema,
  courseEnrollmentUpdateRequestSchema,
  courseLessonListResponseSchema,
  courseLessonSchema,
  courseLessonUpdateRequestSchema,
  courseLessonUpsertRequestSchema,
  courseListResponseSchema,
  courseSchema,
  courseUpdateRequestSchema,
  courseUpsertRequestSchema,
  type Course,
  type CourseEnrollment,
  type CourseEnrollmentListQuery,
  type CourseEnrollmentUpdateRequest,
  type CourseLesson,
  type CourseLessonStatus,
  type CourseLessonUpdateRequest,
  type CourseLessonUpsertRequest,
  type CourseStatus,
  type CourseListQuery,
  type CourseUpdateRequest,
  type CourseUpsertRequest
} from "@mbc/api-contracts";

import { apiClient } from "./client";
import type { QueryWithSelectAll } from "./filter_types";
import { pathSegment } from "./path_segments";

export type CourseListFilters = QueryWithSelectAll<
  QueryWithSelectAll<CourseListQuery, "status">,
  "visibility"
>;

export type CourseEnrollmentFilters = QueryWithSelectAll<
  CourseEnrollmentListQuery,
  "status"
>;

export async function listCourses(
  filters: CourseListFilters = {}
): Promise<Course[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  appendParam(params, "visibility", filters.visibility);
  return (
    await apiClient.getData(
      `/admin/courses?${params.toString()}`,
      courseListResponseSchema
    )
  ).items;
}

export async function createCourse(
  input: CourseUpsertRequest
): Promise<Course> {
  const payload = courseUpsertRequestSchema.parse(input);
  return apiClient.postData("/admin/courses", payload, courseSchema);
}

export async function updateCourse(
  courseId: string,
  input: CourseUpdateRequest
): Promise<Course> {
  const payload = courseUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/courses/${pathSegment(courseId)}`,
    payload,
    courseSchema
  );
}

export async function listCourseLessons(
  courseId: string
): Promise<CourseLesson[]> {
  return (
    await apiClient.getData(
      `/admin/courses/${pathSegment(courseId)}/lessons`,
      courseLessonListResponseSchema
    )
  ).items;
}

export async function createCourseLesson(
  courseId: string,
  input: CourseLessonUpsertRequest
): Promise<CourseLesson> {
  const payload = courseLessonUpsertRequestSchema.parse(input);
  return apiClient.postData(
    `/admin/courses/${pathSegment(courseId)}/lessons`,
    payload,
    courseLessonSchema
  );
}

export async function updateCourseLesson(
  courseId: string,
  lessonId: string,
  input: CourseLessonUpdateRequest
): Promise<CourseLesson> {
  const payload = courseLessonUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/courses/${pathSegment(courseId)}/lessons/${pathSegment(lessonId)}`,
    payload,
    courseLessonSchema
  );
}

export async function listCourseEnrollments(
  courseId: string,
  filters: CourseEnrollmentFilters = {}
): Promise<CourseEnrollment[]> {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  appendParam(params, "query", filters.query);
  appendParam(params, "status", filters.status);
  return (
    await apiClient.getData(
      `/admin/courses/${pathSegment(courseId)}/enrollments?${params.toString()}`,
      courseEnrollmentListResponseSchema
    )
  ).items;
}

export async function updateCourseEnrollment(
  courseId: string,
  enrollmentId: string,
  input: CourseEnrollmentUpdateRequest
): Promise<CourseEnrollment> {
  const payload = courseEnrollmentUpdateRequestSchema.parse(input);
  return apiClient.patchData(
    `/admin/courses/${pathSegment(courseId)}/enrollments/${pathSegment(enrollmentId)}`,
    payload,
    courseEnrollmentSchema
  );
}

export const courseStatusOptions: CourseStatus[] = [
  "draft",
  "open",
  "closed",
  "in_progress",
  "completed",
  "archived"
];

export const lessonStatusOptions: CourseLessonStatus[] = [
  "scheduled",
  "published",
  "completed"
];

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined
) {
  const clean = value?.trim();
  if (clean) {
    params.set(key, clean);
  }
}
