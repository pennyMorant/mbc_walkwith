import type {
  GroupApplication,
  GroupApplicationStatus,
  GroupMembership,
  GroupMembershipStatus,
  LifePostVisibility,
  MinistryGroup,
  MinistryGroupUpsertRequest,
  MinistryGroupStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  createGroup,
  listGroupApplications,
  listGroupMemberships,
  reviewGroupApplication,
  updateGroup,
  updateGroupMembership
} from "@/core/api/groups";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import {
  groupApplicationFilterSnapshot,
  groupEditorPayload,
  sameGroupIntent,
  type GroupApplicationFilterForm
} from "../group_workspace_models";
import { useGroupActivityWorkspace } from "./use_group_activity_workspace";
import { useGroupCatalogQuery } from "./use_group_catalog_query";
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
  const editorCommandErrorMessage = mutationFeedback.messageFor("group-save");
  const applicationsCommandErrorMessage = mutationFeedback.messageFor(
    "application-review"
  );
  const membershipsCommandErrorMessage = mutationFeedback.messageFor(
    "membership-update"
  );
  const materialsCommandErrorMessage =
    mutationFeedback.messageFor("material-command");
  const attendanceCommandErrorMessage =
    mutationFeedback.messageFor("attendance-save");
  const successVisible = computed({
    get: () => successMessage.value.length > 0,
    set: (visible: boolean) => {
      if (!visible) {
        successMessage.value = "";
      }
    }
  });

  const {
    filters,
    groupsQuery,
    groups,
    initialError: groupsError,
    refreshError: groupsRefreshError,
    applyFilters: applyGroupFilters,
    clearFilters: clearGroupFilters,
    refreshList: refreshGroups
  } = useGroupCatalogQuery(queryClient);
  const applicationFilters = reactive<GroupApplicationFilterForm>({
    status: "submitted" as GroupApplicationStatus | "",
    query: ""
  });
  const appliedApplicationFilters = ref(
    groupApplicationFilterSnapshot(applicationFilters)
  );
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
  const applicationsQuery = useQuery({
    queryKey: computed(() => [
      "group-applications",
      selectedGroupId.value,
      { ...appliedApplicationFilters.value, limit: 100 }
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

  function assertManage() {
    if (!canManage.value) {
      throw new Error(t("Group manage access required"));
    }
  }

  async function refreshCanonicalGroup(
    groupId: string,
    fallback?: MinistryGroup
  ) {
    await queryClient.invalidateQueries({ queryKey: ["groups"] });
    if (selectedGroup.value?.id !== groupId) {
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
    onMutate: (intent: GroupSaveIntent) =>
      mutationFeedback.begin("group-save", intent.groupId),
    mutationFn: (intent: GroupSaveIntent) => {
      if (!canManage.value || !intent.payload.name) {
        throw new Error(t("Group manage access required"));
      }
      return intent.groupId
        ? updateGroup(intent.groupId, intent.payload)
        : createGroup(intent.payload);
    },
    onSuccess: async (group, intent, context) => {
      if (context && mutationFeedback.isCurrent(context)) {
        mutationFeedback.succeed(context, t("Group saved."));
        if (sameGroupIntent(groupEditorPayload(form), intent.payload)) {
          editGroup(group, true);
        } else if (intent.groupId) {
          selectedGroup.value = group;
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const reviewMutation = useMutation({
    onMutate: (intent: GroupApplicationReviewIntent) =>
      mutationFeedback.begin("application-review", intent.groupId),
    mutationFn: (intent: GroupApplicationReviewIntent) => {
      assertManage();
      return reviewGroupApplication(intent.groupId, intent.applicationId, {
        status: intent.status
      });
    },
    onSuccess: async (_application, intent, context) => {
      mutationFeedback.succeed(context, t("Application updated."));
      await invalidateGroupQueries("group-applications", "group-memberships");
      await refreshCanonicalGroup(intent.groupId);
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const membershipMutation = useMutation({
    onMutate: (intent: GroupMembershipUpdateIntent) =>
      mutationFeedback.begin("membership-update", intent.groupId),
    mutationFn: (intent: GroupMembershipUpdateIntent) => {
      assertManage();
      return updateGroupMembership(intent.groupId, intent.userId, {
        status: intent.status
      });
    },
    onSuccess: async (_membership, intent, context) => {
      mutationFeedback.succeed(context, t("Membership updated."));
      await invalidateGroupQueries("group-memberships");
      await refreshCanonicalGroup(intent.groupId);
    },
    onError: (error, variables, context) =>
      mutationFeedback.capture(error, variables, context)
  });
  const savePending = computed(() => saveMutation.isPending.value);
  const reviewPending = computed(() => reviewMutation.isPending.value);
  const membershipMutationPending = computed(
    () => membershipMutation.isPending.value
  );
  const listErrorMessage = computed(() =>
    groupsError.value
      ? formatApiErrorMessage(groupsError.value, t("common.error"))
      : ""
  );
  const listRefreshErrorMessage = computed(() =>
    groupsRefreshError.value
      ? formatApiErrorMessage(groupsRefreshError.value, t("common.error"))
      : ""
  );
  const applicationsErrorMessage = queryErrorMessage(applicationsQuery, false);
  const applicationsRefreshErrorMessage = queryErrorMessage(
    applicationsQuery,
    true
  );
  const membershipsErrorMessage = queryErrorMessage(membershipsQuery, false);
  const membershipsRefreshErrorMessage = queryErrorMessage(
    membershipsQuery,
    true
  );
  const materialsErrorMessage = computed(() =>
    formatApiErrorMessage(
      activity.materialsInitialError.value,
      t("common.error")
    )
  );
  const materialsRefreshErrorMessage = computed(() =>
    formatApiErrorMessage(
      activity.materialsRefreshError.value,
      t("common.error")
    )
  );
  const attendanceErrorMessage = computed(() =>
    formatApiErrorMessage(
      activity.attendanceInitialError.value,
      t("common.error")
    )
  );
  const attendanceRefreshErrorMessage = computed(() =>
    formatApiErrorMessage(
      activity.attendanceRefreshError.value,
      t("common.error")
    )
  );

  function queryErrorMessage(
    query: { data: { value: unknown }; error: { value: unknown } },
    forRefresh: boolean
  ) {
    return computed(() => {
      const hasData = query.data.value !== undefined;
      return hasData === forRefresh
        ? formatApiErrorMessage(query.error.value, t("common.error"))
        : "";
    });
  }

  function applyApplicationFilters() {
    appliedApplicationFilters.value =
      groupApplicationFilterSnapshot(applicationFilters);
  }

  function saveGroup() {
    if (!canManage.value || !canSave.value || saveMutation.isPending.value) {
      return;
    }
    saveMutation.mutate({
      groupId: selectedGroup.value?.id ?? null,
      payload: groupEditorPayload(form)
    });
  }

  function reviewApplication(
    applicationId: string,
    status: "approved" | "declined"
  ) {
    const groupId = selectedGroup.value?.id;
    if (!groupId || !canManage.value || reviewMutation.isPending.value) return;
    reviewMutation.mutate({ groupId, applicationId, status });
  }

  function updateMembershipStatus(
    membership: GroupMembership,
    status: GroupMembershipStatus
  ) {
    const groupId = selectedGroup.value?.id;
    if (!groupId || !canManage.value || membershipMutation.isPending.value) {
      return;
    }
    membershipMutation.mutate({ groupId, userId: membership.userId, status });
  }

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
    applyApplicationFilters,
    applyGroupFilters,
    applicationFilters,
    applications,
    applicationsCommandErrorMessage,
    applicationsErrorMessage,
    applicationsQuery,
    applicationsRefreshErrorMessage,
    attendanceCommandErrorMessage,
    attendanceErrorMessage,
    attendanceRefreshErrorMessage,
    canManage,
    canSave,
    clearGroupFilters,
    drawer,
    editorCommandErrorMessage,
    editGroup,
    filters,
    form,
    groups,
    groupsQuery,
    listErrorMessage,
    listRefreshErrorMessage,
    materialsCommandErrorMessage,
    materialsErrorMessage,
    materialsRefreshErrorMessage,
    membershipFilters,
    membershipMutationPending,
    filteredMemberships,
    memberships,
    membershipsCommandErrorMessage,
    membershipsErrorMessage,
    membershipsQuery,
    membershipsRefreshErrorMessage,
    newGroup,
    optionItems,
    reviewPending,
    refreshGroups,
    reviewApplication,
    savePending,
    saveGroup,
    selectedGroup,
    selectGroup,
    successMessage,
    successVisible,
    t,
    updateMembershipStatus
  };
}

type GroupSaveIntent = {
  groupId: string | null;
  payload: MinistryGroupUpsertRequest;
};

type GroupApplicationReviewIntent = {
  groupId: string;
  applicationId: string;
  status: "approved" | "declined";
};

type GroupMembershipUpdateIntent = {
  groupId: string;
  userId: string;
  status: GroupMembershipStatus;
};
