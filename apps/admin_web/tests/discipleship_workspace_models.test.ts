import { describe, expect, it } from "bun:test";

import {
  buildDiscipleshipAssignmentPayload,
  buildDiscipleshipProgressPayload,
  createDiscipleshipAssignmentFilterForm,
  createDiscipleshipAssignmentForm,
  createDiscipleshipJourneyFilterForm,
  discipleshipCommandTargetsJourney,
  normalizeDiscipleshipPosition,
  resetDiscipleshipAssignmentForm,
  snapshotDiscipleshipAssignmentFilters,
  snapshotDiscipleshipJourneyFilters
} from "../src/features/discipleship/discipleship_workspace_models";

describe("discipleship workspace models", () => {
  it("normalizes assignment intent without copying display state", () => {
    const form = createDiscipleshipAssignmentForm("old_journey");
    form.userId = " member_1 ";
    form.sourceType = "newcomer";
    form.sourceId = " newcomer_1 ";
    form.assigneeName = " Pastor Lee ";

    expect(buildDiscipleshipAssignmentPayload(form, "journey_1")).toMatchObject({
      journeyId: "journey_1",
      userId: "member_1",
      sourceId: "newcomer_1",
      assigneeName: "Pastor Lee"
    });
  });

  it("resets assignment state when switching journeys", () => {
    const form = createDiscipleshipAssignmentForm("journey_1");
    form.userId = "member_1";
    resetDiscipleshipAssignmentForm(form, "journey_2");
    expect(form).toEqual(createDiscipleshipAssignmentForm("journey_2"));
  });

  it("keeps progress time backend-owned and normalizes position", () => {
    expect(buildDiscipleshipProgressPayload({
      status: "completed",
      note: "  reviewed  "
    })).toEqual({ status: "completed", note: "reviewed" });
    expect(normalizeDiscipleshipPosition(3.9)).toBe(3);
    expect(normalizeDiscipleshipPosition(Number.NaN)).toBe(0);
  });

  it("snapshots normalized query filters without mutating drafts", () => {
    const journeys = createDiscipleshipJourneyFilterForm();
    const assignments = createDiscipleshipAssignmentFilterForm();
    journeys.query = "  foundations  ";
    assignments.userId = " member_1 ";

    expect(snapshotDiscipleshipJourneyFilters(journeys).query).toBe(
      "foundations"
    );
    expect(snapshotDiscipleshipAssignmentFilters(assignments).userId).toBe(
      "member_1"
    );
    expect(journeys.query).toBe("  foundations  ");
    expect(assignments.userId).toBe(" member_1 ");
  });

  it("accepts command results only for the selected journey", () => {
    expect(discipleshipCommandTargetsJourney("journey_1", "journey_1")).toBe(
      true
    );
    expect(discipleshipCommandTargetsJourney("journey_2", "journey_1")).toBe(
      false
    );
    expect(discipleshipCommandTargetsJourney(null, null)).toBe(true);
  });
});
