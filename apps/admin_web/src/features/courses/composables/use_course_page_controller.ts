import type {
  Course,
  CourseEnrollment,
  CourseEnrollmentStatus,
  CourseLesson,
  CourseLessonStatus,
  CourseLessonUpsertRequest,
  CourseStatus,
  CourseUpsertRequest,
  LifePostVisibility
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  courseStatusOptions,
  createCourse,
  createCourseLesson,
  listCourseEnrollments,
  listCourseLessons,
  listCourses,
  updateCourse,
  updateCourseEnrollment,
  updateCourseLesson
} from "@/core/api/courses";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  buildCoursePayload,
  clampLessonCount,
  dateTimeInputToIso,
  emptyCourseForm,
  emptyLessonForm
} from "../course_workspace_models";
import { useCourseMutationFeedback } from "./use_course_mutation_feedback";

export function useCoursePageController() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedCourse = ref<Course | null>(null);
  const drawer = ref(false);
  const mutationFeedback = useCourseMutationFeedback(selectedCourse, t);
  const filters = reactive({
    query: "",
    status: "" as CourseStatus | "",
    visibility: "" as LifePostVisibility | ""
  });
  const enrollmentFilters = reactive({
    status: "" as CourseEnrollmentStatus | "",
    query: ""
  });
  const form = reactive<CourseUpsertRequest>(emptyCourseForm());
  const lessonForm = reactive(emptyLessonForm());
  const activeFilters = computed(() => ({ ...filters, limit: 50 }));
  const selectedCourseId = computed(() => selectedCourse.value?.id ?? null);
  const activeEnrollmentFilters = computed(() => ({
    ...enrollmentFilters,
    limit: 100
  }));
  const coursesQuery = useQuery({
    queryKey: ["courses", activeFilters],
    queryFn: () => listCourses(activeFilters.value)
  });
  const lessonsQuery = useQuery({
    queryKey: computed(() => ["course-lessons", selectedCourseId.value]),
    enabled: computed(() => Boolean(selectedCourseId.value)),
    queryFn: ({ queryKey }) => {
      const courseId = queryKey[1] as string | null;
      return courseId
        ? listCourseLessons(courseId)
        : Promise.resolve([] as CourseLesson[]);
    }
  });
  const enrollmentsQuery = useQuery({
    queryKey: computed(() => [
      "course-enrollments",
      selectedCourseId.value,
      activeEnrollmentFilters.value
    ]),
    enabled: computed(() => Boolean(selectedCourseId.value)),
    queryFn: ({ queryKey }) => {
      const courseId = queryKey[1] as string | null;
      const query = queryKey[2] as typeof activeEnrollmentFilters.value;
      return courseId
        ? listCourseEnrollments(courseId, query)
        : Promise.resolve([] as CourseEnrollment[]);
    }
  });
  const canManage = computed(() => authStore.can("courses:manage"));
  const canSave = computed(() => form.title.trim().length > 0);
  const canCreateLesson = computed(() =>
    Boolean(canManage.value && selectedCourse.value && lessonForm.title.trim())
  );

  const saveMutation = useMutation({
    onMutate: () => mutationFeedback.begin("course"),
    mutationFn: (input: {
      courseId: string | null;
      payload: CourseUpsertRequest;
    }) =>
      input.courseId
        ? updateCourse(input.courseId, input.payload)
        : createCourse(input.payload),
    onSuccess: async (course, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (!context || !mutationFeedback.isCurrent(context)) {
        return;
      }
      openCourse(course, true);
      await refreshCanonicalCourse(course.id, course);
    },
    onError: mutationFeedback.capture
  });
  const lessonMutation = useMutation({
    onMutate: () => mutationFeedback.begin("lesson-create"),
    mutationFn: (input: {
      courseId: string;
      payload: CourseLessonUpsertRequest;
    }) => createCourseLesson(input.courseId, input.payload),
    onSuccess: async (lesson, _variables, context) => {
      await invalidateCourseQueries(lesson.courseId, "course-lessons");
      if (!context || !mutationFeedback.isCurrent(context)) {
        return;
      }
      resetLessonForm(lessonForm.sortOrder + 1);
      await refreshCanonicalCourse(lesson.courseId);
    },
    onError: mutationFeedback.capture
  });
  const lessonStatusMutation = useMutation({
    onMutate: () => mutationFeedback.begin("lesson-status"),
    mutationFn: (input: {
      lesson: CourseLesson;
      status: CourseLessonStatus;
    }) => {
      requireManageAccess();
      return updateCourseLesson(input.lesson.courseId, input.lesson.id, {
        status: input.status
      });
    },
    onSuccess: async (lesson, _variables, context) => {
      await invalidateCourseQueries(lesson.courseId, "course-lessons");
      if (context && mutationFeedback.isCurrent(context)) {
        await refreshCanonicalCourse(lesson.courseId);
      }
    },
    onError: mutationFeedback.capture
  });
  const enrollmentMutation = useMutation({
    onMutate: () => mutationFeedback.begin("enrollment"),
    mutationFn: (input: {
      enrollment: CourseEnrollment;
      status?: CourseEnrollmentStatus;
      completedLessonCount?: number;
    }) => {
      requireManageAccess();
      return updateCourseEnrollment(
        input.enrollment.courseId,
        input.enrollment.id,
        {
          status: input.status,
          completedLessonCount: input.completedLessonCount
        }
      );
    },
    onSuccess: async (enrollment, _variables, context) => {
      await invalidateCourseQueries(
        enrollment.courseId,
        "course-enrollments"
      );
      if (context && mutationFeedback.isCurrent(context)) {
        await refreshCanonicalCourse(enrollment.courseId);
      }
    },
    onError: mutationFeedback.capture
  });

  const courses = computed(() => coursesQuery.data.value ?? []);
  const lessons = computed(() => lessonsQuery.data.value ?? []);
  const enrollments = computed(() => enrollmentsQuery.data.value ?? []);
  const errorMessage = computed(
    () =>
      formatApiErrorMessage(
        coursesQuery.error.value ||
          lessonsQuery.error.value ||
          enrollmentsQuery.error.value,
        t("common.error")
      ) || mutationFeedback.errorMessage.value
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

  async function refreshCanonicalCourse(courseId: string, fallback?: Course) {
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
    if (selectedCourse.value?.id !== courseId) {
      return;
    }
    selectedCourse.value =
      coursesQuery.data.value?.find((course) => course.id === courseId) ??
      fallback ??
      selectedCourse.value;
  }

  async function invalidateCourseQueries(courseId: string, ...keys: string[]) {
    await Promise.all(
      keys.map((key) =>
        queryClient.invalidateQueries({ queryKey: [key, courseId] })
      )
    );
  }

  function resetLessonForm(sortOrder = 1) {
    Object.assign(lessonForm, emptyLessonForm(sortOrder));
  }

  function resetWorkspaceInputs() {
    resetLessonForm();
    enrollmentFilters.status = "";
    enrollmentFilters.query = "";
  }

  function advanceProgress(enrollment: CourseEnrollment) {
    if (
      !canManage.value ||
      enrollmentMutation.isPending.value ||
      enrollment.completedLessonCount >=
        (selectedCourse.value?.lessonCount ?? 0)
    ) {
      return;
    }
    enrollmentMutation.mutate({
      enrollment,
      completedLessonCount: clampLessonCount(
        enrollment.completedLessonCount + 1,
        selectedCourse.value?.lessonCount ?? 0
      )
    });
  }

  function saveCourse() {
    if (!canManage.value || !canSave.value || saveMutation.isPending.value) {
      return;
    }
    saveMutation.mutate({
      courseId: selectedCourse.value?.id ?? null,
      payload: buildCoursePayload(form)
    });
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
      payload: {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        startsAt: dateTimeInputToIso(lessonForm.startsAt),
        status: lessonForm.status,
        sortOrder: Math.max(1, Number(lessonForm.sortOrder) || 1)
      }
    });
  }

  function updateLessonStatus(
    lesson: CourseLesson,
    status: CourseLessonStatus
  ) {
    if (!canManage.value || lessonStatusMutation.isPending.value) {
      return;
    }
    lessonStatusMutation.mutate({ lesson, status });
  }

  function updateEnrollmentStatus(
    enrollment: CourseEnrollment,
    status: CourseEnrollmentStatus
  ) {
    if (!canManage.value || enrollmentMutation.isPending.value) {
      return;
    }
    enrollmentMutation.mutate({
      enrollment,
      status,
      ...(status === "completed"
        ? { completedLessonCount: selectedCourse.value?.lessonCount ?? 0 }
        : {})
    });
  }

  return {
    advanceProgress,
    canCreateLesson,
    canManage,
    canSave,
    courseStatusOptions,
    courses,
    coursesQuery,
    createLesson,
    drawer,
    enrollmentFilters,
    enrollmentMutation,
    enrollments,
    enrollmentsQuery,
    errorMessage,
    filters,
    form,
    lessonForm,
    lessonMutation,
    lessons,
    lessonsQuery,
    lessonStatusMutation,
    newCourse,
    optionItems,
    saveCourse,
    saveMutation,
    selectedCourse,
    selectCourse,
    t,
    updateEnrollmentStatus,
    updateLessonStatus
  };
}
