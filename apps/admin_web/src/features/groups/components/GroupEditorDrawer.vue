<script setup lang="ts">
import type { MinistryGroup } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import type { GroupEditorForm } from "../group_workspace_models";

const drawer = defineModel<boolean>({ required: true });

defineProps<{
  selectedGroup: MinistryGroup | null;
  form: GroupEditorForm;
  canManage: boolean;
  canSave: boolean;
  saveLoading: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-navigation-drawer v-model="drawer" location="right" temporary width="560">
    <div class="pa-5">
      <div class="d-flex align-center justify-space-between ga-3">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ selectedGroup ? t("Edit group") : t("New group") }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ selectedGroup?.name || t("Create a fellowship group") }}
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="drawer = false" />
      </div>

      <v-form class="mt-5" @submit.prevent="emit('save')">
        <v-text-field
          v-model="form.name"
          :label="t('Name')"
          :disabled="!canManage"
          variant="outlined"
          density="comfortable"
        />
        <v-textarea
          v-model="form.description"
          :label="t('Description')"
          :disabled="!canManage"
          variant="outlined"
          density="comfortable"
          rows="3"
        />
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.meetingTime"
              :label="t('Meeting time')"
              :disabled="!canManage"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.location"
              :label="t('Location')"
              :disabled="!canManage"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
        <v-text-field
          v-model="form.leaderName"
          :label="t('Leader')"
          :disabled="!canManage"
          variant="outlined"
          density="comfortable"
        />
        <v-row dense>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.status"
              :label="t('Status')"
              :items="optionItems(['draft', 'active', 'paused', 'archived'])"
              :disabled="!canManage"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.visibility"
              :label="t('Visibility')"
              :items="optionItems(['public', 'members', 'group', 'private'])"
              :disabled="!canManage"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.capacity"
              :label="t('Capacity')"
              :disabled="!canManage"
              type="number"
              min="1"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
        <v-btn
          v-if="canManage"
          type="submit"
          color="primary"
          :disabled="!canSave || saveLoading"
          :loading="saveLoading"
        >
          {{ t("Save") }}
        </v-btn>
      </v-form>
    </div>
  </v-navigation-drawer>
</template>
