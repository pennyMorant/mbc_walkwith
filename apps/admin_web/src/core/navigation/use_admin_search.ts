import type { AdminSearchResult } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";

import { searchAdmin } from "@/core/api/admin_search";

import type { AdminNavigationItem } from "./admin_navigation";
import {
  ADMIN_SEARCH_MIN_LENGTH,
  isCurrentAdminSearchSnapshot,
  normalizeAdminSearchText
} from "./admin_search_state";

export type AdminSearchOption = {
  title: string;
  path: string;
  value: string;
  props: { prependIcon: string; subtitle?: string };
};

type Translate = (key: string) => string;

const resourceIcons: Record<AdminSearchResult["resourceType"], string> = {
  sermon: "mdi-microphone-outline",
  life_post: "mdi-newspaper-variant-outline",
  member: "mdi-account-outline"
};

export function useAdminSearch(
  visibleItems: Ref<AdminNavigationItem[]>,
  translate: Translate
) {
  const selectedOption = ref<AdminSearchOption | null>(null);
  const searchText = ref("");
  const debouncedSearchText = ref("");
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelPendingSearch() {
    if (!searchTimer) return;
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  watch(searchText, (value) => {
    cancelPendingSearch();
    const normalizedValue = normalizeAdminSearchText(value);
    if (normalizedValue.length < ADMIN_SEARCH_MIN_LENGTH) {
      debouncedSearchText.value = normalizedValue;
      return;
    }
    searchTimer = setTimeout(() => {
      debouncedSearchText.value = normalizedValue;
      searchTimer = null;
    }, 250);
  });

  onBeforeUnmount(cancelPendingSearch);

  const query = useQuery({
    queryKey: computed(
      () => ["admin-search", debouncedSearchText.value] as const
    ),
    queryFn: ({ queryKey }) => searchAdmin(queryKey[1]),
    enabled: computed(
      () => debouncedSearchText.value.length >= ADMIN_SEARCH_MIN_LENGTH
    ),
    staleTime: 30_000
  });
  const currentSnapshot = computed(() =>
    isCurrentAdminSearchSnapshot(
      searchText.value,
      debouncedSearchText.value
    )
  );

  const options = computed<AdminSearchOption[]>(() => {
    const normalizedSearch = searchText.value.trim().toLocaleLowerCase();
    const navigationOptions = visibleItems.value
      .filter((item) =>
        translate(item.titleKey).toLocaleLowerCase().includes(normalizedSearch)
      )
      .map((item) => ({
        title: translate(item.titleKey),
        path: item.value,
        value: `navigation:${item.value}`,
        props: { prependIcon: item.icon }
      }));
    const resourceItems = currentSnapshot.value
      ? query.data.value?.items ?? []
      : [];
    const resourceOptions = resourceItems.map((item) => ({
      title: item.title,
      path: item.path,
      value: `${item.resourceType}:${item.id}`,
      props: {
        prependIcon: resourceIcons[item.resourceType],
        subtitle:
          item.resourceType === "life_post" && item.subtitle
            ? translate(item.subtitle)
            : item.subtitle ?? translate(`dashboard.resource.${item.resourceType}`)
      }
    }));

    return [...navigationOptions, ...resourceOptions];
  });

  function clear() {
    cancelPendingSearch();
    selectedOption.value = null;
    searchText.value = "";
    debouncedSearchText.value = "";
  }

  return {
    clear,
    error: computed(() => (currentSnapshot.value ? query.error.value : null)),
    isFetching: computed(
      () => currentSnapshot.value && query.isFetching.value
    ),
    options,
    searchText,
    selectedOption
  };
}
