import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../src/features/bible-knowledge/pages/BibleKnowledgePage.vue", import.meta.url),
  "utf8"
);
const editorSource = readFileSync(
  new URL("../src/features/bible-knowledge/components/BibleKnowledgeEntityEditor.vue", import.meta.url),
  "utf8"
);
const controllerSource = readFileSync(
  new URL("../src/features/bible-knowledge/composables/use_bible_knowledge_page.ts", import.meta.url),
  "utf8"
);
const modelsSource = readFileSync(
  new URL("../src/features/bible-knowledge/bible_knowledge_workspace_models.ts", import.meta.url),
  "utf8"
);

describe("Bible knowledge page composition", () => {
  it("keeps the page composition-only and moves workspace ownership to the controller", () => {
    expect(pageSource).toContain("useBibleKnowledgePage");
    expect(pageSource).not.toContain("createBibleKnowledgeEntity");
    expect(pageSource).not.toContain("useMutation");
    expect(controllerSource).toContain("createBibleKnowledgeEntity");
    expect(controllerSource).toContain("authStore.can");
    expect(controllerSource).toContain("drawer.value &&");
    expect(modelsSource).toContain("bibleKnowledgeUpsertPayload");
    expect(modelsSource).toContain("sameBibleKnowledgeEditorContext");
  });

  it("uses a presentation-only editor for field and section intents", () => {
    expect(pageSource).toContain("<BibleKnowledgeEntityEditor");
    expect(editorSource).not.toContain("@/core/api/");
    expect(editorSource).not.toContain("useAdminAuthStore");
    expect(editorSource).not.toContain("JSON.parse");
    expect(editorSource).toContain("$emit('moveSection'");
    expect(editorSource).toContain("$emit('save')");
    expect(editorSource).toContain("$emit('delete')");
  });
});
