import type { Sermon } from "@mbc/api-contracts";
import { computed, type Ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { sermonMutationTargetsSelection } from "../sermon_mutation_models";

type MutationFeedbackSource = {
  error: { value: unknown };
  variables: { value: unknown };
};

export function useSelectedSermonErrorMessage(
  selectedSermon: Ref<Sermon | null>,
  mutations: MutationFeedbackSource[],
  fallbackMessage: string
) {
  return computed(() => {
    const error = mutations.find(
      (mutation) =>
        mutation.error.value &&
        sermonMutationTargetsSelection(
          selectedSermon.value,
          mutation.variables.value
        )
    )?.error.value;

    return formatApiErrorMessage(error ?? null, fallbackMessage);
  });
}
