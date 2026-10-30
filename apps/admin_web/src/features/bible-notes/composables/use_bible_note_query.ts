import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import {
  listBibleVerseNotes,
  type BibleVerseNoteFilters
} from "@/core/api/bible_verse_notes";

import {
  bibleNoteFilterSnapshot,
  createBibleNoteFilterForm,
  sameBibleNoteFilters
} from "../bible_note_workspace_models";

export function useBibleNoteQuery() {
  const filters = reactive(createBibleNoteFilterForm());
  const appliedFilters = ref(bibleNoteFilterSnapshot(filters));
  const notesQuery = useQuery({
    queryKey: computed(() => ["bible-verse-notes", appliedFilters.value]),
    queryFn: ({ queryKey }) =>
      listBibleVerseNotes(queryKey[1] as BibleVerseNoteFilters)
  });

  const notes = computed(() => notesQuery.data.value ?? []);
  const initialError = computed(() =>
    notesQuery.data.value === undefined ? notesQuery.error.value : null
  );
  const refreshError = computed(() =>
    notesQuery.data.value !== undefined ? notesQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = bibleNoteFilterSnapshot(filters);
    if (sameBibleNoteFilters(appliedFilters.value, snapshot)) {
      return notesQuery.refetch();
    }
    appliedFilters.value = snapshot;
  }

  return {
    applyFilters,
    filters,
    initialError,
    notes,
    notesQuery,
    refreshError
  };
}
