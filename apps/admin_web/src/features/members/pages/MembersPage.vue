<script setup lang="ts">
import type {
  MemberCreateRequest,
  MemberListItem,
  MemberProfile,
  MemberRole,
  MemberStatus,
  MemberUpdateRequest
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { requireSelected } from "@/core/actions/action_guard";
import {
  createMember,
  getMember,
  listMembers,
  updateMember
} from "@/core/api/members";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const selectedMember = ref<MemberProfile | null>(null);
const drawer = ref(false);
const drawerTitle = ref("");
const isCreating = ref(false);
const detailLoading = ref(false);
const detailError = ref<unknown>(null);

const filters = reactive({
  query: "",
  status: "" as MemberStatus | "",
  fellowshipGroupId: ""
});

const form = reactive({
  email: "",
  displayName: "",
  phone: "",
  status: "active" as MemberStatus,
  roles: ["member"] as MemberRole[],
  appLocale: "en" as "en" | "es" | "zh-Hans" | "zh-Hant",
  fellowshipGroupId: "",
  weeklyBulletin: true,
  sermonPublished: true,
  lifePostPublished: true,
  prayerUpdates: false
});

const activeFilters = computed(() => ({ ...filters, limit: 50 }));
const membersQuery = useQuery({
  queryKey: ["members", activeFilters],
  queryFn: () => listMembers(activeFilters.value)
});

const createMutation = useMutation({
  mutationFn: () => {
    if (!canManage.value || !canSave.value) {
      throw new Error(t("Member manage access required"));
    }
    return createMember(buildMemberPayload());
  },
  onSuccess: async (member) => {
    applyMember(member);
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  }
});

const updateMutation = useMutation({
  mutationFn: () => {
    const member = requireSelected(
      selectedMember.value,
      t("No member selected.")
    );
    if (!canManage.value || !canSave.value) {
      throw new Error(t("Member manage access required"));
    }
    return updateMember(member.id, buildMemberPayload());
  },
  onSuccess: async (member) => {
    applyMember(member);
    await queryClient.invalidateQueries({ queryKey: ["members"] });
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
const errorMessage = computed(
  () =>
    formatApiErrorMessage(
      createMutation.error.value ||
        updateMutation.error.value ||
        detailError.value,
      t("common.error")
    )
);

async function openMember(member: MemberListItem) {
  selectedMember.value = null;
  isCreating.value = false;
  drawerTitle.value = member.displayName;
  detailError.value = null;
  detailLoading.value = true;
  resetForm();
  drawer.value = true;
  try {
    applyMember(await getMember(member.id));
  } catch (error) {
    detailError.value = error;
  } finally {
    detailLoading.value = false;
  }
}

function applyMember(member: MemberProfile) {
  selectedMember.value = member;
  isCreating.value = false;
  drawerTitle.value = member.displayName;
  detailError.value = null;
  form.email = member.email;
  form.displayName = member.displayName;
  form.phone = member.phone ?? "";
  form.status = member.status;
  form.roles = member.roles.length > 0 ? [...member.roles] : ["member"];
  form.appLocale = member.appLocale;
  form.fellowshipGroupId = member.fellowshipGroupId ?? "";
  form.weeklyBulletin = member.notificationSettings.weeklyBulletin;
  form.sermonPublished = member.notificationSettings.sermonPublished;
  form.lifePostPublished = member.notificationSettings.lifePostPublished;
  form.prayerUpdates = member.notificationSettings.prayerUpdates;
  drawer.value = true;
}

function newMember() {
  selectedMember.value = null;
  isCreating.value = true;
  drawerTitle.value = t("New member");
  detailError.value = null;
  detailLoading.value = false;
  resetForm();
  drawer.value = true;
}

function resetForm() {
  form.email = "";
  form.displayName = "";
  form.phone = "";
  form.status = "active";
  form.roles = ["member"];
  form.appLocale = "en";
  form.fellowshipGroupId = "";
  form.weeklyBulletin = true;
  form.sermonPublished = true;
  form.lifePostPublished = true;
  form.prayerUpdates = false;
}

function notificationSettings() {
  return {
    weeklyBulletin: form.weeklyBulletin,
    sermonPublished: form.sermonPublished,
    lifePostPublished: form.lifePostPublished,
    prayerUpdates: form.prayerUpdates
  };
}

function buildMemberPayload(): MemberCreateRequest & MemberUpdateRequest {
  return {
    email: form.email.trim(),
    displayName: form.displayName.trim(),
    phone: form.phone.trim() || null,
    status: form.status,
    roles: [...form.roles],
    appLocale: form.appLocale,
    fellowshipGroupId: form.fellowshipGroupId.trim() || null,
    notificationSettings: notificationSettings()
  };
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
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.members") }}</div>
        <div class="page-subtitle">
          {{ t("members.pageSubtitle") }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          :loading="membersQuery.isFetching.value"
          @click="membersQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
        <v-btn v-if="canManage" color="primary" @click="newMember">
          {{ t("New member") }}
        </v-btn>
      </div>
    </div>

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
              @keyup.enter="membersQuery.refetch()"
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
              @update:model-value="membersQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.fellowshipGroupId"
              :label="t('Group')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="membersQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block variant="tonal" @click="membersQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <v-progress-linear
        v-if="membersQuery.isPending.value"
        indeterminate
        color="primary"
      />
      <v-alert
        v-else-if="membersQuery.error.value"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ formatApiErrorMessage(membersQuery.error.value, t("common.error")) }}
      </v-alert>
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Name") }}</th>
            <th>{{ t("Email") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Role") }}</th>
            <th>{{ t("Group") }}</th>
            <th>{{ t("Locale") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in members"
            :key="member.id"
            class="cursor-pointer"
            @click="openMember(member)"
          >
            <td class="font-weight-bold">{{ member.displayName }}</td>
            <td>{{ member.email }}</td>
            <td>
              <v-chip size="small" :color="statusColor(member.status)">
                {{ t(member.status) }}
              </v-chip>
            </td>
            <td>{{ member.roles.map((role) => t(role)).join(", ") }}</td>
            <td>{{ member.fellowshipGroupId || t("common.notSet") }}</td>
            <td>{{ member.appLocale }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-navigation-drawer v-model="drawer" location="right" temporary width="500">
      <div class="pa-5">
        <div class="text-h6 font-weight-bold">
          {{ drawerTitle }}
        </div>
        <v-progress-linear
          v-if="detailLoading"
          indeterminate
          color="primary"
          class="mt-5"
        />
        <v-alert
          v-else-if="detailError"
          type="error"
          variant="tonal"
          class="mt-5"
        >
          {{ formatApiErrorMessage(detailError, t("common.error")) }}
        </v-alert>
        <v-form
          v-else-if="isCreating || selectedMember"
          class="mt-5"
          @submit.prevent="saveMember"
        >
          <v-text-field
            v-model="form.email"
            :label="t('Email')"
            type="email"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="form.displayName"
            :label="t('Display name')"
            density="comfortable"
            variant="outlined"
          />
          <v-text-field
            v-model="form.phone"
            :label="t('Phone')"
            density="comfortable"
            variant="outlined"
          />
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="optionItems(['active', 'pending', 'inactive', 'blocked'])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.roles"
                :label="t('Roles')"
                :items="optionItems(['member', 'leader', 'pastor'])"
                multiple
                chips
                closable-chips
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.appLocale"
                :label="t('App locale')"
                :items="optionItems(['en', 'es', 'zh-Hans', 'zh-Hant'])"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.fellowshipGroupId"
                :label="t('Fellowship group')"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <div class="text-subtitle-2 font-weight-bold mb-3">
            {{ t("Notifications") }}
          </div>
          <v-checkbox
            v-model="form.weeklyBulletin"
            :label="t('Weekly bulletin')"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="form.sermonPublished"
            :label="t('Sermon published')"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="form.lifePostPublished"
            :label="t('Life post published')"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-model="form.prayerUpdates"
            :label="t('Prayer updates')"
            density="compact"
            hide-details
            class="mb-4"
          />

          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              type="submit"
              color="primary"
              :disabled="
                !canManage ||
                !canSave ||
                createMutation.isPending.value ||
                updateMutation.isPending.value
              "
              :loading="
                createMutation.isPending.value || updateMutation.isPending.value
              "
            >
              {{ t("common.save") }}
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
