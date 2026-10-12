<script setup lang="ts">
import type {
  ServingAvailabilityRecord,
  ServingMemberOption
} from "@mbc/api-contracts";
import { computed } from "vue";

import type { ServingAvailabilityFilters } from "@/core/api/serving";
import { useI18n } from "@/core/i18n/i18n";
import {
  formatServingDateTime,
  servingMemberLabel,
  servingMemberLabelById
} from "../serving_presenters";
import type { ServingAvailabilityForm } from "../serving_workspace_models";

const form = defineModel<ServingAvailabilityForm>("form", { required: true });
const filters = defineModel<ServingAvailabilityFilters>("filters", {
  required: true
});
const props = defineProps<{
  records: ServingAvailabilityRecord[];
  members: ServingMemberOption[];
  selectableMembers: ServingMemberOption[];
  loading: boolean;
  canManage: boolean;
  canCreate: boolean;
  createPending: boolean;
}>();
const emit = defineEmits<{ create: []; refresh: [] }>();
const { locale, optionItems, t } = useI18n();

const memberItems = computed(() =>
  props.selectableMembers.map((member) => ({
    title: servingMemberLabel(member),
    value: member.id
  }))
);
const filterMemberItems = computed(() =>
  props.members.map((member) => ({
    title: servingMemberLabel(member),
    value: member.id
  }))
);
</script>

<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-row v-if="canManage" dense>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.userId"
          :items="memberItems"
          :label="t('Member')"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.startsAt"
          :label="t('Starts at')"
          type="datetime-local"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.endsAt"
          :label="t('Ends at')"
          type="datetime-local"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="form.status"
          :items="optionItems(['available', 'unavailable', 'preferred'])"
          :label="t('Status')"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="form.note"
          :label="t('Note')"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
          block
          color="primary"
          :disabled="!canCreate || createPending"
          :loading="createPending"
          @click="emit('create')"
        >
          {{ t("Save") }}
        </v-btn>
      </v-col>
    </v-row>

    <v-divider v-if="canManage" class="mb-4" />
    <v-row dense class="mb-3">
      <v-col cols="12" md="5">
        <v-select
          v-model="filters.userId"
          :items="[{ title: t('common.all'), value: '' }, ...filterMemberItems]"
          :label="t('Member')"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-select
          v-model="filters.status"
          :items="optionItems(['', 'available', 'unavailable', 'preferred'])"
          :label="t('Status')"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn block variant="tonal" @click="emit('refresh')">
          {{ t("common.go") }}
        </v-btn>
      </v-col>
    </v-row>

    <v-table density="compact">
      <thead>
        <tr>
          <th>{{ t("Member") }}</th>
          <th>{{ t("Time") }}</th>
          <th>{{ t("Status") }}</th>
          <th>{{ t("Note") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && records.length === 0">
          <td colspan="4" class="text-medium-emphasis py-6">
            {{ t("No availability records match the current filters.") }}
          </td>
        </tr>
        <tr v-for="record in records" :key="record.id">
          <td>{{ servingMemberLabelById(members, record.userId) }}</td>
          <td>
            {{ formatServingDateTime(record.startsAt, locale) }}
            <div class="text-caption text-medium-emphasis">
              {{ formatServingDateTime(record.endsAt, locale) }}
            </div>
          </td>
          <td>{{ t(record.status) }}</td>
          <td>{{ record.note || t("common.notSet") }}</td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
