import type {
  CourseStatus,
  CourseLessonUpsertRequest,
  CourseLessonStatus,
  CourseUpsertRequest,
  LifePostVisibility
} from "@mbc/api-contracts";

export type CourseCatalogFilterForm = {
  query: string;
  status: CourseStatus | "";
  visibility: LifePostVisibility | "";
};

export type CourseCatalogFilterSnapshot = Readonly<CourseCatalogFilterForm>;

export type CourseSaveIntent = {
  courseId: string | null;
  payload: CourseUpsertRequest;
};

export function createCourseCatalogFilterForm(): CourseCatalogFilterForm {
  return { query: "", status: "", visibility: "" };
}

export function courseCatalogFilterSnapshot(
  form: CourseCatalogFilterForm
): CourseCatalogFilterSnapshot {
  return {
    query: form.query.trim(),
    status: form.status,
    visibility: form.visibility
  };
}

export function sameCourseCatalogFilters(
  first: CourseCatalogFilterSnapshot,
  second: CourseCatalogFilterSnapshot
) {
  return (
    first.query === second.query &&
    first.status === second.status &&
    first.visibility === second.visibility
  );
}

export function resetCourseCatalogFilterForm(form: CourseCatalogFilterForm) {
  Object.assign(form, createCourseCatalogFilterForm());
}

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

export function emptyLessonForm(position = 0) {
  return {
    title: "",
    description: "",
    startsAt: "",
    status: "scheduled" as CourseLessonStatus,
    position
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

export function courseSaveIntent(
  courseId: string | null,
  form: CourseUpsertRequest
): CourseSaveIntent {
  return { courseId, payload: buildCoursePayload(form) };
}

export function sameCourseSaveIntent(
  selectedCourseId: string | null,
  form: CourseUpsertRequest,
  intent: CourseSaveIntent
) {
  return (
    selectedCourseId === intent.courseId &&
    JSON.stringify(buildCoursePayload(form)) === JSON.stringify(intent.payload)
  );
}

export function buildCourseLessonPayload(
  form: ReturnType<typeof emptyLessonForm>
): CourseLessonUpsertRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    startsAt: dateTimeInputToIso(form.startsAt),
    status: form.status,
    position: Math.max(0, Number(form.position) || 0)
  };
}

export function sameCourseLessonPayload(
  form: ReturnType<typeof emptyLessonForm>,
  payload: CourseLessonUpsertRequest
) {
  return (
    JSON.stringify(buildCourseLessonPayload(form)) === JSON.stringify(payload)
  );
}

export function courseResourceTargetsSelection(
  selectedCourseId: string | null,
  resourceCourseId: string
) {
  return selectedCourseId === resourceCourseId;
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
