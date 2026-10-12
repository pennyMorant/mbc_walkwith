<script setup lang="ts">
import type {
  ServingAssignment,
  ServingAssignmentStatus,
  ServingMemberOption,
  ServingRole,
  ServingTeam
} from "@mbc/api-contracts";
import { computed } from "vue";

import type { ServingAssignmentFilters } from "@/core/api/serving";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatServingDateTime,
  servingMemberLabel
} from "../serving_presenters";
import type { ServingAssignmentForm } from "../serving_workspace_models";

const form = defineModel<ServingAssignmentForm>("form", { required: true });
const filters = defineModel<ServingAssignmentFilters>("filters", {
  required: true
});
const props = defineProps<{
  assignments: ServingAssignment[];
  members: ServingMemberOption[];
  teams: ServingTeam[];
  roles: ServingRole[];
  loading: boolean;
  canManage: boolean;
  canCreate: boolean;
  createPending: boolean;
  updatePending: boolean;
}>();
const emit = defineEmits<{
  create: [];
  refresh: [];
  updateStatus: [
    assignment: ServingAssignment,
    status: ServingAssignmentStatus
  ];
}>();
const { locale, optionItems, t } = useI18n();

const teamItems = computed(() =>
  props.teams.map((team) => ({ title: team.name, value: team.id }))
);
const roleItems = computed(() =>
  props.roles
    .filter((role) => !form.value.teamId || role.teamId === form.value.teamId)
    .map((role) => ({ title: role.name, value: role.id }))
);
const memberItems = computed(() =>
  props.members.map((member) => ({
    title: servingMemberLabel(member),
    value: member.id
  }))
);
</script>

<template>
  <v-card variant="outlined">
    <v-card-title>{{ t("Assignments") }}</v-card-title>
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-card-text v-if="canManage">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.teamId"
            :items="teamItems"
            :label="t('Team')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.roleId"
            :items="roleItems"
            :label="t('Role')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.userId"
            :items="memberItems"
            :label="t('Member')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.title"
            :label="t('Assignment title')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.location"
            :label="t('Location')"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.startsAt"
            :label="t('Starts at')"
            type="datetime-local"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.endsAt"
            :label="t('Ends at')"
            type="datetime-local"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.note"
            :label="t('Note')"
            rows="2"
            variant="outlined"
            density="compact"
          />
        </v-col>
      </v-row>
      <v-btn
        color="primary"
        prepend-icon="mdi-calendar-plus"
        :disabled="!canCreate || createPending"
        :loading="createPending"
        @click="emit('create')"
      >
        {{ t("Create assignment") }}
      </v-btn>
    </v-card-text>

    <v-divider />
    <v-card-text>
      <v-row dense class="mb-3">
        <v-col cols="12" md="7">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('refresh')"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="filters.status"
            :items="
              optionItems([
                '',
                'scheduled',
                'confirmed',
                'declined',
                'swap_requested',
                'covered',
                'cancelled'
              ])
            "
            :label="t('Status')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="emit('refresh')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
      <v-table density="compact">
        <thead>
          <tr>
            <th>{{ t("Assignment") }}</th>
            <th>{{ t("Member") }}</th>
            <th>{{ t("Time") }}</th>
            <th>{{ t("Status") }}</th>
            <th class="text-right">{{ t("common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && assignments.length === 0">
            <td colspan="5" class="text-medium-emphasis py-6">
              {{ t("No assignments match the current filters.") }}
            </td>
          </tr>
          <tr v-for="assignment in assignments" :key="assignment.id">
            <td>
              <div class="font-weight-medium">{{ assignment.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ assignment.teamName }} · {{ assignment.roleName }}
              </div>
            </td>
            <td>
              <div>{{ assignment.memberDisplayName }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ assignment.memberEmail }}
              </div>
            </td>
            <td>{{ formatServingDateTime(assignment.startsAt, locale) }}</td>
            <td>{{ t(assignment.status) }}</td>
            <td class="text-right">
              <v-btn
                v-if="canManage && assignment.status !== 'confirmed'"
                size="small"
                variant="tonal"
                :disabled="updatePending"
                @click="emit('updateStatus', assignment, 'confirmed')"
              >
                {{ t("Confirm") }}
              </v-btn>
              <v-btn
                v-if="canManage && assignment.status !== 'cancelled'"
                size="small"
                variant="text"
                :disabled="updatePending"
                @click="emit('updateStatus', assignment, 'cancelled')"
              >
                {{ t("Cancel") }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
