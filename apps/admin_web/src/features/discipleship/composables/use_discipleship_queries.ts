import type { DiscipleshipJourney } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref, type Ref } from "vue";

import {
  listDiscipleshipAssignments,
  listDiscipleshipJourneys,
  listDiscipleshipStages,
  listDiscipleshipTasks
} from "@/core/api/discipleship";

import {
  createDiscipleshipAssignmentFilterForm,
  createDiscipleshipJourneyFilterForm,
  sameDiscipleshipAssignmentFilters,
  sameDiscipleshipJourneyFilters,
  snapshotDiscipleshipAssignmentFilters,
  snapshotDiscipleshipJourneyFilters,
  type DiscipleshipAssignmentFilterForm,
  type DiscipleshipJourneyFilterForm
} from "../discipleship_workspace_models";

export function useDiscipleshipQueries(
  selectedJourney: Ref<DiscipleshipJourney | null>
) {
  const filters = reactive(createDiscipleshipJourneyFilterForm());
  const appliedFilters = ref(snapshotDiscipleshipJourneyFilters(filters));
  const assignmentFilters = reactive(
    createDiscipleshipAssignmentFilterForm()
  );
  const appliedAssignmentFilters = ref(
    snapshotDiscipleshipAssignmentFilters(assignmentFilters)
  );

  const journeysQuery = useQuery({
    queryKey: computed(() => ["discipleship-journeys", appliedFilters.value]),
    queryFn: ({ queryKey }) =>
      listDiscipleshipJourneys({
        ...(queryKey[1] as DiscipleshipJourneyFilterForm),
        limit: 100
      })
  });
  const assignmentsQuery = useQuery({
    queryKey: computed(() => [
      "discipleship-assignments",
      selectedJourney.value?.id,
      appliedAssignmentFilters.value
    ]),
    enabled: computed(() => Boolean(selectedJourney.value)),
    queryFn: ({ queryKey }) =>
      listDiscipleshipAssignments({
        ...(queryKey[2] as DiscipleshipAssignmentFilterForm),
        journeyId: queryKey[1] as string,
        limit: 100
      })
  });
  const stagesQuery = useQuery({
    queryKey: computed(() => [
      "discipleship-stages",
      selectedJourney.value?.id
    ]),
    enabled: computed(() => Boolean(selectedJourney.value)),
    queryFn: ({ queryKey }) => listDiscipleshipStages(queryKey[1] as string)
  });
  const tasksQuery = useQuery({
    queryKey: computed(() => [
      "discipleship-tasks",
      selectedJourney.value?.id
    ]),
    enabled: computed(() => Boolean(selectedJourney.value)),
    queryFn: ({ queryKey }) => listDiscipleshipTasks(queryKey[1] as string)
  });

  const journeys = computed(() => journeysQuery.data.value ?? []);
  const assignments = computed(() => assignmentsQuery.data.value ?? []);
  const stages = computed(() => stagesQuery.data.value ?? []);
  const tasks = computed(() => tasksQuery.data.value ?? []);
  const journeysPending = computed(() => journeysQuery.isPending.value);
  const assignmentsPending = computed(
    () => Boolean(selectedJourney.value) && assignmentsQuery.isPending.value
  );
  const structurePending = computed(
    () =>
      Boolean(selectedJourney.value) &&
      (stagesQuery.isPending.value || tasksQuery.isPending.value)
  );
  const journeysInitialError = initialError(journeysQuery);
  const journeysRefreshError = refreshError(journeysQuery);
  const assignmentsInitialError = initialError(assignmentsQuery);
  const assignmentsRefreshError = refreshError(assignmentsQuery);
  const structureInitialError = computed(
    () => initialErrorValue(stagesQuery) || initialErrorValue(tasksQuery)
  );
  const structureRefreshError = computed(
    () => refreshErrorValue(stagesQuery) || refreshErrorValue(tasksQuery)
  );

  function applyJourneyFilters() {
    const snapshot = snapshotDiscipleshipJourneyFilters(filters);
    if (sameDiscipleshipJourneyFilters(appliedFilters.value, snapshot)) {
      return journeysQuery.refetch();
    }
    appliedFilters.value = snapshot;
  }

  function applyAssignmentFilters() {
    const snapshot = snapshotDiscipleshipAssignmentFilters(assignmentFilters);
    if (
      sameDiscipleshipAssignmentFilters(
        appliedAssignmentFilters.value,
        snapshot
      )
    ) {
      return assignmentsQuery.refetch();
    }
    appliedAssignmentFilters.value = snapshot;
  }

  function refreshStructure() {
    return Promise.all([stagesQuery.refetch(), tasksQuery.refetch()]);
  }

  return {
    applyAssignmentFilters,
    applyJourneyFilters,
    assignmentFilters,
    assignments,
    assignmentsInitialError,
    assignmentsPending,
    assignmentsQuery,
    assignmentsRefreshError,
    filters,
    journeys,
    journeysInitialError,
    journeysPending,
    journeysQuery,
    journeysRefreshError,
    refreshStructure,
    stages,
    stagesQuery,
    structureInitialError,
    structurePending,
    structureRefreshError,
    tasksQuery,
    tasks
  };
}

function initialError(query: QueryState) {
  return computed(() => initialErrorValue(query));
}

function refreshError(query: QueryState) {
  return computed(() => refreshErrorValue(query));
}

function initialErrorValue(query: QueryState) {
  return query.data.value === undefined ? query.error.value : null;
}

function refreshErrorValue(query: QueryState) {
  return query.data.value !== undefined ? query.error.value : null;
}

type QueryState = {
  data: { value: unknown };
  error: { value: unknown };
};
