import { describe, expect, test } from "bun:test";

import {
  createSermonLibraryFilterForm,
  sameSermonLibraryFilters,
  sermonLibraryFilterSnapshot
} from "../src/features/sermons/sermon_library_models";

describe("sermon library models", () => {
  test("creates a normalized immutable snapshot when filters are applied", () => {
    const form = createSermonLibraryFilterForm();
    form.query = "  grace  ";
    form.speaker = "  Pastor Chen ";
    form.status = "published";

    const applied = sermonLibraryFilterSnapshot(form);
    form.query = "hope";

    expect(applied).toEqual({
      query: "grace",
      status: "published",
      speaker: "Pastor Chen",
      series: "",
      topic: ""
    });
    expect(
      sameSermonLibraryFilters(
        applied,
        sermonLibraryFilterSnapshot({
          ...form,
          query: " grace ",
          speaker: "Pastor Chen"
        })
      )
    ).toBeTrue();
  });
});
