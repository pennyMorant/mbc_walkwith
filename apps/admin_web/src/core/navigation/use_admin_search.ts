import type { AdminSearchResult } from "@mbc/api-contracts";
import { useQuery } from "@tanstack/vue-query";
import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";

import { searchAdmin } from "@/core/api/admin_search";

import type { AdminNavigationItem } from "./admin_navigation";

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

  watch(searchText, (value) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      debouncedSearchText.value = value.trim();
    }, 250);
  });

  onBeforeUnmount(() => {
    if (searchTimer) clearTimeout(searchTimer);
  });

  const query = useQuery({
    queryKey: computed(() => ["admin-search", debouncedSearchText.value]),
    queryFn: () => searchAdmin(debouncedSearchText.value),
    enabled: computed(() => debouncedSearchText.value.length >= 2),
    staleTime: 30_000
  });

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
    const resourceOptions = (query.data.value?.items ?? []).map((item) => ({
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
    selectedOption.value = null;
    searchText.value = "";
  }

  return {
    clear,
    isFetching: query.isFetching,
    options,
    searchText,
    selectedOption
  };
}
