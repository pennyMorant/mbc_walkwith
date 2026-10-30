import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import {
  listBibleKnowledge,
  type BibleKnowledgeListFilters
} from "@/core/api/bible_knowledge";

import {
  bibleKnowledgeFilterSnapshot,
  createBibleKnowledgeFilterForm,
  sameBibleKnowledgeFilters
} from "../bible_knowledge_workspace_models";

export function useBibleKnowledgeQuery() {
  const filters = reactive(createBibleKnowledgeFilterForm());
  const appliedFilters = ref(bibleKnowledgeFilterSnapshot(filters));
  const entitiesQuery = useQuery({
    queryKey: computed(() => ["bible-knowledge", appliedFilters.value]),
    queryFn: ({ queryKey }) =>
      listBibleKnowledge(queryKey[1] as BibleKnowledgeListFilters)
  });

  const entities = computed(() => entitiesQuery.data.value ?? []);
  const initialError = computed(() =>
    entitiesQuery.data.value === undefined ? entitiesQuery.error.value : null
  );
  const refreshError = computed(() =>
    entitiesQuery.data.value !== undefined ? entitiesQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = bibleKnowledgeFilterSnapshot(filters);
    if (sameBibleKnowledgeFilters(appliedFilters.value, snapshot)) {
      return entitiesQuery.refetch();
    }
    appliedFilters.value = snapshot;
  }

  return {
    appliedFilters,
    applyFilters,
    entities,
    entitiesQuery,
    filters,
    initialError,
    refreshError
  };
}
