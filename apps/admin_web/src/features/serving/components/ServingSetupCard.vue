<script setup lang="ts">
import type {
  ServingRole,
  ServingStatus,
  ServingTeam
} from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import type {
  ServingRoleForm,
  ServingTeamForm
} from "../serving_workspace_models";

const teamForm = defineModel<ServingTeamForm>("teamForm", { required: true });
const roleForm = defineModel<ServingRoleForm>("roleForm", { required: true });
const props = defineProps<{
  teams: ServingTeam[];
  roles: ServingRole[];
  loading: boolean;
  canManage: boolean;
  canCreateTeam: boolean;
  canCreateRole: boolean;
  createTeamPending: boolean;
  createRolePending: boolean;
  updatePending: boolean;
}>();
const emit = defineEmits<{
  createTeam: [];
  createRole: [];
  updateTeamStatus: [team: ServingTeam, status: ServingStatus];
  updateRoleStatus: [role: ServingRole, status: ServingStatus];
}>();

const { optionItems, t } = useI18n();
const teamItems = computed(() =>
  props.teams.map((team) => ({ title: team.name, value: team.id }))
);
const statusItems = optionItems(["active", "paused", "archived"] as const);

function updateTeamStatus(team: ServingTeam, status: ServingStatus | null) {
  if (status) emit("updateTeamStatus", team, status);
}

function updateRoleStatus(role: ServingRole, status: ServingStatus | null) {
  if (status) emit("updateRoleStatus", role, status);
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title>{{ t("Teams and roles") }}</v-card-title>
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-card-text>
      <v-text-field
        v-model="teamForm.name"
        :label="t('Team name')"
        :disabled="!canManage"
        variant="outlined"
        density="compact"
      />
      <v-textarea
        v-model="teamForm.description"
        :label="t('Description')"
        :disabled="!canManage"
        rows="2"
        variant="outlined"
        density="compact"
      />
      <v-btn
        block
        color="primary"
        :disabled="!canManage || !canCreateTeam || createTeamPending"
        :loading="createTeamPending"
        @click="emit('createTeam')"
      >
        {{ t("Create team") }}
      </v-btn>

      <v-list class="mt-3" density="compact">
        <v-list-item v-if="!loading && teams.length === 0">
          <v-list-item-title class="text-medium-emphasis">
            {{ t("No serving teams yet.") }}
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-for="team in teams" :key="team.id" :title="team.name">
          <template #append>
            <v-select
              :model-value="team.status"
              :items="statusItems"
              :disabled="!canManage || updatePending"
              density="compact"
              variant="outlined"
              hide-details
              style="width: 132px"
              @update:model-value="updateTeamStatus(team, $event)"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-divider class="my-5" />

      <v-select
        v-model="roleForm.teamId"
        :items="teamItems"
        :label="t('Team')"
        :disabled="!canManage"
        variant="outlined"
        density="compact"
      />
      <v-text-field
        v-model="roleForm.name"
        :label="t('Role name')"
        :disabled="!canManage"
        variant="outlined"
        density="compact"
      />
      <v-textarea
        v-model="roleForm.description"
        :label="t('Description')"
        :disabled="!canManage"
        rows="2"
        variant="outlined"
        density="compact"
      />
      <v-btn
        block
        color="primary"
        :disabled="!canManage || !canCreateRole || createRolePending"
        :loading="createRolePending"
        @click="emit('createRole')"
      >
        {{ t("Create role") }}
      </v-btn>

      <v-list class="mt-3" density="compact">
        <v-list-item v-if="!loading && roles.length === 0">
          <v-list-item-title class="text-medium-emphasis">
            {{ t("No serving roles yet.") }}
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="role in roles"
          :key="role.id"
          :title="role.name"
          :subtitle="teams.find((team) => team.id === role.teamId)?.name ?? ''"
        >
          <template #append>
            <v-select
              :model-value="role.status"
              :items="statusItems"
              :disabled="!canManage || updatePending"
              density="compact"
              variant="outlined"
              hide-details
              style="width: 132px"
              @update:model-value="updateRoleStatus(role, $event)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
