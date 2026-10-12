<script setup lang="ts">
import type {
  EventRegistration,
  EventRegistrationStatus,
  LifePost
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import { eventRegistrationCountLabel } from "../life_event_registration_presenters";
import type {
  CheckInCodeDialog,
  RegistrationCreateDialog,
  RegistrationEditDialog,
  RegistrationFilters
} from "../life_event_registration_workspace";
import LifeEventCheckInCodeDialog from "./LifeEventCheckInCodeDialog.vue";
import LifeEventRegistrationCreateDialog from "./LifeEventRegistrationCreateDialog.vue";
import LifeEventRegistrationEditDialog from "./LifeEventRegistrationEditDialog.vue";
import LifeEventRegistrationList from "./LifeEventRegistrationList.vue";

defineProps<{
  post: LifePost;
  filters: RegistrationFilters;
  registrations: EventRegistration[];
  page: number;
  pageCount: number;
  total: number;
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  editDialog: RegistrationEditDialog;
  createDialog: RegistrationCreateDialog;
  checkInCodeDialog: CheckInCodeDialog;
  exportLoading: boolean;
  updateStatusLoading: boolean;
  updateLoading: boolean;
  createLoading: boolean;
  checkInCodeLoading: boolean;
  formatDateTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  addRegistration: [];
  createCheckInCode: [];
  rotateCheckInCode: [];
  exportCsv: [];
  applyFilters: [];
  retry: [];
  updatePage: [page: number];
  editRegistration: [registration: EventRegistration];
  updateStatus: [request: {
    registrationId: string;
    status: EventRegistrationStatus;
  }];
  closeEdit: [];
  saveEdit: [];
  closeCreate: [];
  saveCreate: [];
  closeCheckInCode: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="pa-4 mb-5" variant="outlined">
    <div class="d-flex flex-column ga-3">
      <div class="d-flex align-start justify-space-between ga-3">
        <div>
          <div class="text-subtitle-2 font-weight-bold">
            {{ t("Event registrations") }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{
              `${post.registrationSummary.registeredCount}/${post.registrationSummary.capacity ?? "∞"} ${t("Registered")} · ${eventRegistrationCountLabel(total, t)}`
            }}
          </div>
        </div>
        <div class="d-flex ga-1">
          <v-tooltip :text="t('Add registration')">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon="mdi-account-plus-outline"
                :aria-label="t('Add registration')"
                size="small"
                color="primary"
                variant="tonal"
                @click="emit('addRegistration')"
              />
            </template>
          </v-tooltip>
          <v-tooltip :text="t('Check-in QR')">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon="mdi-qrcode"
                :aria-label="t('Check-in QR')"
                size="small"
                color="primary"
                variant="tonal"
                :loading="checkInCodeLoading"
                @click="emit('createCheckInCode')"
              />
            </template>
          </v-tooltip>
          <v-tooltip :text="t('Export CSV')">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon="mdi-download-outline"
                :aria-label="t('Export CSV')"
                size="small"
                variant="tonal"
                :loading="exportLoading"
                @click="emit('exportCsv')"
              />
            </template>
          </v-tooltip>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-text-field
          v-model="filters.query"
          :label="t('Search')"
          append-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          @click:append-inner="emit('applyFilters')"
          @keyup.enter="emit('applyFilters')"
        />
        <v-select
          v-model="filters.status"
          class="registration-status-filter"
          :label="t('Status')"
          :items="optionItems(['', 'confirmed', 'cancelled', 'checked_in', 'absent'])"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="emit('applyFilters')"
        />
      </div>
    </div>

    <v-progress-linear
      v-if="fetching"
      indeterminate
      color="primary"
      class="mt-3"
    />
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-3">
      <div class="d-flex align-center justify-space-between ga-3">
        <span>{{ errorMessage }}</span>
        <v-btn size="small" variant="text" @click="emit('retry')">
          {{ t("common.retry") }}
        </v-btn>
      </div>
    </v-alert>
    <v-skeleton-loader v-if="pending" type="list-item-three-line@3" class="mt-3" />
    <LifeEventRegistrationList
      v-else-if="registrations.length > 0"
      :registrations="registrations"
      :update-status-loading="updateStatusLoading"
      :format-date-time="formatDateTime"
      @edit="emit('editRegistration', $event)"
      @update-status="emit('updateStatus', $event)"
    />
    <v-sheet
      v-else-if="!errorMessage"
      class="text-center text-body-2 text-medium-emphasis py-8 mt-3"
      color="transparent"
    >
      {{ t("No registrations match the current filters.") }}
    </v-sheet>
    <v-pagination
      v-if="pageCount > 1"
      :model-value="page"
      :length="pageCount"
      :total-visible="5"
      density="compact"
      class="mt-3"
      @update:model-value="emit('updatePage', $event)"
    />

    <LifeEventRegistrationEditDialog
      :dialog="editDialog"
      :max-party-size="post.registrationMaxPartySize"
      :loading="updateLoading"
      @close="emit('closeEdit')"
      @save="emit('saveEdit')"
    />
    <LifeEventRegistrationCreateDialog
      :dialog="createDialog"
      :max-party-size="post.registrationMaxPartySize"
      :loading="createLoading"
      @close="emit('closeCreate')"
      @save="emit('saveCreate')"
    />
    <LifeEventCheckInCodeDialog
      :show="checkInCodeDialog.show"
      :code="checkInCodeDialog.code"
      :post="post"
      :loading="checkInCodeLoading"
      @close="emit('closeCheckInCode')"
      @rotate="emit('rotateCheckInCode')"
    />
  </v-card>
</template>

<style scoped>
.registration-status-filter {
  flex: 0 0 150px;
}

@media (max-width: 480px) {
  .registration-status-filter {
    flex-basis: 130px;
  }
}
</style>
