import { describe, expect, test } from "bun:test";

import {
  bibleNoteCommandTargetsSelection,
  bibleNoteFilterSnapshot,
  bibleNoteStatusColor,
  createBibleNoteFilterForm,
  sameBibleNoteFilters
} from "../src/features/bible-notes/bible_note_workspace_models";

describe("Bible note workspace models", () => {
  test("normalizes an immutable filter snapshot", () => {
    const filters = createBibleNoteFilterForm();
    filters.query = "  hope  ";
    filters.verseId = "  rom.8.28  ";
    const snapshot = bibleNoteFilterSnapshot(filters);

    filters.query = "grace";

    expect(snapshot.query).toBe("hope");
    expect(snapshot.verseId).toBe("rom.8.28");
    expect(snapshot.limit).toBe(100);
    expect(sameBibleNoteFilters(snapshot, { ...snapshot })).toBe(true);
  });

  test("accepts moderation results only for the active backend note id", () => {
    expect(bibleNoteCommandTargetsSelection("note_1", "note_1")).toBe(true);
    expect(bibleNoteCommandTargetsSelection("note_2", "note_1")).toBe(false);
    expect(bibleNoteCommandTargetsSelection(null, "note_1")).toBe(false);
  });

  test("maps canonical note states to stable semantic colors", () => {
    expect(bibleNoteStatusColor("published")).toBe("success");
    expect(bibleNoteStatusColor("hidden")).toBe("error");
    expect(bibleNoteStatusColor("deleted")).toBe("secondary");
  });
});
