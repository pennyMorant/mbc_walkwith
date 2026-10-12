import type {
  DiscipleshipAssignmentStatus,
  DiscipleshipJourney,
  DiscipleshipJourneyStatus
} from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";

import {
  listDiscipleshipAssignments,
  listDiscipleshipJourneys,
  listDiscipleshipStages,
  listDiscipleshipTasks
} from "@/core/api/discipleship";

type JourneyFilters = {
  query: string;
  status: DiscipleshipJourneyStatus | "";
};

type AssignmentFilters = {
  status: DiscipleshipAssignmentStatus | "";
  userId: string;
};

export function useDiscipleshipQueries(
  selectedJourney: Ref<DiscipleshipJourney | null>,
  filters: JourneyFilters,
  assignmentFilters: AssignmentFilters
) {
  const journeysQuery = useQuery({
    queryKey: computed(() => ["discipleship-journeys", { ...filters }]),
    queryFn: () => listDiscipleshipJourneys({ ...filters, limit: 100 })
  });
  const assignmentsQuery = useQuery({
    queryKey: computed(() => [
      "discipleship-assignments",
      selectedJourney.value?.id,
      { ...assignmentFilters }
    ]),
    enabled: computed(() => Boolean(selectedJourney.value)),
    queryFn: ({ queryKey }) =>
      listDiscipleshipAssignments({
        ...(queryKey[2] as AssignmentFilters),
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
  const queryError = computed(
    () =>
      journeysQuery.error.value ||
      assignmentsQuery.error.value ||
      stagesQuery.error.value ||
      tasksQuery.error.value
  );

  return {
    assignments,
    assignmentsPending,
    assignmentsQuery,
    journeys,
    journeysPending,
    journeysQuery,
    queryError,
    stages,
    structurePending,
    tasks
  };
}
