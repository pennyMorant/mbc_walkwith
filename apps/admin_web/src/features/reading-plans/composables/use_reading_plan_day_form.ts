import type { ReadingPlan, ReadingPlanDay } from "@mbc/api-contracts";
import { reactive, watch, type Ref } from "vue";

import type { ReadingPlanDayForm } from "../reading_plan_form_payloads";
import { nextReadingPlanDayNumber } from "../reading_plan_ui_rules";

export function useReadingPlanDayForm(
  selectedPlan: Ref<ReadingPlan | null>,
  loadedDays: Ref<ReadingPlanDay[] | undefined>
) {
  const dayForm = reactive<ReadingPlanDayForm>(initialDayForm());

  watch(loadedDays, (days) => syncNextDay(selectedPlan.value, days));

  function resetForPlan(plan: ReadingPlan) {
    Object.assign(dayForm, initialDayForm());
    syncNextDay(plan, loadedDays.value);
  }

  function resetForNewPlan() {
    Object.assign(dayForm, initialDayForm());
  }

  function clearTextAfterSave() {
    dayForm.title = "";
    dayForm.description = "";
    dayForm.referenceLabel = "";
  }

  function syncNextDay(
    plan: ReadingPlan | null,
    days: ReadingPlanDay[] | undefined
  ) {
    if (!plan || !days || days.some((day) => day.planId !== plan.id)) {
      return;
    }
    dayForm.dayNumber = nextReadingPlanDayNumber(days, plan.durationDays);
  }

  return {
    clearTextAfterSave,
    dayForm,
    resetForNewPlan,
    resetForPlan
  };
}

function initialDayForm(): ReadingPlanDayForm {
  return {
    dayNumber: 1,
    title: "",
    description: "",
    bookId: "",
    chapter: 1,
    startVerse: 1,
    endVerse: 1,
    referenceLabel: ""
  };
}
