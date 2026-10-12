<script setup lang="ts">
import type {
  GroupMaterialAssignment,
  GroupMaterialType,
  GroupTaskStatus
} from "@mbc/api-contracts";

import {
  groupMaterialTypeOptions,
  groupTaskStatusOptions
} from "@/core/api/group_activity";
import { useI18n } from "@/core/i18n/i18n";
import { formatGroupDateTime } from "../group_presenters";
import type { GroupMaterialForm } from "../group_workspace_models";

const form = defineModel<GroupMaterialForm>("form", { required: true });
const status = defineModel<GroupTaskStatus | "">("status", { required: true });
const materialType = defineModel<GroupMaterialType | "">("materialType", {
  required: true
});

defineProps<{
  materials: GroupMaterialAssignment[];
  pending: boolean;
  mutationPending: boolean;
  canManage: boolean;
  canCreate: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  create: [];
  updateStatus: [material: GroupMaterialAssignment, status: GroupTaskStatus];
}>();

const { locale, optionItems, t } = useI18n();

function updateStatus(
  material: GroupMaterialAssignment,
  nextStatus: GroupTaskStatus | null
) {
  if (nextStatus && nextStatus !== material.status) {
    emit("updateStatus", material, nextStatus);
  }
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-md-row ga-2 mb-3">
      <v-select
        v-model="materialType"
        :label="t('Material type')"
        :items="optionItems(['', ...groupMaterialTypeOptions])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="status"
        :label="t('Status')"
        :items="optionItems(['', ...groupTaskStatusOptions])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-btn variant="tonal" @click="emit('refresh')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <v-table density="compact">
      <thead>
        <tr>
          <th>{{ t("Material") }}</th>
          <th>{{ t("Due") }}</th>
          <th>{{ t("Status") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!pending && materials.length === 0">
          <td colspan="3" class="text-medium-emphasis py-4">
            {{ t("No materials match the current filters.") }}
          </td>
        </tr>
        <tr v-for="material in materials" :key="material.id">
          <td>
            <div class="font-weight-medium">{{ material.title }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t(material.materialType) }} · {{ material.materialId }}
            </div>
          </td>
          <td class="text-no-wrap">
            {{ formatGroupDateTime(material.dueAt, locale) || t("common.notSet") }}
          </td>
          <td style="min-width: 180px">
            <v-select
              :model-value="material.status"
              :items="optionItems(groupTaskStatusOptions)"
              :disabled="!canManage || mutationPending"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateStatus(material, $event)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-divider class="my-4" />
    <div v-if="canManage" class="text-subtitle-2 mb-3">
      {{ t("Assign material") }}
    </div>
    <v-row v-if="canManage" dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.title"
          :label="t('Title')"
          :disabled="mutationPending"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.materialType"
          :label="t('Material type')"
          :disabled="mutationPending"
          :items="optionItems(groupMaterialTypeOptions)"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.materialId"
          :label="t('Material ID')"
          :disabled="mutationPending"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.status"
          :label="t('Status')"
          :disabled="mutationPending"
          :items="optionItems(groupTaskStatusOptions)"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="form.dueAt"
          :label="t('Due')"
          :disabled="mutationPending"
          type="datetime-local"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          block
          color="primary"
          :disabled="!canCreate || mutationPending"
          :loading="mutationPending"
          @click="emit('create')"
        >
          {{ t("Assign") }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
