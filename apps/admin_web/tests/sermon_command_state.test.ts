import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

const controller = source(
  "../src/features/sermons/composables/use_sermons_page_controller.ts"
);
const audio = source(
  "../src/features/sermons/composables/use_sermon_audio_state.ts"
);
const actions = source(
  "../src/features/sermons/components/SermonEditorActions.vue"
);
const page = source("../src/features/sermons/pages/SermonsPage.vue");
const feedback = source(
  "../src/features/sermons/composables/use_sermon_command_feedback.ts"
);
const cleanup = source(
  "../src/features/sermons/components/SermonAudioCleanupCard.vue"
);
const cleanupResults = source(
  "../src/features/sermons/components/SermonAudioCleanupResults.vue"
);

describe("sermon command state", () => {
  test("serializes revision-bearing sermon writes", () => {
    expect(controller).toContain("const sermonRecordCommandPending = computed");
    expect(controller).toContain("const sermonWritePending = computed");
    expect(controller).toContain("action.disabled || sermonWritePending.value");
    expect(audio).toContain("otherWritePending");
    expect(actions).toContain("commandPending");
    expect(page).toContain(':command-pending="sermonWritePending"');
    expect(controller.match(/function runPipelineAction/g)?.length).toBe(1);
  });

  test("scopes command failures to the active canonical sermon", () => {
    expect(feedback).toContain("sermonMutationTargetsSelection");
    expect(feedback).toContain("mutation.variables.value");
    expect(controller).toContain("const sermonRecordMutations");
    expect(page).toContain(':error-message="sermonAudioErrorMessage"');
  });

  test("presents guarded manuscript imports and recovery feedback", () => {
    expect(page).toContain(':import-pending="manualManuscriptImportPending"');
    expect(page).toContain(':import-error="manualManuscriptImportError"');
    expect(page).toContain(':import-pending="transcriptImportPending"');
    expect(page).toContain(':import-error="transcriptImportError"');
  });

  test("keeps audio cleanup actions usable on narrow screens", () => {
    expect(cleanup).toContain("AdminDataState");
    expect(cleanup).toContain("SermonAudioCleanupResults");
    expect(cleanup).toContain('@retry="retryTask"');
    expect(cleanup).toContain(":refresh-error=\"tasks.length > 0 ? queryError : ''\"");
    expect(cleanupResults).toContain("AdminRetryAlert");
    expect(cleanupResults).toContain('class="d-none d-md-block"');
    expect(cleanupResults).toContain("cleanup-mobile-list d-md-none");
    expect(cleanupResults.match(/\$emit\('retry', task\)/g)?.length).toBe(2);
    expect(cleanupResults).toContain("formatAdminDateTime(task.updatedAt, locale)");
    expect(cleanupResults).not.toContain("new Intl.DateTimeFormat");
  });
});

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}
