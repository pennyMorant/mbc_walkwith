import type { DiscipleshipJourney } from "@mbc/api-contracts";
import { ref, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

export function useDiscipleshipMutationError(
  selectedJourney: Ref<DiscipleshipJourney | null>
) {
  const { t } = useI18n();
  const message = ref("");

  function clear() {
    message.value = "";
  }

  function begin() {
    clear();
    return { journeyId: selectedJourney.value?.id ?? null };
  }

  function isCurrent(journeyId: string | null) {
    return journeyId === (selectedJourney.value?.id ?? null);
  }

  function capture(
    error: unknown,
    _variables: unknown,
    context: { journeyId: string | null } | undefined
  ) {
    if (isCurrent(context?.journeyId ?? null)) {
      message.value = formatApiErrorMessage(error, t("common.error"));
    }
  }

  return { begin, capture, clear, isCurrent, message };
}
