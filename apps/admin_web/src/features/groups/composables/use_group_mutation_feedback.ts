import type { MinistryGroup } from "@mbc/api-contracts";
import { ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";

export type GroupMutationContext = {
  groupId: string | null;
  operationId: number;
};

export function useGroupMutationFeedback(
  selectedGroup: Ref<MinistryGroup | null>,
  successMessage: Ref<string>,
  t: (key: string) => string
) {
  const errorMessage = ref("");
  let operationId = 0;

  function begin(): GroupMutationContext {
    errorMessage.value = "";
    successMessage.value = "";
    operationId += 1;
    return { groupId: selectedGroup.value?.id ?? null, operationId };
  }

  function isCurrent(context?: GroupMutationContext) {
    return (
      context?.operationId === operationId &&
      context.groupId === (selectedGroup.value?.id ?? null)
    );
  }

  function succeed(context: GroupMutationContext | undefined, message: string) {
    if (!isCurrent(context)) {
      return false;
    }
    errorMessage.value = "";
    successMessage.value = message;
    return true;
  }

  function capture(
    error: unknown,
    _variables: unknown,
    context: GroupMutationContext | undefined
  ) {
    if (isCurrent(context)) {
      errorMessage.value = formatApiErrorMessage(error, t("common.error"));
    }
  }

  function reset() {
    operationId += 1;
    errorMessage.value = "";
    successMessage.value = "";
  }

  return { begin, capture, errorMessage, isCurrent, reset, succeed };
}

export type GroupMutationFeedback = ReturnType<
  typeof useGroupMutationFeedback
>;
