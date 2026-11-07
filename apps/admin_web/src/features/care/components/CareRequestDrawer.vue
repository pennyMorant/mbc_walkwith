<script setup lang="ts">
import type {
  CareAssignee,
  CareFollowUp,
  CarePrivacyLevel,
  CareRequestAdmin,
  CareRequestStatus
} from "@mbc/api-contracts";
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";

import type {
  CareFollowUpEditorForm,
  CareRequestEditorForm
} from "../care_workspace_models";

const drawer = defineModel<boolean>({ required: true });
const props = defineProps<{
  request: CareRequestAdmin | null;
  form: CareRequestEditorForm;
  followUpForm: CareFollowUpEditorForm;
  assignees: CareAssignee[];
  followUps: CareFollowUp[];
  canManage: boolean;
  canSave: boolean;
  canCreateFollowUp: boolean;
  updateSaving: boolean;
  followUpSaving: boolean;
  assigneesLoading: boolean;
  assigneesErrorMessage: string;
  followUpsLoading: boolean;
  followUpsErrorMessage: string;
  updateErrorMessage: string;
  followUpErrorMessage: string;
  statusColor: (status: CareRequestStatus) => string;
  privacyColor: (privacy: CarePrivacyLevel) => string;
}>();

const emit = defineEmits<{
  save: [];
  addFollowUp: [];
  retryAssignees: [];
  retryFollowUps: [];
}>();

const { optionItems, t } = useI18n();
const editorDisabled = computed(() => !props.canManage || props.updateSaving);
const followUpDisabled = computed(
  () => !props.canManage || props.followUpSaving
);
</script>

<template>
  <AdminResponsiveDrawer v-model="drawer" :desktop-width="620">
    <div v-if="request" class="pa-5">
      <div class="d-flex align-start justify-space-between ga-4">
        <div class="min-width-0">
          <div class="text-h6 font-weight-bold text-wrap">
            {{ request.title }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1 text-wrap">
            {{ request.memberDisplayName }} · {{ request.memberEmail }}
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-chip
            size="small"
            variant="tonal"
            :color="privacyColor(request.privacyLevel)"
          >
            {{ t(request.privacyLevel) }}
          </v-chip>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('common.close')"
            @click="drawer = false"
          />
        </div>
      </div>

      <v-alert type="warning" variant="tonal" class="mt-5">
        {{ t("Care notes are sensitive and are not returned to member App APIs.") }}
      </v-alert>

      <div class="mt-5 text-body-1 care-body">
        {{ request.body }}
      </div>

      <v-divider class="my-5" />

      <v-form @submit.prevent="emit('save')">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.status"
              :label="t('Status')"
              :items="
                optionItems([
                  'submitted',
                  'assigned',
                  'in_progress',
                  'resolved',
                  'archived'
                ])
              "
              :disabled="editorDisabled"
              density="comfortable"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.privacyLevel"
              :label="t('Privacy')"
              :items="
                optionItems([
                  'pastoral_only',
                  'assigned_team',
                  'admin_restricted'
                ])
              "
              :disabled="editorDisabled"
              density="comfortable"
              variant="outlined"
            />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.assigneeAdminUserId"
              :label="t('Assignee')"
              :items="assignees"
              item-title="name"
              item-value="id"
              clearable
              :disabled="editorDisabled"
              :loading="assigneesLoading"
              density="comfortable"
              variant="outlined"
            />
            <AdminRetryAlert
              :message="assigneesErrorMessage"
              :retry-label="t('common.refresh')"
              density="compact"
              class="mb-4"
              @retry="emit('retryAssignees')"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.nextFollowUpAt"
              :label="t('Next follow-up')"
              type="datetime-local"
              :disabled="editorDisabled"
              density="comfortable"
              variant="outlined"
            />
          </v-col>
        </v-row>
        <v-textarea
          v-model="form.internalNote"
          :label="t('Internal note')"
          :disabled="editorDisabled"
          rows="4"
          density="comfortable"
          variant="outlined"
        />
        <v-alert
          v-if="updateErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ updateErrorMessage }}
        </v-alert>
        <v-btn
          v-if="canManage"
          type="submit"
          color="primary"
          :disabled="!canSave || updateSaving"
          :loading="updateSaving"
        >
          {{ t("common.save") }}
        </v-btn>
      </v-form>

      <v-divider class="my-5" />

      <div class="text-subtitle-1 font-weight-bold">
        {{ t("Follow-up records") }}
      </div>
      <v-form v-if="canManage" class="mt-3" @submit.prevent="emit('addFollowUp')">
        <v-select
          v-model="followUpForm.status"
          :label="t('Status')"
          :items="optionItems(['completed', 'planned', 'cancelled'])"
          :disabled="followUpDisabled"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="followUpForm.plannedAt"
          :label="t('Planned time')"
          type="datetime-local"
          :disabled="followUpDisabled"
          density="comfortable"
          variant="outlined"
        />
        <v-textarea
          v-model="followUpForm.note"
          :label="t('Follow-up note')"
          :disabled="followUpDisabled"
          rows="3"
          density="comfortable"
          variant="outlined"
        />
        <v-alert
          v-if="followUpErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ followUpErrorMessage }}
        </v-alert>
        <v-btn
          type="submit"
          color="primary"
          variant="tonal"
          :disabled="!canCreateFollowUp || followUpSaving"
          :loading="followUpSaving"
        >
          {{ t("Add follow-up") }}
        </v-btn>
      </v-form>

      <AdminDataState
        class="mt-4"
        :pending="followUpsLoading"
        :error-message="followUpsErrorMessage"
        :empty="followUps.length === 0"
        :empty-title="t('No follow-ups recorded.')"
        empty-icon="mdi-calendar-check-outline"
        :retry-label="t('common.refresh')"
        @retry="emit('retryFollowUps')"
      >
        <v-list lines="three">
          <v-list-item v-for="followUp in followUps" :key="followUp.id">
            <v-list-item-title>
              {{ followUp.authorName || t("Admin") }} · {{ t(followUp.status) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ followUp.note }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </AdminDataState>
    </div>
  </AdminResponsiveDrawer>
</template>

<style scoped>
.care-body {
  white-space: pre-wrap;
}

.min-width-0 {
  min-width: 0;
}
</style>
