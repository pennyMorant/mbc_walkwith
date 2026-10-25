<script setup lang="ts">
import type {
  MemberListItem,
  MemberProfile,
  MemberStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createMember,
  getMember,
  listMembers,
  updateMember,
  type MemberListFilters
} from "@/core/api/members";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import { useAdminResourceDeepLink } from "@/core/navigation/use_admin_resource_deep_link";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import MemberEditorDrawer from "../components/MemberEditorDrawer.vue";
import MemberResults from "../components/MemberResults.vue";
import {
  createMemberEditorForm,
  loadMemberEditorForm,
  memberFilterSnapshot,
  memberPayloadFromForm,
  resetMemberEditorForm,
  type MemberFilterDraft
} from "../member_workspace_models";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const selectedMember = ref<MemberProfile | null>(null);
const drawer = ref(false);
const drawerTitle = ref("");
const isCreating = ref(false);
const detailLoading = ref(false);
const detailError = ref<unknown>(null);
const detailMemberId = ref<string | null>(null);
const commandErrorMessage = ref("");
let detailRequestVersion = 0;
let editorContextVersion = 0;

const filters = reactive<MemberFilterDraft>({
  query: "",
  status: "",
  fellowshipGroupId: ""
});
const appliedFilters = ref<MemberListFilters>(memberFilterSnapshot(filters));

const form = reactive(createMemberEditorForm());

const membersQuery = useQuery({
  queryKey: ["members", appliedFilters],
  queryFn: () => listMembers(appliedFilters.value)
});

const createMutation = useMutation({
  onMutate: () => {
    commandErrorMessage.value = "";
    return { editorContextVersion };
  },
  mutationFn: () => {
    if (!canManage.value || !canSave.value) {
      throw new Error(t("Member manage access required"));
    }
    return createMember(memberPayloadFromForm(form));
  },
  onSuccess: async (member, _variables, context) => {
    if (context?.editorContextVersion === editorContextVersion) {
      applyMember(member);
    }
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  },
  onError: (error, _variables, context) => {
    captureCommandError(error, context?.editorContextVersion);
  }
});

const updateMutation = useMutation({
  onMutate: () => {
    commandErrorMessage.value = "";
    return { editorContextVersion };
  },
  mutationFn: () => {
    const member = requireSelected(
      selectedMember.value,
      t("No member selected.")
    );
    if (!canManage.value || !canSave.value) {
      throw new Error(t("Member manage access required"));
    }
    return updateMember(member.id, memberPayloadFromForm(form));
  },
  onSuccess: async (member, _variables, context) => {
    if (context?.editorContextVersion === editorContextVersion) {
      applyMember(member);
    }
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  },
  onError: (error, _variables, context) => {
    captureCommandError(error, context?.editorContextVersion);
  }
});

const members = computed(() => membersQuery.data.value ?? []);
const canManage = computed(() => authStore.can("users:manage"));
const canSave = computed(
  () =>
    form.email.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    form.roles.length > 0
);
const detailErrorMessage = computed(() =>
  detailError.value
    ? formatApiErrorMessage(detailError.value, t("common.error"))
    : ""
);
const saving = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value
);

const deepLink = useAdminResourceDeepLink(getMember, (member) => {
  beginEditorContext();
  applyMember(member);
});

async function openMember(member: MemberListItem) {
  detailMemberId.value = member.id;
  await loadMemberDetail(member.id, member.displayName);
}

async function retryMemberDetail() {
  if (detailMemberId.value) {
    await loadMemberDetail(detailMemberId.value, drawerTitle.value);
  }
}

async function loadMemberDetail(memberId: string, title: string) {
  const requestVersion = ++detailRequestVersion;
  selectedMember.value = null;
  isCreating.value = false;
  drawerTitle.value = title;
  detailError.value = null;
  detailLoading.value = true;
  beginEditorContext();
  resetMemberEditorForm(form);
  drawer.value = true;
  try {
    const member = await getMember(memberId);
    if (requestVersion === detailRequestVersion) {
      applyMember(member);
    }
  } catch (error) {
    if (requestVersion === detailRequestVersion) {
      detailError.value = error;
    }
  } finally {
    if (requestVersion === detailRequestVersion) {
      detailLoading.value = false;
    }
  }
}

function applyMember(member: MemberProfile) {
  selectedMember.value = member;
  isCreating.value = false;
  detailMemberId.value = member.id;
  drawerTitle.value = member.displayName;
  detailError.value = null;
  loadMemberEditorForm(form, member);
  drawer.value = true;
}

function newMember() {
  selectedMember.value = null;
  isCreating.value = true;
  detailMemberId.value = null;
  drawerTitle.value = t("New member");
  detailError.value = null;
  detailLoading.value = false;
  beginEditorContext();
  resetMemberEditorForm(form);
  drawer.value = true;
}

function beginEditorContext() {
  editorContextVersion += 1;
  commandErrorMessage.value = "";
  createMutation.reset();
  updateMutation.reset();
}

function captureCommandError(error: unknown, contextVersion?: number) {
  if (contextVersion === editorContextVersion) {
    commandErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
  }
}

function applyFilters() {
  const nextFilters = memberFilterSnapshot(filters);
  if (JSON.stringify(nextFilters) === JSON.stringify(appliedFilters.value)) {
    void membersQuery.refetch();
    return;
  }
  appliedFilters.value = nextFilters;
}

function saveMember() {
  if (
    !canManage.value ||
    !canSave.value ||
    createMutation.isPending.value ||
    updateMutation.isPending.value
  ) {
    return;
  }
  if (selectedMember.value) {
    updateMutation.mutate();
    return;
  }
  if (isCreating.value) {
    createMutation.mutate();
  }
}

function statusColor(status: MemberStatus) {
  if (status === "active") {
    return "success";
  }
  if (status === "inactive") {
    return "secondary";
  }
  return "error";
}

watch(drawer, (open) => {
  if (!open) {
    detailRequestVersion += 1;
    editorContextVersion += 1;
    commandErrorMessage.value = "";
  }
});
</script>

<template>
  <div>
    <v-progress-linear v-if="deepLink.pending.value" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="deepLink.error.value" type="error" variant="tonal" class="mb-4">
      {{ t("nav.openResourceFailed") }}
    </v-alert>
    <AdminPageHeader :title="t('nav.members')" :subtitle="t('members.pageSubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="membersQuery.isFetching.value"
          @click="membersQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn v-if="canManage" color="primary" prepend-icon="mdi-plus" @click="newMember">
          {{ t("New member") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-card class="mt-6">
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(['', 'active', 'pending', 'inactive', 'blocked'])"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.fellowshipGroupId"
              :label="t('Group')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block variant="tonal" @click="applyFilters">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <MemberResults
        :members="members"
        :pending="membersQuery.isPending.value"
        :error-message="membersQuery.error.value ? formatApiErrorMessage(membersQuery.error.value, t('common.error')) : ''"
        :status-color="statusColor"
        @open="openMember"
        @retry="membersQuery.refetch()"
      />
    </v-card>

    <MemberEditorDrawer
      v-model="drawer"
      :title="drawerTitle"
      :member="selectedMember"
      :creating="isCreating"
      :form="form"
      :detail-loading="detailLoading"
      :detail-error-message="detailErrorMessage"
      :command-error-message="commandErrorMessage"
      :can-manage="canManage"
      :can-save="canSave"
      :saving="saving"
      @retry="retryMemberDetail"
      @save="saveMember"
    />
  </div>
</template>
