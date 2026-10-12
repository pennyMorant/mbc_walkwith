import { describe, expect, it } from "bun:test";
import type { ReadingPlan, ReadingPlanDay } from "@mbc/api-contracts";
import { nextTick, ref } from "vue";

import { useReadingPlanDayForm } from "../src/features/reading-plans/composables/use_reading_plan_day_form";
import {
  nextReadingPlanDayNumber,
  readingPlanVisibilityAllowsUserType
} from "../src/features/reading-plans/reading_plan_ui_rules";

describe("reading plan admin UI rules", () => {
  it("selects the first missing day instead of using list length", () => {
    expect(
      nextReadingPlanDayNumber([{ dayNumber: 1 }, { dayNumber: 3 }], 4)
    ).toBe(2);
    expect(nextReadingPlanDayNumber([], 7)).toBe(1);
  });

  it("moves beyond the schedule when every day exists", () => {
    expect(
      nextReadingPlanDayNumber(
        [{ dayNumber: 1 }, { dayNumber: 2 }, { dayNumber: 3 }],
        3
      )
    ).toBe(4);
  });

  it("keeps members-only assignment controls unavailable to external users", () => {
    expect(readingPlanVisibilityAllowsUserType("members", "external")).toBe(
      false
    );
    expect(readingPlanVisibilityAllowsUserType("members", "member")).toBe(true);
    expect(readingPlanVisibilityAllowsUserType("public", "external")).toBe(
      true
    );
  });

  it("syncs loaded days and clears references when switching plans", async () => {
    const firstPlan = plan("plan_1", 4);
    const selectedPlan = ref<ReadingPlan | null>(firstPlan);
    const loadedDays = ref<ReadingPlanDay[] | undefined>();
    const state = useReadingPlanDayForm(selectedPlan, loadedDays);

    loadedDays.value = [day("plan_1", 1), day("plan_1", 3)];
    await nextTick();
    expect(state.dayForm.dayNumber).toBe(2);

    state.dayForm.bookId = "jhn";
    const secondPlan = plan("plan_2", 7);
    selectedPlan.value = secondPlan;
    state.resetForPlan(secondPlan);
    expect(state.dayForm.bookId).toBe("");
    expect(state.dayForm.dayNumber).toBe(1);
  });
});

function plan(id: string, durationDays: number): ReadingPlan {
  return {
    id,
    title: "Plan",
    description: "",
    status: "draft",
    visibility: "public",
    locale: "en",
    durationDays,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  };
}

function day(planId: string, dayNumber: number): ReadingPlanDay {
  return {
    id: `${planId}_${dayNumber}`,
    planId,
    dayNumber,
    title: "",
    description: "",
    references: [
      {
        bookId: "jhn",
        chapter: 1,
        startVerse: 1,
        endVerse: 1,
        referenceLabel: "John 1:1"
      }
    ],
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  };
}
