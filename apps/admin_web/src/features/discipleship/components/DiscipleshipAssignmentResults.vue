<script setup lang="ts">
import type {
  DiscipleshipAssignment,
  DiscipleshipAssignmentStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

defineProps<{
  assignments: DiscipleshipAssignment[];
  hasTasks: boolean;
}>();

defineEmits<{ manageProgress: [assignment: DiscipleshipAssignment] }>();

const { t } = useI18n();

function assignmentStatusColor(status: DiscipleshipAssignmentStatus) {
  return {
    not_started: "grey",
    in_progress: "info",
    blocked: "warning",
    completed: "success",
    paused: "secondary",
    cancelled: "error"
  }[status];
}
</script>

<template>
  <AdminResponsiveTable class="mt-4">
    <template #desktop>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>{{ t("User") }}</th>
            <th>{{ t("Source") }}</th>
            <th>{{ t("Assignee") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Progress") }}</th>
            <th>{{ t("Actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="assignments.length === 0">
            <td colspan="6">{{ t("No journey assignments yet.") }}</td>
          </tr>
          <tr v-for="assignment in assignments" :key="assignment.id">
            <td>
              <div class="font-weight-medium">{{ assignment.userId }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ assignment.sourceId || t("common.notSet") }}
              </div>
            </td>
            <td>{{ t(assignment.sourceType) }}</td>
            <td>{{ assignment.assigneeName || t("common.notSet") }}</td>
            <td>
              <v-chip
                size="small"
                variant="tonal"
                :color="assignmentStatusColor(assignment.status)"
              >
                {{ t(assignment.status) }}
              </v-chip>
            </td>
            <td>
              <div class="font-weight-medium">
                {{ assignment.completedTaskCount }}/{{ assignment.taskTotalCount }}
              </div>
              <div v-if="assignment.progress.length === 0">
                {{ t("No progress yet.") }}
              </div>
              <div
                v-for="progress in assignment.progress"
                :key="progress.id"
                class="text-caption"
              >
                {{ progress.taskId }} · {{ t(progress.status) }}
              </div>
            </td>
            <td>
              <v-btn
                size="small"
                variant="tonal"
                :disabled="!hasTasks"
                @click="$emit('manageProgress', assignment)"
              >
                {{ t("Manage progress") }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
    <template #mobile>
      <div v-if="assignments.length === 0" class="text-medium-emphasis py-4">
        {{ t("No journey assignments yet.") }}
      </div>
      <AdminMobileDataRow
        v-for="assignment in assignments"
        :key="assignment.id"
      >
        <strong>{{ assignment.userId }}</strong>
        <span>{{ t(assignment.sourceType) }} · {{ assignment.sourceId || t("common.notSet") }}</span>
        <template #trailing>
          <v-chip
            size="small"
            variant="tonal"
            :color="assignmentStatusColor(assignment.status)"
          >
            {{ t(assignment.status) }}
          </v-chip>
        </template>
        <template #meta>
          <span>{{ t("Assignee") }}: {{ assignment.assigneeName || t("common.notSet") }}</span>
          <span>{{ t("Progress") }}: {{ assignment.completedTaskCount }}/{{ assignment.taskTotalCount }}</span>
          <span v-if="assignment.progress.length === 0">{{ t("No progress yet.") }}</span>
          <span v-for="progress in assignment.progress" :key="progress.id">
            {{ progress.taskId }} · {{ t(progress.status) }}
          </span>
        </template>
        <template #actions>
          <v-btn
            block
            size="small"
            variant="tonal"
            :disabled="!hasTasks"
            @click="$emit('manageProgress', assignment)"
          >
            {{ t("Manage progress") }}
          </v-btn>
        </template>
      </AdminMobileDataRow>
    </template>
  </AdminResponsiveTable>
</template>
