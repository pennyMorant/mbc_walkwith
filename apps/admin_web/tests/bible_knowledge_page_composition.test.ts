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

describe("Bible knowledge page composition", () => {
  it("keeps CRUD, permission, and canonical payload work page-owned", () => {
    expect(pageSource).toContain("createBibleKnowledgeEntity");
    expect(pageSource).toContain("updateBibleKnowledgeEntity");
    expect(pageSource).toContain("deleteBibleKnowledgeEntity");
    expect(pageSource).toContain("authStore.can");
    expect(pageSource).toContain("parseVerseAliases");
    expect(pageSource).toContain("cleanedSections");
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
