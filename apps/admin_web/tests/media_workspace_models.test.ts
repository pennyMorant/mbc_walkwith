import { describe, expect, test } from "bun:test";

import {
  createMediaLibraryFilterForm,
  mediaCommandTargetsSelection,
  mediaLibraryFilterSnapshot,
  resetMediaLibraryFilterForm,
  sameMediaLibraryFilters
} from "../src/features/media/media_workspace_models";

describe("media workspace models", () => {
  test("keeps editable filters separate from the applied snapshot", () => {
    const filters = createMediaLibraryFilterForm();
    filters.visibility = "public";
    filters.consentStatus = "approved";

    const snapshot = mediaLibraryFilterSnapshot(filters);
    filters.consentStatus = "restricted";

    expect(snapshot).toEqual({
      visibility: "public",
      consentStatus: "approved"
    });
    expect(sameMediaLibraryFilters(snapshot, { ...snapshot })).toBe(true);
    expect(sameMediaLibraryFilters(snapshot, filters)).toBe(false);

    resetMediaLibraryFilterForm(filters);
    expect(filters).toEqual({ visibility: "", consentStatus: "" });
  });

  test("accepts command results only for the open canonical asset", () => {
    expect(mediaCommandTargetsSelection("asset-1", true, "asset-1")).toBe(
      true
    );
    expect(mediaCommandTargetsSelection("asset-2", true, "asset-1")).toBe(
      false
    );
    expect(mediaCommandTargetsSelection("asset-1", false, "asset-1")).toBe(
      false
    );
  });
});
