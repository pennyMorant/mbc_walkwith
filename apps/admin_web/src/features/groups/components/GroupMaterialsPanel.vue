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
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminMobileDataRow from "@/core/ui/AdminMobileDataRow.vue";
import { formatGroupDateTime } from "../group_presenters";
import type { GroupMaterialForm } from "../group_workspace_models";
import GroupPanelState from "./GroupPanelState.vue";

const form = defineModel<GroupMaterialForm>("form", { required: true });
const status = defineModel<GroupTaskStatus | "">("status", { required: true });
const materialType = defineModel<GroupMaterialType | "">("materialType", {
  required: true
});

defineProps<{
  materials: GroupMaterialAssignment[];
  pending: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  commandErrorMessage: string;
  mutationPending: boolean;
  canManage: boolean;
  canCreate: boolean;
}>();

const emit = defineEmits<{
  applyFilters: [];
  retry: [];
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
  <GroupPanelState
    :pending="pending"
    :error-message="errorMessage"
    :refresh-error-message="refreshErrorMessage"
    :command-error-message="commandErrorMessage"
    @retry="emit('retry')"
  >
    <AdminFilterToolbar class="mb-3" @apply="emit('applyFilters')">
      <v-select
        v-model="materialType"
        class="admin-filter-control"
        :label="t('Material type')"
        :items="optionItems(['', ...groupMaterialTypeOptions])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="optionItems(['', ...groupTaskStatusOptions])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <v-btn type="submit" variant="tonal">
          {{ t("common.go") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>
    <v-table class="d-none d-md-block" density="compact">
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
    <div class="d-md-none">
      <p
        v-if="!pending && materials.length === 0"
        class="text-body-2 text-medium-emphasis py-3 mb-0"
      >
        {{ t("No materials match the current filters.") }}
      </p>
      <AdminMobileDataRow v-for="material in materials" :key="material.id">
        <strong>{{ material.title }}</strong>
        <span class="text-caption text-medium-emphasis">
          {{ t(material.materialType) }} · {{ material.materialId }}
        </span>
        <template #meta>
          <span>
            {{ t("Due") }}:
            {{ formatGroupDateTime(material.dueAt, locale) || t("common.notSet") }}
          </span>
        </template>
        <template #actions>
          <v-select
            :model-value="material.status"
            :items="optionItems(groupTaskStatusOptions)"
            :disabled="!canManage || mutationPending"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="updateStatus(material, $event)"
          />
        </template>
      </AdminMobileDataRow>
    </div>

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
  </GroupPanelState>
</template>
