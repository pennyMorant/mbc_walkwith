import { computed, reactive, type Ref } from "vue";

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
  const errorMessages = reactive<Record<ServingMutationScope, string>>({
    "team-create": "",
    "team-update": "",
    "role-create": "",
    "role-update": "",
    "assignment-create": "",
    "assignment-update": "",
    "availability-create": "",
    "check-in": ""
  });
  const scopeOperationIds = new Map<ServingMutationScope, number>();
  let feedbackId = 0;

  function begin(scope: ServingMutationScope): ServingMutationContext {
    const scopeOperationId = (scopeOperationIds.get(scope) ?? 0) + 1;
    scopeOperationIds.set(scope, scopeOperationId);
    feedbackId += 1;
    errorMessages[scope] = "";
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
    if (context && isCurrent(context)) {
      errorMessages[context.scope] = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }

  function succeed(
    context: ServingMutationContext | undefined,
    message: string
  ) {
    if (!context || !isCurrent(context)) {
      return false;
    }
    errorMessages[context.scope] = "";
    if (!ownsFeedback(context)) {
      return false;
    }
    successMessage.value = message;
    return true;
  }

  function messageFor(...scopes: ServingMutationScope[]) {
    return computed(() => {
      for (const scope of scopes) {
        if (errorMessages[scope]) return errorMessages[scope];
      }
      return "";
    });
  }

  return { begin, capture, isCurrent, messageFor, succeed };
}
