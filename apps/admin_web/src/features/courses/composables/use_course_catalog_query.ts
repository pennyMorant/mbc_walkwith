import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listCourses } from "@/core/api/courses";

import {
  courseCatalogFilterSnapshot,
  createCourseCatalogFilterForm,
  resetCourseCatalogFilterForm,
  sameCourseCatalogFilters,
  type CourseCatalogFilterSnapshot
} from "../course_workspace_models";

type CourseCatalogQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useCourseCatalogQuery(queryClient: CourseCatalogQueryClient) {
  const filters = reactive(createCourseCatalogFilterForm());
  const appliedFilters = ref(courseCatalogFilterSnapshot(filters));
  const coursesQuery = useQuery({
    queryKey: ["courses", appliedFilters],
    queryFn: ({ queryKey }) =>
      listCourses({
        ...(queryKey[1] as CourseCatalogFilterSnapshot),
        limit: 50
      })
  });

  const courses = computed(() => coursesQuery.data.value ?? []);
  const initialError = computed(() =>
    coursesQuery.data.value === undefined ? coursesQuery.error.value : null
  );
  const refreshError = computed(() =>
    coursesQuery.data.value !== undefined ? coursesQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = courseCatalogFilterSnapshot(filters);
    if (sameCourseCatalogFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function clearFilters() {
    resetCourseCatalogFilterForm(filters);
    return applyFilters();
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["courses", appliedFilters.value]
    });
  }

  return {
    filters,
    coursesQuery,
    courses,
    initialError,
    refreshError,
    applyFilters,
    clearFilters,
    refreshList
  };
}
