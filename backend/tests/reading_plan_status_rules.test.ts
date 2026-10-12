import type { ReadingPlan, ReadingPlanDay } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import {
  assertReadingPlanAssignmentTransition,
  assertReadingPlanProgressWritable,
  assertReadingPlanScheduleComplete,
  assertReadingPlanUpdateAllowed,
  readingPlanUpdateChangesAssignedStructure
} from "../src/modules/reading-plans/reading_plan_status_rules.js";

describe("reading plan status rules", () => {
  it("allows explicit recovery transitions without changing locked content", () => {
    expect(() =>
      assertReadingPlanUpdateAllowed(plan({ status: "published" }), {
        status: "paused"
      })
    ).not.toThrow();
    expect(() =>
      assertReadingPlanUpdateAllowed(plan({ status: "archived" }), {
        status: "draft"
      })
    ).not.toThrow();
  });

  it("rejects invalid transitions and in-place published content edits", () => {
    expect(() =>
      assertReadingPlanUpdateAllowed(plan({ status: "draft" }), {
        status: "paused"
      })
    ).toThrowError(
      expect.objectContaining({
        code: "reading_plan_transition_invalid",
        evidence: expect.objectContaining({ reason: "transition_not_allowed" })
      })
    );
    expect(() =>
      assertReadingPlanUpdateAllowed(plan({ status: "published" }), {
        title: "Changed while published"
      })
    ).toThrowError(
      expect.objectContaining({
        code: "reading_plan_transition_invalid",
        evidence: expect.objectContaining({ reason: "plan_content_locked" })
      })
    );
  });

  it("requires every configured day before publication", () => {
    expect(() =>
      assertReadingPlanScheduleComplete("plan-1", 2, [day(1), day(2)])
    ).not.toThrow();
    expect(() =>
      assertReadingPlanScheduleComplete("plan-1", 3, [day(1), day(3)])
    ).toThrowError(
      expect.objectContaining({
        code: "reading_plan_publish_incomplete",
        evidence: expect.objectContaining({ missingDayNumbers: [2] })
      })
    );
  });

  it("distinguishes assignment-sensitive structure from editable copy", () => {
    const existing = plan({ status: "paused" });
    expect(
      readingPlanUpdateChangesAssignedStructure(existing, {
        description: "Updated copy"
      })
    ).toBe(false);
    expect(
      readingPlanUpdateChangesAssignedStructure(existing, {
        visibility: "members"
      })
    ).toBe(true);
    expect(
      readingPlanUpdateChangesAssignedStructure(existing, { durationDays: 3 })
    ).toBe(true);
  });

  it("closes progress while the plan or assignment is paused", () => {
    const assignment = {
      id: "assignment-1",
      planId: "plan-1",
      userType: "external" as const,
      userId: "ext_reader",
      sourceType: "self" as const,
      sourceId: null,
      planTitle: "Plan",
      planDurationDays: 2,
      attemptNumber: 1,
      status: "active" as const,
      startedAt: null,
      completedAt: null,
      endedAt: null,
      progress: [],
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    };
    expect(() =>
      assertReadingPlanProgressWritable(
        plan({ status: "published" }),
        assignment
      )
    ).not.toThrow();
    expect(() =>
      assertReadingPlanProgressWritable(plan({ status: "paused" }), assignment)
    ).toThrowError(
      expect.objectContaining({ code: "reading_plan_progress_closed" })
    );
    expect(() =>
      assertReadingPlanProgressWritable(plan({ status: "published" }), {
        ...assignment,
        status: "paused"
      })
    ).toThrowError(
      expect.objectContaining({ code: "reading_plan_progress_closed" })
    );
    expect(() =>
      assertReadingPlanProgressWritable(plan({ status: "published" }), {
        ...assignment,
        status: "completed"
      })
    ).toThrowError(
      expect.objectContaining({ code: "reading_plan_progress_closed" })
    );
  });

  it("keeps completed and abandoned assignments immutable", () => {
    const assignment = {
      id: "assignment-1",
      planId: "plan-1",
      planTitle: "Plan",
      planDurationDays: 2,
      attemptNumber: 1,
      userType: "external" as const,
      userId: "ext_reader",
      sourceType: "self" as const,
      sourceId: null,
      status: "completed" as const,
      startedAt: "2026-07-12T00:00:00.000Z",
      completedAt: "2026-07-13T00:00:00.000Z",
      endedAt: "2026-07-13T00:00:00.000Z",
      progress: [],
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-13T00:00:00.000Z"
    };
    expect(() =>
      assertReadingPlanAssignmentTransition(assignment, "active")
    ).toThrowError(
      expect.objectContaining({
        code: "reading_plan_assignment_transition_invalid"
      })
    );
  });
});

function plan(overrides: Partial<ReadingPlan> = {}): ReadingPlan {
  return {
    id: "plan-1",
    title: "Plan",
    description: "Description",
    status: "draft",
    visibility: "public",
    locale: "en",
    durationDays: 2,
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    ...overrides
  };
}

function day(dayNumber: number): ReadingPlanDay {
  return {
    id: `day-${dayNumber}`,
    planId: "plan-1",
    dayNumber,
    title: "",
    description: "",
    references: [
      {
        bookId: "john",
        chapter: 1,
        startVerse: 1,
        endVerse: 1,
        referenceLabel: "John 1:1"
      }
    ],
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  };
}
