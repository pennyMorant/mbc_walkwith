import { describe, expect, it } from "vitest";

import { InMemoryReadingPlanRepository } from "../src/modules/reading-plans/in-memory-reading-plan.repository.js";

describe("reading plan repository concurrency guards", () => {
  it("rejects a stale status write and keeps a closed attempt immutable", async () => {
    const repository = new InMemoryReadingPlanRepository();
    const plan = await repository.createPlan({
      title: "Plan",
      description: "Description",
      status: "draft",
      visibility: "public",
      locale: "en",
      durationDays: 1
    });
    await repository.updatePlan(plan.id, { status: "published" });
    const assignment = await repository.createAssignment({
      planId: plan.id,
      planTitle: plan.title,
      planDurationDays: plan.durationDays,
      userType: "external",
      userId: "ext_concurrency_test",
      sourceType: "self",
      sourceId: null
    });

    const abandoned = await repository.updateAssignmentStatus(
      assignment.id,
      "not_started",
      "abandoned"
    );
    const staleResume = await repository.updateAssignmentStatus(
      assignment.id,
      "not_started",
      "active"
    );

    expect(abandoned?.status).toBe("abandoned");
    expect(staleResume).toBeNull();
    expect((await repository.getAssignmentById(assignment.id))?.status).toBe(
      "abandoned"
    );
  });

  it("refuses progress after an attempt closes", async () => {
    const repository = new InMemoryReadingPlanRepository();
    const plan = await repository.createPlan({
      title: "Plan",
      description: "Description",
      status: "draft",
      visibility: "public",
      locale: "en",
      durationDays: 1
    });
    await repository.updatePlan(plan.id, { status: "published" });
    const day = await repository.upsertDay(plan.id, {
      dayNumber: 1,
      title: "Day 1",
      description: "",
      references: []
    });
    const assignment = await repository.createAssignment({
      planId: plan.id,
      planTitle: plan.title,
      planDurationDays: plan.durationDays,
      userType: "external",
      userId: "ext_closed_progress_test",
      sourceType: "self",
      sourceId: null
    });
    await repository.updateAssignmentStatus(
      assignment.id,
      "not_started",
      "abandoned"
    );

    const result = await repository.upsertDayProgress(
      assignment.id,
      day.id,
      { status: "completed", note: "Late write" }
    );

    expect(result).toEqual({ kind: "closed" });
    expect(
      (await repository.getAssignmentById(assignment.id))?.progress
    ).toEqual([]);
  });
});
