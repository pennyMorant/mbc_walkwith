<script setup lang="ts">
import type {
  EventRegistration,
  EventRegistrationStatus
} from "@mbc/api-contracts";
import { ref } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import { eventRegistrationStatusColor } from "../life_event_registration_presenters";

const props = defineProps<{
  registrations: EventRegistration[];
  updateStatusLoading: boolean;
  formatDateTime: (value: string | null | undefined) => string;
}>();

const emit = defineEmits<{
  edit: [registration: EventRegistration];
  updateStatus: [request: {
    registrationId: string;
    status: EventRegistrationStatus;
  }];
}>();

const { t } = useI18n();
const statusActions: Array<{
  status: EventRegistrationStatus;
  label: string;
  icon: string;
}> = [
  { status: "confirmed", label: "Confirm", icon: "mdi-check-circle-outline" },
  { status: "checked_in", label: "Check in", icon: "mdi-account-check" },
  { status: "cancelled", label: "Cancel", icon: "mdi-cancel" },
  { status: "absent", label: "Absent", icon: "mdi-account-off-outline" }
];
const pendingStatusChange = ref<{
  registration: EventRegistration;
  status: EventRegistrationStatus;
} | null>(null);

function requestStatusChange(
  registration: EventRegistration,
  status: EventRegistrationStatus
) {
  pendingStatusChange.value = { registration, status };
}

function confirmStatusChange() {
  const pending = pendingStatusChange.value;
  if (!pending) {
    return;
  }
  emit("updateStatus", {
    registrationId: pending.registration.id,
    status: pending.status
  });
  pendingStatusChange.value = null;
}
</script>

<template>
  <v-list class="registration-list pa-0 mt-3" bg-color="transparent">
    <template v-for="(registration, index) in registrations" :key="registration.id">
      <v-list-item class="px-0 py-3">
        <div class="d-flex align-start ga-2">
          <div class="registration-identity flex-grow-1">
            <div class="font-weight-bold text-body-2">
              {{ registration.attendeeName }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ registration.attendeeEmail || t("common.notSet") }}
            </div>
          </div>
          <v-chip
            :color="eventRegistrationStatusColor(registration.status)"
            size="small"
            variant="tonal"
          >
            {{ t(registration.status) }}
          </v-chip>
          <v-tooltip :text="t('Edit')">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon="mdi-pencil"
                :aria-label="t('Edit')"
                size="x-small"
                variant="text"
                @click="emit('edit', registration)"
              />
            </template>
          </v-tooltip>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-vertical"
                size="x-small"
                variant="text"
                :aria-label="t('Actions')"
                :disabled="updateStatusLoading"
              />
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="action in statusActions.filter(
                  (item) => item.status !== registration.status
                )"
                :key="action.status"
                :prepend-icon="action.icon"
                :title="t(action.label)"
                @click="requestStatusChange(registration, action.status)"
              />
            </v-list>
          </v-menu>
        </div>

        <div class="registration-facts text-caption text-medium-emphasis mt-2">
          <span>
            <v-icon icon="mdi-account-multiple-outline" size="14" />
            {{ t("Party size") }} {{ registration.partySize }}
          </span>
          <span>
            <v-icon icon="mdi-calendar-check-outline" size="14" />
            {{
              registration.checkedInAt
                ? formatDateTime(registration.checkedInAt)
                : t("Not checked in")
            }}
          </span>
          <span v-if="registration.checkInMethod">
            {{ t(registration.checkInMethod) }}
          </span>
        </div>
        <div
          v-if="registration.note"
          class="registration-note text-body-2 text-medium-emphasis mt-2"
        >
          {{ registration.note }}
        </div>
      </v-list-item>
      <v-divider v-if="index < registrations.length - 1" />
    </template>
  </v-list>

  <v-dialog
    :model-value="Boolean(pendingStatusChange)"
    max-width="440"
    @update:model-value="(value) => !value && (pendingStatusChange = null)"
  >
    <v-card>
      <v-card-title>{{ t("Change registration status") }}</v-card-title>
      <v-card-text v-if="pendingStatusChange">
        <div class="font-weight-bold">
          {{ pendingStatusChange.registration.attendeeName }}
        </div>
        <v-chip
          :color="eventRegistrationStatusColor(pendingStatusChange.status)"
          class="my-3"
          size="small"
          variant="tonal"
        >
          {{ t(pendingStatusChange.status) }}
        </v-chip>
        <div class="text-body-2 text-medium-emphasis">
          {{ t("Confirm this registration status change.") }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="pendingStatusChange = null">
          {{ t("Cancel") }}
        </v-btn>
        <v-btn color="primary" @click="confirmStatusChange">
          {{ t("Confirm") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.registration-identity {
  min-width: 0;
}

.registration-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.registration-facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.registration-note {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
