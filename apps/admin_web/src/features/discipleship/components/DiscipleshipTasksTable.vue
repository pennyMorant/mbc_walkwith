<script setup lang="ts">
import type {
  DiscipleshipStage,
  DiscipleshipTask
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

const props = defineProps<{
  stages: DiscipleshipStage[];
  tasks: DiscipleshipTask[];
}>();

const { t } = useI18n();

function stageTitle(stageId: string | null) {
  if (!stageId) {
    return t("No stage");
  }
  return props.stages.find((stage) => stage.id === stageId)?.title ?? stageId;
}
</script>

<template>
  <AdminResponsiveTable class="mt-3">
    <template #desktop>
      <v-table density="compact">
        <thead>
          <tr>
            <th>{{ t("Order") }}</th>
            <th>{{ t("Task") }}</th>
            <th>{{ t("Stage") }}</th>
            <th>{{ t("Reference") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tasks.length === 0">
            <td colspan="4">{{ t("No tasks yet.") }}</td>
          </tr>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.position + 1 }}</td>
            <td>
              <div class="font-weight-medium">{{ task.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ task.description || task.id }}
              </div>
            </td>
            <td>{{ stageTitle(task.stageId) }}</td>
            <td>
              <div>{{ t(task.referenceType) }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ task.referenceId || t("common.notSet") }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
    <template #mobile>
      <div v-if="tasks.length === 0" class="text-medium-emphasis py-4">
        {{ t("No tasks yet.") }}
      </div>
      <AdminMobileDataRow v-for="task in tasks" :key="task.id">
        <strong>{{ task.position + 1 }}. {{ task.title }}</strong>
        <span>{{ task.description || task.id }}</span>
        <template #meta>
          <span>{{ t("Stage") }}: {{ stageTitle(task.stageId) }}</span>
          <span>{{ t(task.referenceType) }} · {{ task.referenceId || t("common.notSet") }}</span>
        </template>
      </AdminMobileDataRow>
    </template>
  </AdminResponsiveTable>
</template>
