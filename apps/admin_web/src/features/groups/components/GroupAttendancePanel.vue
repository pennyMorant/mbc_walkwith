<script setup lang="ts">
import type {
  GroupAttendanceRecord,
  GroupAttendanceStatus,
  GroupMembership
} from "@mbc/api-contracts";
import { computed } from "vue";

import { groupAttendanceStatusOptions } from "@/core/api/group_activity";
import { useI18n } from "@/core/i18n/i18n";
import { formatGroupDate } from "../group_presenters";
import type { GroupAttendanceForm } from "../group_workspace_models";

const form = defineModel<GroupAttendanceForm>("form", { required: true });
const status = defineModel<GroupAttendanceStatus | "">("status", {
  required: true
});

const props = defineProps<{
  attendance: GroupAttendanceRecord[];
  memberships: GroupMembership[];
  pending: boolean;
  mutationPending: boolean;
  canManage: boolean;
  canRecord: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  record: [];
}>();

const { locale, optionItems, t } = useI18n();
const memberItems = computed(() =>
  props.memberships
    .filter((membership) => membership.status !== "inactive")
    .map((membership) => ({
      title: membership.memberDisplayName,
      value: membership.userId
    }))
);

</script>

<template>
  <div>
    <div class="d-flex flex-column flex-md-row ga-2 mb-3">
      <v-select
        v-model="status"
        :label="t('Status')"
        :items="optionItems(['', ...groupAttendanceStatusOptions])"
        density="compact"
        variant="outlined"
        hide-details
        max-width="220"
      />
      <v-btn variant="tonal" @click="emit('refresh')">
        {{ t("common.refresh") }}
      </v-btn>
    </div>
    <v-progress-linear v-if="pending" indeterminate color="primary" />
    <v-table density="compact">
      <thead>
        <tr>
          <th>{{ t("Date") }}</th>
          <th>{{ t("Member") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Note") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!pending && attendance.length === 0">
          <td colspan="4" class="text-medium-emphasis py-4">
            {{ t("No attendance records match the current filters.") }}
          </td>
        </tr>
        <tr v-for="record in attendance" :key="record.id">
          <td class="text-no-wrap">
            {{ formatGroupDate(record.meetingDate, locale) }}
          </td>
          <td>{{ record.memberDisplayName }}</td>
          <td>{{ t(record.status) }}</td>
          <td>{{ record.note || t("common.notSet") }}</td>
        </tr>
      </tbody>
    </v-table>

    <v-divider class="my-4" />
    <div v-if="canManage" class="text-subtitle-2 mb-3">
      {{ t("Record attendance") }}
    </div>
    <v-row v-if="canManage" dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.meetingDate"
          :label="t('Meeting date')"
          :disabled="mutationPending"
          type="datetime-local"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.memberUserId"
          :label="t('Member')"
          :disabled="mutationPending"
          :items="memberItems"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.status"
          :label="t('Status')"
          :disabled="mutationPending"
          :items="optionItems(groupAttendanceStatusOptions)"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="9">
        <v-text-field
          v-model="form.note"
          :label="t('Note')"
          :disabled="mutationPending"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn
          block
          color="primary"
          :disabled="!canRecord || mutationPending"
          :loading="mutationPending"
          @click="emit('record')"
        >
          {{ t("Save") }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
