import type {
  CourseEnrollment,
  CourseEnrollmentStatus,
  CourseLesson
} from "@mbc/api-contracts";
import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  listCourseEnrollments,
  listCourseLessons
} from "@/core/api/courses";

type CourseWorkspaceQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useCourseWorkspaceQueries(
  selectedCourseId: Ref<string | null>,
  queryClient: CourseWorkspaceQueryClient,
  t: (key: string) => string
) {
  const enrollmentFilters = reactive({
    status: "" as CourseEnrollmentStatus | "",
    query: ""
  });
  const appliedEnrollmentFilters = ref({
    status: "" as CourseEnrollmentStatus | "",
    query: "",
    limit: 100
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
      appliedEnrollmentFilters.value
    ]),
    enabled: computed(() => Boolean(selectedCourseId.value)),
    queryFn: ({ queryKey }) => {
      const courseId = queryKey[1] as string | null;
      const query = queryKey[2] as typeof appliedEnrollmentFilters.value;
      return courseId
        ? listCourseEnrollments(courseId, query)
        : Promise.resolve([] as CourseEnrollment[]);
    }
  });

  const lessons = computed(() => lessonsQuery.data.value ?? []);
  const enrollments = computed(() => enrollmentsQuery.data.value ?? []);
  const lessonsErrorMessage = computed(() =>
    queryErrorMessage(lessonsQuery.data.value, lessonsQuery.error.value, false)
  );
  const lessonsRefreshErrorMessage = computed(() =>
    queryErrorMessage(lessonsQuery.data.value, lessonsQuery.error.value, true)
  );
  const enrollmentsErrorMessage = computed(() =>
    queryErrorMessage(
      enrollmentsQuery.data.value,
      enrollmentsQuery.error.value,
      false
    )
  );
  const enrollmentsRefreshErrorMessage = computed(() =>
    queryErrorMessage(
      enrollmentsQuery.data.value,
      enrollmentsQuery.error.value,
      true
    )
  );

  function queryErrorMessage(
    data: unknown,
    error: unknown,
    forRefresh: boolean
  ) {
    return (data !== undefined) === forRefresh
      ? formatApiErrorMessage(error, t("common.error"))
      : "";
  }

  function applyEnrollmentFilters() {
    appliedEnrollmentFilters.value = {
      status: enrollmentFilters.status,
      query: enrollmentFilters.query.trim(),
      limit: 100
    };
  }

  function resetEnrollmentFilters() {
    enrollmentFilters.status = "";
    enrollmentFilters.query = "";
    appliedEnrollmentFilters.value = {
      status: "",
      query: "",
      limit: 100
    };
  }

  async function invalidateCourseResources(courseId: string, ...keys: string[]) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["courses"] }),
      ...keys.map((key) =>
        queryClient.invalidateQueries({ queryKey: [key, courseId] })
      )
    ]);
  }

  return {
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
  };
}
