import type { Course } from "@mbc/api-contracts";
import { ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";

export type CourseMutationContext = {
  courseId: string | null;
  generation: number;
  operationId: number;
  scope: CourseMutationScope;
};

export type CourseMutationScope =
  | "course"
  | "lesson-create"
  | "lesson-status"
  | "enrollment";

export function useCourseMutationFeedback(
  selectedCourse: Ref<Course | null>,
  t: (key: string) => string
) {
  const errorMessage = ref("");
  const operationIds = new Map<CourseMutationScope, number>();
  let generation = 0;

  function begin(scope: CourseMutationScope): CourseMutationContext {
    errorMessage.value = "";
    const operationId = (operationIds.get(scope) ?? 0) + 1;
    operationIds.set(scope, operationId);
    return {
      courseId: selectedCourse.value?.id ?? null,
      generation,
      operationId,
      scope
    };
  }

  function isCurrent(context?: CourseMutationContext) {
    return (
      context?.generation === generation &&
      context.operationId === operationIds.get(context.scope) &&
      context.courseId === (selectedCourse.value?.id ?? null)
    );
  }

  function capture(
    error: unknown,
    _variables: unknown,
    context: CourseMutationContext | undefined
  ) {
    if (isCurrent(context)) {
      errorMessage.value = formatApiErrorMessage(error, t("common.error"));
    }
  }

  function reset() {
    generation += 1;
    errorMessage.value = "";
  }

  return { begin, capture, errorMessage, isCurrent, reset };
}
