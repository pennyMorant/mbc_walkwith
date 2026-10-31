import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentStatus,
  CourseLesson,
  CourseLessonStatus,
  CourseLessonUpsertRequest,
  CourseUpsertRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  courseStatusOptions,
  createCourse,
  createCourseLesson,
  updateCourse,
  updateCourseEnrollment,
  updateCourseLesson
} from "@/core/api/courses";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  buildCourseLessonPayload,
  clampLessonCount,
  courseResourceTargetsSelection,
  courseSaveIntent,
  emptyCourseForm,
  emptyLessonForm,
  sameCourseLessonPayload,
  sameCourseSaveIntent,
  type CourseSaveIntent
} from "../course_workspace_models";
import { useCourseCatalogQuery } from "./use_course_catalog_query";
import { useCourseMutationFeedback } from "./use_course_mutation_feedback";
import { useCourseWorkspaceQueries } from "./use_course_workspace_queries";

export function useCoursePageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedCourse = ref<Course | null>(null);
  const drawer = ref(false);
  const mutationFeedback = useCourseMutationFeedback(selectedCourse, t);
  const {
    filters,
    coursesQuery,
    courses,
    initialError: coursesError,
    refreshError: coursesRefreshError,
    applyFilters: applyCourseFilters,
    clearFilters: clearCourseFilters,
    refreshList: refreshCourses
  } = useCourseCatalogQuery(queryClient);
  const form = reactive<CourseUpsertRequest>(emptyCourseForm());
  const lessonForm = reactive(emptyLessonForm());
  const selectedCourseId = computed(() => selectedCourse.value?.id ?? null);
  const {
    applyEnrollmentFilters,
    enrollmentFilters,
    enrollments,
    enrollmentsErrorMessage,
    enrollmentsQuery,
    enrollmentsRefreshErrorMessage,
    invalidateCourseResources,
    lessons,
    lessonsErrorMessage,
    lessonsQuery,
    lessonsRefreshErrorMessage,
    resetEnrollmentFilters
  } = useCourseWorkspaceQueries(selectedCourseId, queryClient, t);
  const canManage = computed(() => authStore.can("courses:manage"));
  const canSave = computed(() => form.title.trim().length > 0);
  const canCreateLesson = computed(() =>
    Boolean(canManage.value && selectedCourse.value && lessonForm.title.trim())
  );
  const courseMutationErrorMessage = mutationFeedback.messageFor("course");
  const lessonMutationErrorMessage = mutationFeedback.messageFor(
    "lesson-create",
    "lesson-status"
  );
  const enrollmentMutationErrorMessage =
    mutationFeedback.messageFor("enrollment");

  const saveMutation = useMutation({
    onMutate: () => mutationFeedback.begin("course"),
    mutationFn: (intent: CourseSaveIntent) => {
      requireManageAccess();
      return intent.courseId
        ? updateCourse(intent.courseId, intent.payload)
        : createCourse(intent.payload);
    },
    onSuccess: async (course, intent, context) => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (!context || !mutationFeedback.isCurrent(context)) {
        return;
      }
      if (
        sameCourseSaveIntent(
          selectedCourse.value?.id ?? null,
          form,
          intent
        )
      ) {
        openCourse(course, true);
      } else if (
        courseResourceTargetsSelection(
          selectedCourse.value?.id ?? null,
          course.id
        )
      ) {
        selectedCourse.value = course;
      }
    },
    onError: mutationFeedback.capture
  });
  const lessonMutation = useMutation({
    onMutate: () => mutationFeedback.begin("lesson-create"),
    mutationFn: (input: {
      courseId: string;
      payload: CourseLessonUpsertRequest;
    }) => {
      requireManageAccess();
      return createCourseLesson(input.courseId, input.payload);
    },
    onSuccess: async (lesson, variables, context) => {
      await invalidateCourseResources(lesson.courseId, "course-lessons");
      if (!context || !mutationFeedback.isCurrent(context)) {
        return;
      }
      if (sameCourseLessonPayload(lessonForm, variables.payload)) {
        resetLessonForm(variables.payload.position + 1);
      }
      syncSelectedCourseFromCatalog(lesson.courseId);
    },
    onError: mutationFeedback.capture
  });
  const lessonStatusMutation = useMutation({
    onMutate: () => mutationFeedback.begin("lesson-status"),
    mutationFn: (input: {
      courseId: string;
      lessonId: string;
      status: CourseLessonStatus;
    }) => {
      requireManageAccess();
      return updateCourseLesson(input.courseId, input.lessonId, {
        status: input.status
      });
    },
    onSuccess: async (lesson, _variables, context) => {
      await invalidateCourseResources(lesson.courseId, "course-lessons");
      if (context && mutationFeedback.isCurrent(context)) {
        syncSelectedCourseFromCatalog(lesson.courseId);
      }
    },
    onError: mutationFeedback.capture
  });
  const enrollmentMutation = useMutation({
    onMutate: () => mutationFeedback.begin("enrollment"),
    mutationFn: (input: {
      courseId: string;
      enrollmentId: string;
      status?: CourseEnrollmentStatus;
      completedLessonCount?: number;
    }) => {
      requireManageAccess();
      return updateCourseEnrollment(
        input.courseId,
        input.enrollmentId,
        {
          status: input.status,
          completedLessonCount: input.completedLessonCount
        }
      );
    },
    onSuccess: async (enrollment, _variables, context) => {
      await invalidateCourseResources(
        enrollment.courseId,
        "course-enrollments"
      );
      if (context && mutationFeedback.isCurrent(context)) {
        syncSelectedCourseFromCatalog(enrollment.courseId);
      }
    },
    onError: mutationFeedback.capture
  });

  const listErrorMessage = computed(() =>
    coursesError.value
      ? formatApiErrorMessage(coursesError.value, t("common.error"))
      : ""
  );
  const listRefreshErrorMessage = computed(() =>
    coursesRefreshError.value
      ? formatApiErrorMessage(coursesRefreshError.value, t("common.error"))
      : ""
  );
  function requireManageAccess() {
    if (!canManage.value) {
      throw new Error(t("Course manage access required"));
    }
  }

  function openCourse(course: Course, preserveFeedback = false) {
    if (selectedCourse.value?.id !== course.id) {
      resetWorkspaceInputs();
      if (!preserveFeedback) {
        mutationFeedback.reset();
      }
    }
    selectedCourse.value = course;
    Object.assign(form, {
      title: course.title,
      description: course.description,
      teacherName: course.teacherName,
      location: course.location,
      scheduleText: course.scheduleText,
      visibility: course.visibility,
      status: course.status,
      capacity: course.capacity
    });
    drawer.value = true;
  }

  function newCourse() {
    resetWorkspaceInputs();
    mutationFeedback.reset();
    selectedCourse.value = null;
    Object.assign(form, emptyCourseForm());
    drawer.value = true;
  }

  function selectCourse(course: Course) {
    openCourse(course);
    drawer.value = false;
  }

  function syncSelectedCourseFromCatalog(courseId: string) {
    if (selectedCourse.value?.id !== courseId) {
      return;
    }
    selectedCourse.value =
      coursesQuery.data.value?.find((course) => course.id === courseId) ??
      selectedCourse.value;
  }

  function resetLessonForm(position = 0) {
    Object.assign(lessonForm, emptyLessonForm(position));
  }

  function resetWorkspaceInputs() {
    resetLessonForm();
    resetEnrollmentFilters();
  }

  function advanceProgress(enrollment: CourseEnrollment) {
    const course = selectedCourse.value;
    if (
      !canManage.value ||
      !course ||
      !courseResourceTargetsSelection(course.id, enrollment.courseId) ||
      enrollmentMutation.isPending.value ||
      enrollment.completedLessonCount >= course.lessonCount
    ) {
      return;
    }
    enrollmentMutation.mutate({
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      completedLessonCount: clampLessonCount(
        enrollment.completedLessonCount + 1,
        course.lessonCount
      )
    });
  }

  function saveCourse() {
    if (!canManage.value || !canSave.value || saveMutation.isPending.value) {
      return;
    }
    saveMutation.mutate(
      courseSaveIntent(selectedCourse.value?.id ?? null, form)
    );
  }

  function createLesson() {
    if (!canCreateLesson.value || lessonMutation.isPending.value) {
      return;
    }
    const course = requireSelected(
      selectedCourse.value,
      t("No course selected.")
    );
    lessonMutation.mutate({
      courseId: course.id,
      payload: buildCourseLessonPayload(lessonForm)
    });
  }

  function updateLessonStatus(
    lesson: CourseLesson,
    status: CourseLessonStatus
  ) {
    if (
      !canManage.value ||
      !courseResourceTargetsSelection(
        selectedCourse.value?.id ?? null,
        lesson.courseId
      ) ||
      lessonStatusMutation.isPending.value
    ) {
      return;
    }
    lessonStatusMutation.mutate({
      courseId: lesson.courseId,
      lessonId: lesson.id,
      status
    });
  }

  function updateEnrollmentStatus(
    enrollment: CourseEnrollment,
    status: CourseEnrollmentStatus
  ) {
    const course = selectedCourse.value;
    if (
      !canManage.value ||
      !course ||
      !courseResourceTargetsSelection(course.id, enrollment.courseId) ||
      enrollmentMutation.isPending.value
    ) {
      return;
    }
    enrollmentMutation.mutate({
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      status,
      ...(status === "completed"
        ? { completedLessonCount: course.lessonCount }
        : {})
    });
  }

  return {
    advanceProgress,
    applyEnrollmentFilters,
    applyCourseFilters,
    canCreateLesson,
    canManage,
    canSave,
    clearCourseFilters,
    courseStatusOptions,
    courseMutationErrorMessage,
    courses,
    coursesQuery,
    createLesson,
    drawer,
    enrollmentFilters,
    enrollmentMutationErrorMessage,
    enrollmentMutation,
    enrollments,
    enrollmentsErrorMessage,
    enrollmentsQuery,
    enrollmentsRefreshErrorMessage,
    filters,
    form,
    lessonForm,
    lessonMutationErrorMessage,
    lessonMutation,
    lessons,
    lessonsErrorMessage,
    lessonsQuery,
    lessonsRefreshErrorMessage,
    lessonStatusMutation,
    listErrorMessage,
    listRefreshErrorMessage,
    newCourse,
    optionItems,
    saveCourse,
    saveMutation,
    refreshCourses,
    selectedCourse,
    selectCourse,
    t,
    updateEnrollmentStatus,
    updateLessonStatus
  };
}
