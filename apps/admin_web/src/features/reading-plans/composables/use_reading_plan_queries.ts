import type { ReadingPlan } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref, type Ref } from "vue";

import {
  listReadingPlanAssignments,
  listReadingPlanDays,
  listReadingPlans
} from "@/core/api/reading_plans";

import {
  createReadingPlanAssignmentFilterForm,
  createReadingPlanFilterForm,
  readingPlanAssignmentFilterSnapshot,
  readingPlanFilterSnapshot,
  sameReadingPlanAssignmentFilters,
  sameReadingPlanFilters,
  type ReadingPlanAssignmentFilterForm,
  type ReadingPlanFilterForm
} from "../reading_plan_workspace_models";

export function useReadingPlanQueries(
  selectedPlan: Ref<ReadingPlan | null>
) {
  const filters = reactive(createReadingPlanFilterForm());
  const appliedFilters = ref(readingPlanFilterSnapshot(filters));
  const assignmentFilters = reactive(
    createReadingPlanAssignmentFilterForm()
  );
  const appliedAssignmentFilters = ref(
    readingPlanAssignmentFilterSnapshot(assignmentFilters)
  );

  const plansQuery = useQuery({
    queryKey: computed(() => ["reading-plans", appliedFilters.value]),
    queryFn: ({ queryKey }) =>
      listReadingPlans({
        ...(queryKey[1] as ReadingPlanFilterForm),
        limit: 50
      })
  });

  const daysQuery = useQuery({
    queryKey: computed(() => [
      "reading-plan-days",
      selectedPlan.value?.id ?? ""
    ]),
    enabled: computed(() => Boolean(selectedPlan.value)),
    queryFn: ({ queryKey }) => listReadingPlanDays(queryKey[1] as string)
  });

  const assignmentsQuery = useQuery({
    queryKey: computed(() => [
      "reading-plan-assignments",
      selectedPlan.value?.id ?? "",
      appliedAssignmentFilters.value
    ]),
    enabled: computed(() => Boolean(selectedPlan.value)),
    queryFn: ({ queryKey }) =>
      listReadingPlanAssignments({
        ...(queryKey[2] as ReadingPlanAssignmentFilterForm),
        planId: queryKey[1] as string,
        limit: 100
      })
  });

  const assignmentPresenceQuery = useQuery({
    queryKey: computed(() => [
      "reading-plan-assignment-presence",
      selectedPlan.value?.id ?? ""
    ]),
    enabled: computed(() => Boolean(selectedPlan.value)),
    queryFn: ({ queryKey }) =>
      listReadingPlanAssignments({
        planId: queryKey[1] as string,
        limit: 1
      })
  });

  const plans = computed(() => plansQuery.data.value ?? []);
  const days = computed(() => daysQuery.data.value ?? []);
  const assignments = computed(() => assignmentsQuery.data.value ?? []);
  const plansInitialError = initialError(plansQuery);
  const plansRefreshError = refreshError(plansQuery);
  const daysInitialError = initialError(daysQuery);
  const daysRefreshError = refreshError(daysQuery);
  const assignmentsInitialError = initialError(assignmentsQuery);
  const assignmentsRefreshError = refreshError(assignmentsQuery);

  function applyPlanFilters() {
    const snapshot = readingPlanFilterSnapshot(filters);
    if (sameReadingPlanFilters(appliedFilters.value, snapshot)) {
      return plansQuery.refetch();
    }
    appliedFilters.value = snapshot;
  }

  function applyAssignmentFilters() {
    const snapshot = readingPlanAssignmentFilterSnapshot(assignmentFilters);
    if (
      sameReadingPlanAssignmentFilters(
        appliedAssignmentFilters.value,
        snapshot
      )
    ) {
      return assignmentsQuery.refetch();
    }
    appliedAssignmentFilters.value = snapshot;
  }

  return {
    applyAssignmentFilters,
    applyPlanFilters,
    assignmentPresenceQuery,
    assignmentFilters,
    assignments,
    assignmentsInitialError,
    assignmentsQuery,
    assignmentsRefreshError,
    days,
    daysInitialError,
    daysQuery,
    daysRefreshError,
    filters,
    plans,
    plansInitialError,
    plansQuery,
    plansRefreshError
  };
}

function initialError(query: {
  data: { value: unknown };
  error: { value: unknown };
}) {
  return computed(() =>
    query.data.value === undefined ? query.error.value : null
  );
}

function refreshError(query: {
  data: { value: unknown };
  error: { value: unknown };
}) {
  return computed(() =>
    query.data.value !== undefined ? query.error.value : null
  );
}
