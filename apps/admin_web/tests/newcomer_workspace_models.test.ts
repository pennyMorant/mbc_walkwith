import { describe, expect, it } from "bun:test";

import {
  createNewcomerListFilterForm,
  newcomerListFilterSnapshot,
  newcomerFollowUpHasRequiredSchedule,
  newcomerResultTargetsSelection,
  resetNewcomerListFilterForm,
  sameNewcomerListFilters
} from "../src/features/newcomers/newcomer_workspace_models";

describe("newcomer workspace models", () => {
  it("creates stable applied filters without mutating the draft", () => {
    const filters = createNewcomerListFilterForm();
    filters.query = "  Jordan  ";
    filters.status = "contacted";

    const snapshot = newcomerListFilterSnapshot(filters);

    expect(snapshot).toEqual({ query: "Jordan", status: "contacted" });
    expect(filters.query).toBe("  Jordan  ");
    expect(sameNewcomerListFilters(snapshot, { ...snapshot })).toBe(true);

    resetNewcomerListFilterForm(filters);
    expect(filters).toEqual({ query: "", status: "" });
  });

  it("requires a schedule for every non-completed follow-up", () => {
    expect(newcomerFollowUpHasRequiredSchedule("completed", null)).toBe(true);
    expect(newcomerFollowUpHasRequiredSchedule("planned", null)).toBe(false);
    expect(
      newcomerFollowUpHasRequiredSchedule(
        "cancelled",
        "2026-07-14T18:00:00.000Z"
      )
    ).toBe(true);
  });

  it("applies asynchronous results only to the active newcomer", () => {
    expect(newcomerResultTargetsSelection("newcomer_1", "newcomer_1")).toBe(
      true
    );
    expect(newcomerResultTargetsSelection(null, "newcomer_1")).toBe(false);
    expect(newcomerResultTargetsSelection("newcomer_2", "newcomer_1")).toBe(
      false
    );
  });
});
