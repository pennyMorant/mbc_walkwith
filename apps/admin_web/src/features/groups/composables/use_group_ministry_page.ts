import type {
  GroupApplication,
  GroupApplicationStatus,
  GroupMembership,
  GroupMembershipStatus,
  LifePostVisibility,
  MinistryGroup,
  MinistryGroupStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createGroup,
  listGroupApplications,
  listGroupMemberships,
  listGroups,
  reviewGroupApplication,
  updateGroup,
  updateGroupMembership
} from "@/core/api/groups";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import type { GroupEditorForm } from "../group_workspace_models";
import { useGroupActivityWorkspace } from "./use_group_activity_workspace";
import { useGroupMutationFeedback } from "./use_group_mutation_feedback";

export function useGroupMinistryPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { optionItems, t } = useI18n();
  const selectedGroup = ref<MinistryGroup | null>(null);
  const drawer = ref(false);
  const successMessage = ref("");
  const mutationFeedback = useGroupMutationFeedback(
    selectedGroup,
    successMessage,
    t
  );
  const successVisible = computed({
    get: () => successMessage.value.length > 0,
    set: (visible: boolean) => {
      if (!visible) {
        successMessage.value = "";
      }
    }
  });

  const filters = reactive({
    query: "",
    status: "" as MinistryGroupStatus | "",
    visibility: "" as LifePostVisibility | ""
  });
  const applicationFilters = reactive({
    status: "submitted" as GroupApplicationStatus | "",
    query: ""
  });
  const membershipFilters = reactive({
    status: "" as GroupMembershipStatus | "",
    query: ""
  });

  const form = reactive({
    name: "",
    description: "",
    meetingTime: "",
    location: "",
    leaderName: "",
    visibility: "members" as LifePostVisibility,
    status: "draft" as MinistryGroupStatus,
    capacity: null as number | null
  });
  const selectedGroupId = computed(() => selectedGroup.value?.id ?? null);
  const activeFilters = computed(() => ({ ...filters, limit: 50 }));
  const groupsQuery = useQuery({
    queryKey: ["groups", activeFilters],
    queryFn: () => listGroups(activeFilters.value)
  });
  const applicationsQuery = useQuery({
    queryKey: computed(() => [
      "group-applications",
      selectedGroupId.value,
      { ...applicationFilters, limit: 100 }
    ]),
    enabled: computed(() => Boolean(selectedGroupId.value)),
    queryFn: ({ queryKey }) => {
      const groupId = queryKey[1] as string | null;
      const query = queryKey[2] as typeof applicationFilters & { limit: number };
      return groupId
        ? listGroupApplications(groupId, query)
        : Promise.resolve([] as GroupApplication[]);
    }
  });
  const membershipsQuery = useQuery({
    queryKey: computed(() => ["group-memberships", selectedGroupId.value]),
    enabled: computed(() => Boolean(selectedGroupId.value)),
    queryFn: ({ queryKey }) => {
      const groupId = queryKey[1] as string | null;
      return groupId
        ? listGroupMemberships(groupId, { limit: 500 })
        : Promise.resolve([] as GroupMembership[]);
    }
  });
  const canManage = computed(() => authStore.can("groups:manage"));
  const canSave = computed(() => form.name.trim().length > 0);
  const groups = computed(() => groupsQuery.data.value ?? []);
  const applications = computed(() => applicationsQuery.data.value ?? []);
  const memberships = computed(() => membershipsQuery.data.value ?? []);
  const filteredMemberships = computed(() => {
    const query = membershipFilters.query.trim().toLowerCase();
    return memberships.value.filter((membership) => {
      if (
        membershipFilters.status &&
        membership.status !== membershipFilters.status
      ) {
        return false;
      }
      return query.length === 0
        ? true
        : [
            membership.memberDisplayName,
            membership.memberEmail ?? "",
            membership.userId
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
    });
  });
  const activity = useGroupActivityWorkspace({
    selectedGroup,
    memberships,
    canManage,
    feedback: mutationFeedback,
    t
  });

  function selectedOrThrow() {
    if (!canManage.value) {
      throw new Error(t("Group manage access required"));
    }
    return requireSelected(selectedGroup.value, t("No group selected."));
  }

  async function refreshCanonicalGroup(fallback?: MinistryGroup) {
    const groupId = fallback?.id ?? selectedGroup.value?.id;
    await queryClient.invalidateQueries({ queryKey: ["groups"] });
    if (!groupId) {
      return;
    }
    selectedGroup.value =
      groupsQuery.data.value?.find((group) => group.id === groupId) ??
      fallback ??
      selectedGroup.value;
  }

  async function invalidateGroupQueries(...keys: string[]) {
    await Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    );
  }

  const saveMutation = useMutation({
    onMutate: () => mutationFeedback.begin(),
    mutationFn: () => {
      if (!canManage.value || !canSave.value) {
        throw new Error(t("Group manage access required"));
      }
      const payload = buildGroupPayload(form);
      return selectedGroup.value
        ? updateGroup(selectedGroup.value.id, payload)
        : createGroup(payload);
    },
    onSuccess: async (group, _variables, context) => {
      if (context && mutationFeedback.isCurrent(context)) {
        editGroup(group, true);
        mutationFeedback.succeed(
          { ...context, groupId: group.id },
          t("Group saved.")
        );
        await refreshCanonicalGroup(group);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const reviewMutation = useMutation({
    onMutate: () => mutationFeedback.begin(),
    mutationFn: (input: {
      applicationId: string;
      status: "approved" | "declined";
    }) => {
      const group = selectedOrThrow();
      return reviewGroupApplication(group.id, input.applicationId, {
        status: input.status
      });
    },
    onSuccess: async (_application, _variables, context) => {
      mutationFeedback.succeed(context, t("Application updated."));
      await invalidateGroupQueries("group-applications", "group-memberships");
      await refreshCanonicalGroup();
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const membershipMutation = useMutation({
    onMutate: () => mutationFeedback.begin(),
    mutationFn: (input: {
      membership: GroupMembership;
      status: GroupMembershipStatus;
    }) => {
      const group = selectedOrThrow();
      return updateGroupMembership(group.id, input.membership.userId, {
        status: input.status
      });
    },
    onSuccess: async (_membership, _variables, context) => {
      mutationFeedback.succeed(context, t("Membership updated."));
      await invalidateGroupQueries("group-memberships");
      await refreshCanonicalGroup();
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const queryErrorMessage = computed(() =>
    formatApiErrorMessage(
      groupsQuery.error.value ||
        applicationsQuery.error.value ||
        membershipsQuery.error.value ||
        activity.error.value,
      t("common.error")
    )
  );
  const errorMessage = computed(
    () => queryErrorMessage.value || mutationFeedback.errorMessage.value
  );

  function selectGroup(group: MinistryGroup, preserveFeedback = false) {
    if (selectedGroup.value?.id !== group.id) {
      activity.resetForGroupChange();
      if (!preserveFeedback) {
        mutationFeedback.reset();
      }
    }
    selectedGroup.value = group;
  }

  function editGroup(group: MinistryGroup, preserveFeedback = false) {
    selectGroup(group, preserveFeedback);
    form.name = group.name;
    form.description = group.description;
    form.meetingTime = group.meetingTime;
    form.location = group.location;
    form.leaderName = group.leaderName;
    form.visibility = group.visibility;
    form.status = group.status;
    form.capacity = group.capacity;
    drawer.value = true;
  }

  function newGroup() {
    activity.resetForGroupChange();
    mutationFeedback.reset();
    selectedGroup.value = null;
    form.name = "";
    form.description = "";
    form.meetingTime = "";
    form.location = "";
    form.leaderName = "";
    form.visibility = "members";
    form.status = "draft";
    form.capacity = null;
    drawer.value = true;
  }

  return {
    ...activity,
    applicationFilters,
    applications,
    applicationsQuery,
    canManage,
    canSave,
    drawer,
    editGroup,
    errorMessage,
    filters,
    form,
    groups,
    groupsQuery,
    membershipFilters,
    membershipMutation,
    filteredMemberships,
    memberships,
    membershipsQuery,
    newGroup,
    optionItems,
    reviewMutation,
    saveMutation,
    selectedGroup,
    selectGroup,
    successMessage,
    successVisible,
    t
  };
}

function buildGroupPayload(form: GroupEditorForm) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    meetingTime: form.meetingTime.trim(),
    location: form.location.trim(),
    leaderName: form.leaderName.trim(),
    visibility: form.visibility,
    status: form.status,
    capacity: normalizeCapacity(form.capacity)
  };
}

function normalizeCapacity(value: number | null | undefined) {
  if (value == null) {
    return null;
  }
  const capacity = Math.floor(Number(value));
  return Number.isFinite(capacity) && capacity > 0 ? capacity : null;
}
