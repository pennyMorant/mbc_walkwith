import type { BibleKnowledgeEntity } from "@mbc/api-contracts";
import { describe, expect, test } from "bun:test";

import {
  bibleKnowledgeEditorContext,
  bibleKnowledgeFilterSnapshot,
  bibleKnowledgeUpsertPayload,
  createBibleKnowledgeEditorForm,
  createBibleKnowledgeFilterForm,
  sameBibleKnowledgeEditorContext,
  sameBibleKnowledgeFilters
} from "../src/features/bible-knowledge/bible_knowledge_workspace_models";

describe("Bible knowledge workspace models", () => {
  test("normalizes an immutable applied filter snapshot", () => {
    const filters = createBibleKnowledgeFilterForm();
    filters.query = "  Paul  ";
    filters.locale = "  en  ";
    const snapshot = bibleKnowledgeFilterSnapshot(filters);

    filters.query = "Peter";

    expect(snapshot.query).toBe("Paul");
    expect(snapshot.locale).toBe("en");
    expect(snapshot.limit).toBe(50);
    expect(sameBibleKnowledgeFilters(snapshot, { ...snapshot })).toBe(true);
  });

  test("cleans editor content into a canonical create payload", () => {
    const form = createBibleKnowledgeEditorForm();
    form.id = " paul ";
    form.name = " Paul ";
    form.category = " person ";
    form.aliasesText = "Saul, Apostle\nPaul";
    form.sections = [
      { type: " overview ", title: " Life ", body: " Called by Christ " },
      { type: "empty", title: "Empty", body: " " }
    ];
    form.verseAliasesText = '{"Acts 9:1":[" Saul ", 7]}';

    const payload = bibleKnowledgeUpsertPayload(
      form,
      { locale: "en", translationId: "web" },
      "invalid"
    );

    expect(payload.id).toBe("paul");
    expect(payload.aliases).toEqual(["Saul", "Apostle", "Paul"]);
    expect(payload.sections).toEqual([
      { type: "overview", title: "Life", body: "Called by Christ" }
    ]);
    expect(payload.verseAliases).toEqual({ "Acts 9:1": ["Saul"] });
  });

  test("requires the full canonical key before an async result targets the editor", () => {
    const entity = {
      id: "paul",
      locale: "en",
      translationId: "web"
    } as BibleKnowledgeEntity;
    const command = bibleKnowledgeEditorContext(entity, {
      locale: "en",
      translationId: "web"
    });
    const otherTranslation = bibleKnowledgeEditorContext(
      { ...entity, translationId: "cuvs" },
      { locale: "en", translationId: "web" }
    );

    expect(sameBibleKnowledgeEditorContext(command, command)).toBe(true);
    expect(
      sameBibleKnowledgeEditorContext(otherTranslation, command)
    ).toBe(false);
  });

  test("rejects malformed verse alias JSON before transport", () => {
    const form = createBibleKnowledgeEditorForm();
    form.id = "paul";
    form.name = "Paul";
    form.category = "person";
    form.verseAliasesText = "{";

    expect(() =>
      bibleKnowledgeUpsertPayload(
        form,
        { locale: "en", translationId: "web" },
        "invalid aliases"
      )
    ).toThrow("invalid aliases");
  });
});
