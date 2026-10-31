import { useQuery, type QueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { listMembers } from "@/core/api/members";

import {
  createMemberFilterDraft,
  memberFilterSnapshot,
  sameMemberFilters
} from "../member_workspace_models";

type MemberListQueryClient = Pick<QueryClient, "invalidateQueries">;

export function useMemberListQuery(queryClient: MemberListQueryClient) {
  const filters = reactive(createMemberFilterDraft());
  const appliedFilters = ref(memberFilterSnapshot(filters));
  const membersQuery = useQuery({
    queryKey: ["members", appliedFilters],
    queryFn: ({ queryKey }) => listMembers(queryKey[1] as typeof appliedFilters.value)
  });

  const members = computed(() => membersQuery.data.value ?? []);
  const initialError = computed(() =>
    membersQuery.data.value === undefined ? membersQuery.error.value : null
  );
  const refreshError = computed(() =>
    membersQuery.data.value !== undefined ? membersQuery.error.value : null
  );

  function applyFilters() {
    const snapshot = memberFilterSnapshot(filters);
    if (sameMemberFilters(appliedFilters.value, snapshot)) {
      return refreshList();
    }
    appliedFilters.value = snapshot;
  }

  function refreshList() {
    return queryClient.invalidateQueries({
      exact: true,
      queryKey: ["members", appliedFilters.value]
    });
  }

  return {
    filters,
    members,
    membersQuery,
    initialError,
    refreshError,
    applyFilters,
    refreshList
  };
}
