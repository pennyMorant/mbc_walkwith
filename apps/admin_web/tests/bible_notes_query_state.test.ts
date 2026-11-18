import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const page = readFileSync(
  new URL("../src/features/bible-notes/pages/BibleNotesPage.vue", import.meta.url),
  "utf8"
);
const query = readFileSync(
  new URL(
    "../src/features/bible-notes/composables/use_bible_note_query.ts",
    import.meta.url
  ),
  "utf8"
);
const controller = readFileSync(
  new URL(
    "../src/features/bible-notes/composables/use_bible_notes_page.ts",
    import.meta.url
  ),
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
const drawer = readFileSync(
  new URL(
    "../src/features/bible-notes/components/BibleNoteModerationDrawer.vue",
    import.meta.url
  ),
  "utf8"
);
const messages = readFileSync(
  new URL("../src/core/i18n/i18n.ts", import.meta.url),
  "utf8"
);

describe("Bible notes query state", () => {
  test("keeps editable filter drafts separate from applied query values", () => {
    expect(query).toContain("const appliedFilters = ref(");
    expect(query).toContain("function applyFilters()");
    expect(query).toContain("queryFn: ({ queryKey })");
    expect(page).toContain('@apply="applyFilters"');
    expect(filters).not.toContain("useQuery");
    expect(filters).not.toContain("@/core/api/");
  });

  test("submits filters only through an explicit search intent", () => {
    expect(filters).toContain("AdminFilterToolbar");
    expect(filters).toContain("@apply=\"$emit('apply')\"");
    expect(filters).toContain('type="submit"');
    expect(filters).not.toContain("@update:model-value");
  });

  test("keeps existing notes visible when a background refresh fails", () => {
    expect(results).toContain(
      ':pending="(pending || fetching) && notes.length === 0"'
    );
    expect(results).toContain(':message="refreshErrorMessage"');
    expect(results).toContain("AdminRetryAlert");
    expect(results).toContain("!refreshErrorMessage && notes.length === 0");
    expect(query).toContain("const initialError = computed");
    expect(query).toContain("const refreshError = computed");
    expect(page).toContain(':fetching="notesQuery.isFetching.value"');
    expect(page).toContain('@retry="notesQuery.refetch()"');
  });

  test("moderates only the selected backend-owned note id", () => {
    expect(controller).toContain("hideBibleVerseNote(intent.noteId");
    expect(controller).toContain("restoreBibleVerseNote(intent.noteId)");
    expect(controller).toContain("commandTargetsCurrentDrawer");
    expect(controller).toContain("drawer.value &&");
    expect(controller).toContain("hiddenReason: form.hiddenReason.trim()");
  });

  test("keeps query and moderation failures separate", () => {
    expect(controller).toContain("initialErrorMessage");
    expect(controller).toContain("commandErrorMessage");
    expect(page).toContain(':error-message="commandErrorMessage"');
    expect(controller).toContain("const hasLoadedNotes = computed");
    expect(page).toContain('v-if="hasLoadedNotes"');
  });

  test("keeps moderation presentation outside transport ownership", () => {
    expect(page).toContain("useBibleNotesPage");
    expect(page).not.toContain("@/core/api/");
    expect(page).not.toContain("useMutation");
    expect(drawer).not.toContain("@/core/api/");
    expect(drawer).not.toContain("useMutation");
    expect(drawer).toContain("$emit('hide')");
    expect(drawer).toContain("$emit('restore')");
  });

  test("localizes refresh recovery copy for every supported locale", () => {
    expect(messages.match(/"bibleNotes\.refreshFailed"/g)).toHaveLength(4);
  });
});
