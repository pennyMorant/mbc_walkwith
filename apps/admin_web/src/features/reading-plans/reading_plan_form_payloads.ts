import type {
  ReadingPlanAssignmentCreateRequest,
  ReadingPlanCreateRequest,
  ReadingPlanDayUpsertRequest,
  ReadingPlanUpdateRequest
} from "@mbc/api-contracts";

export type ReadingPlanDayForm = {
  dayNumber: number;
  title: string;
  description: string;
  bookId: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  referenceLabel: string;
};

export function readingPlanCreatePayload(
  form: ReadingPlanCreateRequest
): ReadingPlanCreateRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    visibility: form.visibility,
    locale: form.locale,
    durationDays: positiveInteger(form.durationDays)
  };
}

export function readingPlanUpdatePayload(
  form: ReadingPlanCreateRequest
): ReadingPlanUpdateRequest {
  return readingPlanCreatePayload(form);
}

export function readingPlanDayPayload(
  form: ReadingPlanDayForm
): ReadingPlanDayUpsertRequest {
  return {
    dayNumber: positiveInteger(form.dayNumber),
    title: form.title.trim(),
    description: form.description.trim(),
    references: [
      {
        bookId: form.bookId.trim(),
        chapter: positiveInteger(form.chapter),
        startVerse: positiveInteger(form.startVerse),
        endVerse: positiveInteger(form.endVerse),
        referenceLabel: form.referenceLabel.trim()
      }
    ]
  };
}

export function readingPlanAssignmentPayload(
  planId: string,
  form: ReadingPlanAssignmentCreateRequest
): ReadingPlanAssignmentCreateRequest {
  return {
    planId,
    userType: form.userType,
    userId: form.userId.trim(),
    sourceType: form.sourceType,
    sourceId: form.sourceId?.trim() || null
  };
}

function positiveInteger(value: number) {
  return Math.max(1, Math.floor(Number(value) || 1));
}
