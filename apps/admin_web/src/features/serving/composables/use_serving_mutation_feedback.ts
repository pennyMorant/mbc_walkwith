import { ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";

export type ServingMutationScope =
  | "team-create"
  | "team-update"
  | "role-create"
  | "role-update"
  | "assignment-create"
  | "assignment-update"
  | "availability-create"
  | "check-in";

export type ServingMutationContext = {
  feedbackId: number;
  scopeOperationId: number;
  scope: ServingMutationScope;
};

export function useServingMutationFeedback(
  successMessage: Ref<string>,
  t: (key: string) => string
) {
  const errorMessage = ref("");
  const scopeOperationIds = new Map<ServingMutationScope, number>();
  let feedbackId = 0;

  function begin(scope: ServingMutationScope): ServingMutationContext {
    const scopeOperationId = (scopeOperationIds.get(scope) ?? 0) + 1;
    scopeOperationIds.set(scope, scopeOperationId);
    feedbackId += 1;
    errorMessage.value = "";
    successMessage.value = "";
    return { feedbackId, scope, scopeOperationId };
  }

  function isCurrent(context?: ServingMutationContext) {
    return (
      context !== undefined &&
      scopeOperationIds.get(context.scope) === context.scopeOperationId
    );
  }

  function ownsFeedback(context?: ServingMutationContext) {
    return context !== undefined && context.feedbackId === feedbackId;
  }

  function capture(
    error: unknown,
    _variables: unknown,
    context: ServingMutationContext | undefined
  ) {
    if (ownsFeedback(context)) {
      errorMessage.value = formatApiErrorMessage(error, t("common.error"));
    }
  }

  function succeed(
    context: ServingMutationContext | undefined,
    message: string
  ) {
    if (!ownsFeedback(context)) {
      return false;
    }
    errorMessage.value = "";
    successMessage.value = message;
    return true;
  }

  return { begin, capture, errorMessage, isCurrent, succeed };
}
