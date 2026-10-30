import { describe, expect, it } from "bun:test";

import {
  createReadingPlanAssignmentFilterForm,
  createReadingPlanFilterForm,
  readingPlanAssignmentFilterSnapshot,
  readingPlanCommandTargetsSelection,
  readingPlanFilterSnapshot,
  sameReadingPlanAssignmentFilters,
  sameReadingPlanFilters
} from "../src/features/reading-plans/reading_plan_workspace_models";

describe("reading plan workspace models", () => {
  it("normalizes plan filters without mutating the draft", () => {
    const draft = createReadingPlanFilterForm();
    draft.query = "  grace  ";
    draft.locale = " en ";

    const snapshot = readingPlanFilterSnapshot(draft);

    expect(snapshot).toEqual({
      query: "grace",
      status: "",
      visibility: "",
      locale: "en"
    });
    expect(draft.query).toBe("  grace  ");
    expect(sameReadingPlanFilters(snapshot, { ...snapshot })).toBe(true);
  });

  it("normalizes assignment filters without mutating the draft", () => {
    const draft = createReadingPlanAssignmentFilterForm();
    draft.userId = " member_1 ";

    const snapshot = readingPlanAssignmentFilterSnapshot(draft);

    expect(snapshot.userId).toBe("member_1");
    expect(draft.userId).toBe(" member_1 ");
    expect(
      sameReadingPlanAssignmentFilters(snapshot, { ...snapshot })
    ).toBe(true);
  });

  it("accepts command results only for the selected plan context", () => {
    expect(readingPlanCommandTargetsSelection("plan_1", "plan_1")).toBe(
      true
    );
    expect(readingPlanCommandTargetsSelection("plan_2", "plan_1")).toBe(
      false
    );
    expect(readingPlanCommandTargetsSelection(null, null)).toBe(true);
  });
});
