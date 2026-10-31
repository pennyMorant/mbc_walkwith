<script setup lang="ts">
import type {
  MemberCreateRequest,
  MemberListItem,
  MemberProfile,
  MemberStatus,
  MemberUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref, watch } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { createMember, getMember, updateMember } from "@/core/api/members";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";
import { useAdminResourceDeepLink } from "@/core/navigation/use_admin_resource_deep_link";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import MemberEditorDrawer from "../components/MemberEditorDrawer.vue";
import MemberResults from "../components/MemberResults.vue";
import { useMemberListQuery } from "../composables/use_member_list_query";
import {
  createMemberEditorForm,
  isValidOptionalYear,
  loadMemberEditorForm,
  memberPayloadFromForm,
  resetMemberEditorForm
} from "../member_workspace_models";

type MemberSaveIntent = {
  contextVersion: number;
  memberId: string | null;
  payload: MemberCreateRequest & MemberUpdateRequest;
};

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

const form = reactive(createMemberEditorForm());
const {
  filters,
  members,
  membersQuery,
  initialError,
  refreshError,
  applyFilters,
  refreshList
} = useMemberListQuery(queryClient);

const saveMutation = useMutation({
  mutationFn: (intent: MemberSaveIntent) =>
    intent.memberId
      ? updateMember(intent.memberId, intent.payload)
      : createMember(intent.payload),
  onMutate: (intent) => {
    if (intent.contextVersion === editorContextVersion) {
      commandErrorMessage.value = "";
    }
  },
  onSuccess: async (member, intent) => {
    if (intent.contextVersion === editorContextVersion) {
      applyMember(member);
    }
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  },
  onError: (error, intent) => {
    captureCommandError(error, intent.contextVersion);
  }
});

const canManage = computed(() => authStore.can("users:manage"));
const canSave = computed(
  () =>
    form.email.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    form.roles.length > 0 &&
    isValidOptionalYear(form.faithStartYear) &&
    isValidOptionalYear(form.baptizedYear)
);
const listErrorMessage = computed(() =>
  initialError.value
    ? formatApiErrorMessage(initialError.value, t("common.error"))
    : ""
);
const refreshErrorMessage = computed(() =>
  refreshError.value
    ? formatApiErrorMessage(refreshError.value, t("members.refreshFailed"))
    : ""
);
const detailErrorMessage = computed(() =>
  detailError.value
    ? formatApiErrorMessage(detailError.value, t("common.error"))
    : ""
);
const saving = computed(() => saveMutation.isPending.value);

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
  saveMutation.reset();
}

function captureCommandError(error: unknown, contextVersion?: number) {
  if (contextVersion === editorContextVersion) {
    commandErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
  }
}

function saveMember() {
  if (
    !canManage.value ||
    !canSave.value ||
    saveMutation.isPending.value
  ) {
    return;
  }
  if (!selectedMember.value && !isCreating.value) {
    return;
  }
  saveMutation.mutate({
    contextVersion: editorContextVersion,
    memberId: selectedMember.value?.id ?? null,
    payload: memberPayloadFromForm(form)
  });
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
          @click="refreshList"
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
        :error-message="listErrorMessage"
        :refresh-error-message="refreshErrorMessage"
        :status-color="statusColor"
        @open="openMember"
        @retry="refreshList"
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
