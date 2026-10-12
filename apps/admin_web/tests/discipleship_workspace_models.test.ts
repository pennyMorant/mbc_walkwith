import { describe, expect, it } from "bun:test";

import {
  buildDiscipleshipAssignmentPayload,
  buildDiscipleshipProgressPayload,
  createDiscipleshipAssignmentForm,
  normalizeDiscipleshipSortOrder,
  resetDiscipleshipAssignmentForm
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

  it("keeps progress time backend-owned and normalizes sort order", () => {
    expect(buildDiscipleshipProgressPayload({
      status: "completed",
      note: "  reviewed  "
    })).toEqual({ status: "completed", note: "reviewed" });
    expect(normalizeDiscipleshipSortOrder(3.9)).toBe(3);
    expect(normalizeDiscipleshipSortOrder(Number.NaN)).toBe(0);
  });
});
