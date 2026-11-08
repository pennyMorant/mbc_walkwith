<script setup lang="ts">
import type {
  ServingAssignment,
  ServingAssignmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

import { formatServingDateTime } from "../serving_presenters";

defineProps<{
  assignments: ServingAssignment[];
  loading: boolean;
  canManage: boolean;
  updatePending: boolean;
}>();

defineEmits<{
  updateStatus: [
    assignment: ServingAssignment,
    status: ServingAssignmentStatus
  ];
}>();

const { locale, t } = useI18n();
</script>

<template>
  <AdminResponsiveTable>
    <template #desktop>
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
                @click="$emit('updateStatus', assignment, 'confirmed')"
              >
                {{ t("Confirm") }}
              </v-btn>
              <v-btn
                v-if="canManage && assignment.status !== 'cancelled'"
                size="small"
                variant="text"
                :disabled="updatePending"
                @click="$emit('updateStatus', assignment, 'cancelled')"
              >
                {{ t("Cancel") }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
    <template #mobile>
      <div v-if="!loading && assignments.length === 0" class="text-medium-emphasis py-6">
        {{ t("No assignments match the current filters.") }}
      </div>
      <AdminMobileDataRow
        v-for="assignment in assignments"
        :key="assignment.id"
      >
        <strong>{{ assignment.title }}</strong>
        <span>{{ assignment.teamName }} · {{ assignment.roleName }}</span>
        <template #trailing>
          <v-chip size="small">{{ t(assignment.status) }}</v-chip>
        </template>
        <template #meta>
          <span>{{ assignment.memberDisplayName }} · {{ assignment.memberEmail }}</span>
          <span>{{ formatServingDateTime(assignment.startsAt, locale) }}</span>
          <span>{{ assignment.location || t("common.notSet") }}</span>
        </template>
        <template v-if="canManage" #actions>
          <div class="d-flex flex-wrap justify-end ga-1">
            <v-btn
              v-if="assignment.status !== 'confirmed'"
              size="small"
              variant="tonal"
              :disabled="updatePending"
              @click="$emit('updateStatus', assignment, 'confirmed')"
            >
              {{ t("Confirm") }}
            </v-btn>
            <v-btn
              v-if="assignment.status !== 'cancelled'"
              size="small"
              variant="text"
              :disabled="updatePending"
              @click="$emit('updateStatus', assignment, 'cancelled')"
            >
              {{ t("Cancel") }}
            </v-btn>
          </div>
        </template>
      </AdminMobileDataRow>
    </template>
  </AdminResponsiveTable>
</template>
