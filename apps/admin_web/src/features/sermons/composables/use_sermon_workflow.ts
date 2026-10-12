import type { Sermon } from "@mbc/api-contracts";
import { ref, type Ref } from "vue";

import { getAdminSermon } from "@/core/api/sermons";

type UseSermonWorkflowInput = {
  selectedSermon: Ref<Sermon | null>;
  activeDetailTab: Ref<string>;
  applySermonToDetail: (sermon: Sermon) => void;
};

export function useSermonWorkflow(input: UseSermonWorkflowInput) {
  const { selectedSermon, activeDetailTab, applySermonToDetail } = input;
  const sermonWorkflowRefreshing = ref(false);

  async function refreshSelectedSermonWorkflow() {
    const sermonId = selectedSermon.value?.id;
    if (!sermonId || sermonWorkflowRefreshing.value) {
      return;
    }
    sermonWorkflowRefreshing.value = true;
    try {
      const sermon = await getAdminSermon(sermonId);
      if (selectedSermon.value?.id === sermonId) {
        const currentTab = activeDetailTab.value;
        applySermonToDetail(sermon);
        activeDetailTab.value = currentTab;
      }
    } finally {
      sermonWorkflowRefreshing.value = false;
    }
  }

  return {
    sermonWorkflowRefreshing,
    refreshSelectedSermonWorkflow
  };
}
