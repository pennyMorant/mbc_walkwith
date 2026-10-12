import type {
  CourseLessonStatus,
  CourseUpsertRequest
} from "@mbc/api-contracts";

export function emptyCourseForm(): CourseUpsertRequest {
  return {
    title: "",
    description: "",
    teacherName: "",
    location: "",
    scheduleText: "",
    visibility: "members",
    status: "draft",
    capacity: null
  };
}

export function emptyLessonForm(sortOrder = 1) {
  return {
    title: "",
    description: "",
    startsAt: "",
    status: "scheduled" as CourseLessonStatus,
    sortOrder
  };
}

export function buildCoursePayload(
  form: CourseUpsertRequest
): CourseUpsertRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    teacherName: form.teacherName.trim(),
    location: form.location.trim(),
    scheduleText: form.scheduleText.trim(),
    visibility: form.visibility,
    status: form.status,
    capacity: normalizeCapacity(form.capacity)
  };
}

export function normalizeCapacity(value: number | null | undefined) {
  if (value == null) {
    return null;
  }
  const capacity = Math.floor(Number(value));
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}

export function dateTimeInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function clampLessonCount(value: number, lessonCount: number) {
  return Math.min(
    Math.max(0, Math.floor(Number(value) || 0)),
    Math.max(0, lessonCount)
  );
}
