import type { MinistryGroup } from "@mbc/api-contracts";
import { computed, reactive, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";

export type GroupMutationContext = {
  feedbackId: number;
  groupId: string | null;
  scope: GroupMutationScope;
  scopeOperationId: number;
};

export type GroupMutationScope =
  | "group-save"
  | "application-review"
  | "membership-update"
  | "material-command"
  | "attendance-save";

export function useGroupMutationFeedback(
  selectedGroup: Ref<MinistryGroup | null>,
  successMessage: Ref<string>,
  t: (key: string) => string
) {
  const errorMessages = reactive<Record<GroupMutationScope, string>>({
    "group-save": "",
    "application-review": "",
    "membership-update": "",
    "material-command": "",
    "attendance-save": ""
  });
  const scopeOperationIds = new Map<GroupMutationScope, number>();
  let feedbackId = 0;

  function begin(
    scope: GroupMutationScope,
    groupId = selectedGroup.value?.id ?? null
  ): GroupMutationContext {
    const scopeOperationId = (scopeOperationIds.get(scope) ?? 0) + 1;
    scopeOperationIds.set(scope, scopeOperationId);
    feedbackId += 1;
    errorMessages[scope] = "";
    successMessage.value = "";
    return { feedbackId, groupId, scope, scopeOperationId };
  }

  function isCurrent(context?: GroupMutationContext) {
    return (
      context != null &&
      context.scopeOperationId === scopeOperationIds.get(context.scope) &&
      context.groupId === (selectedGroup.value?.id ?? null)
    );
  }

  function ownsFeedback(context?: GroupMutationContext) {
    return isCurrent(context) && context?.feedbackId === feedbackId;
  }

  function succeed(context: GroupMutationContext | undefined, message: string) {
    if (!context || !isCurrent(context)) {
      return false;
    }
    errorMessages[context.scope] = "";
    if (!ownsFeedback(context)) return false;
    successMessage.value = message;
    return true;
  }

  function capture(
    error: unknown,
    _variables: unknown,
    context: GroupMutationContext | undefined
  ) {
    if (context && isCurrent(context)) {
      errorMessages[context.scope] = formatApiErrorMessage(
        error,
        t("common.error")
      );
    }
  }

  function reset() {
    feedbackId += 1;
    for (const scope of Object.keys(errorMessages) as GroupMutationScope[]) {
      scopeOperationIds.set(scope, (scopeOperationIds.get(scope) ?? 0) + 1);
      errorMessages[scope] = "";
    }
    successMessage.value = "";
  }

  function messageFor(...scopes: GroupMutationScope[]) {
    return computed(() => {
      for (const scope of scopes) {
        if (errorMessages[scope]) return errorMessages[scope];
      }
      return "";
    });
  }

  return { begin, capture, isCurrent, messageFor, reset, succeed };
}

export type GroupMutationFeedback = ReturnType<
  typeof useGroupMutationFeedback
>;
