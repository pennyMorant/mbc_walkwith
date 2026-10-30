import type {
  SermonDiscussionGuide,
  SermonDiscussionResponse
} from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref, type Ref } from "vue";

import {
  listSermonDiscussionGuides,
  listSermonDiscussionResponses
} from "@/core/api/sermon_discussion_guides";

import {
  createSermonDiscussionGuideFilterForm,
  createSermonDiscussionResponseFilterForm,
  sameSermonDiscussionGuideFilters,
  sermonDiscussionGuideFilterSnapshot,
  type SermonDiscussionGuideFilterForm,
  type SermonDiscussionResponseFilterForm
} from "../sermon_discussion_guide_workspace_models";

export function useSermonDiscussionGuideQueries(
  selectedGuide: Ref<SermonDiscussionGuide | null>
) {
  const filters = reactive(createSermonDiscussionGuideFilterForm());
  const appliedFilters = ref(sermonDiscussionGuideFilterSnapshot(filters));
  const responseFilters = reactive(
    createSermonDiscussionResponseFilterForm()
  );
  const appliedResponseFilters = ref<SermonDiscussionResponseFilterForm>({
    ...responseFilters
  });

  const guidesQuery = useQuery({
    queryKey: computed(() => [
      "sermon-discussion-guides",
      appliedFilters.value
    ]),
    queryFn: ({ queryKey }) =>
      listSermonDiscussionGuides({
        ...(queryKey[1] as SermonDiscussionGuideFilterForm),
        limit: 100
      })
  });

  const responsesQuery = useQuery({
    queryKey: computed(() => [
      "sermon-discussion-responses",
      selectedGuide.value?.id ?? "",
      appliedResponseFilters.value
    ]),
    enabled: computed(() => Boolean(selectedGuide.value)),
    queryFn: ({ queryKey }) =>
      listSermonDiscussionResponses(queryKey[1] as string, {
        ...(queryKey[2] as SermonDiscussionResponseFilterForm),
        limit: 100
      })
  });

  const guides = computed(() => guidesQuery.data.value ?? []);
  const responses = computed<SermonDiscussionResponse[]>(
    () => responsesQuery.data.value ?? []
  );
  const guidesInitialError = computed(() =>
    guidesQuery.data.value === undefined ? guidesQuery.error.value : null
  );
  const guidesRefreshError = computed(() =>
    guidesQuery.data.value !== undefined ? guidesQuery.error.value : null
  );
  const responsesInitialError = computed(() =>
    responsesQuery.data.value === undefined ? responsesQuery.error.value : null
  );
  const responsesRefreshError = computed(() =>
    responsesQuery.data.value !== undefined ? responsesQuery.error.value : null
  );

  function applyGuideFilters() {
    const snapshot = sermonDiscussionGuideFilterSnapshot(filters);
    if (sameSermonDiscussionGuideFilters(appliedFilters.value, snapshot)) {
      return guidesQuery.refetch();
    }
    appliedFilters.value = snapshot;
  }

  function applyResponseFilters() {
    const next = { ...responseFilters };
    if (next.userType === appliedResponseFilters.value.userType) {
      return responsesQuery.refetch();
    }
    appliedResponseFilters.value = next;
  }

  return {
    applyGuideFilters,
    applyResponseFilters,
    filters,
    guides,
    guidesInitialError,
    guidesQuery,
    guidesRefreshError,
    responseFilters,
    responses,
    responsesInitialError,
    responsesQuery,
    responsesRefreshError
  };
}
