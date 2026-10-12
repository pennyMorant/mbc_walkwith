import type { PublicLandingResponse, SupportedLocale } from "@mbc/api-contracts";
import type { Ref } from "vue";
import { ref, watch } from "vue";

import { getPublicLanding } from "@/core/api/client";

export function useLandingContent(locale: Ref<SupportedLocale>) {
  const content = ref<PublicLandingResponse | null>(null);
  const hasError = ref(false);
  const isLoading = ref(false);
  let requestVersion = 0;

  watch(locale, async (nextLocale) => {
    const currentRequest = ++requestVersion;
    isLoading.value = true;
    try {
      const nextContent = await getPublicLanding(nextLocale);
      if (currentRequest !== requestVersion) {
        return;
      }
      content.value = nextContent;
      hasError.value = false;
    } catch {
      if (currentRequest === requestVersion) {
        hasError.value = true;
      }
    } finally {
      if (currentRequest === requestVersion) {
        isLoading.value = false;
      }
    }
  }, { immediate: true });

  return {
    content,
    hasError,
    isLoading,
  };
}
