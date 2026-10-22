import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/bible-notes/pages/BibleNotesPage.vue", import.meta.url),
  "utf8"
);
const filters = readFileSync(
  new URL(
    "../src/features/bible-notes/components/BibleNoteFilterCard.vue",
    import.meta.url
  ),
  "utf8"
);
const results = readFileSync(
  new URL(
    "../src/features/bible-notes/components/BibleNoteResults.vue",
    import.meta.url
  ),
  "utf8"
);

describe("Bible notes query state", () => {
  test("keeps editable filter drafts separate from applied query values", () => {
    expect(page).toContain("const appliedFilters = ref<BibleVerseNoteFilters>");
    expect(page).toContain("function applyFilters()");
    expect(page).toContain('@apply="applyFilters"');
    expect(filters).not.toContain("useQuery");
    expect(filters).not.toContain("@/core/api/");
  });

  test("submits filters only through an explicit search intent", () => {
    expect(filters).toContain("@keyup.enter=\"$emit('apply')\"");
    expect(filters).toContain("@click=\"$emit('apply')\"");
    expect(filters).not.toContain("@update:model-value");
  });

  test("keeps existing notes visible when a background refresh fails", () => {
    expect(results).toContain(
      ':pending="(pending || fetching) && notes.length === 0"'
    );
    expect(results).toContain('v-if="notes.length > 0 && errorMessage"');
    expect(page).toContain(':fetching="notesQuery.isFetching.value"');
    expect(page).toContain('@retry="notesQuery.refetch()"');
  });

  test("moderates only the selected backend-owned note id", () => {
    expect(page).toContain("hideBibleVerseNote(note.id");
    expect(page).toContain("restoreBibleVerseNote(note.id)");
    expect(page).toContain("requireSelected(selectedNote.value");
  });

  test("keeps query and moderation failures separate", () => {
    expect(page).toContain("queryErrorMessage");
    expect(page).toContain("mutationErrorMessage");
    expect(page).toContain(':error-message="queryErrorMessage"');
  });
});
