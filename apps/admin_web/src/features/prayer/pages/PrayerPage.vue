<script setup lang="ts">
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";

import PrayerModerationDrawer from "../components/PrayerModerationDrawer.vue";
import PrayerRequestsTable from "../components/PrayerRequestsTable.vue";
import PrayerSummaryCards from "../components/PrayerSummaryCards.vue";
import { usePrayerPage } from "../composables/use_prayer_page";

const {
  approve,
  approveMutation,
  archive,
  archiveMutation,
  canModerate,
  canUpdate,
  deleteMutation,
  deleteSelected,
  drawer,
  errorMessage,
  filters,
  form,
  hide,
  hideMutation,
  openRequest,
  pendingCount,
  privateCount,
  requests,
  requestsQuery,
  save,
  selectedRequest,
  successMessage,
  successVisible,
  t,
  updateMutation
} = usePrayerPage();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.prayer')" :subtitle="t('prayer.pageSubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="requestsQuery.isFetching.value"
          @click="requestsQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="comfortable"
      class="mt-4"
    >
      {{ errorMessage }}
    </v-alert>

    <PrayerSummaryCards
      :loaded="requests.length"
      :pending="pendingCount"
      :private-count="privateCount"
    />
    <PrayerRequestsTable
      v-model:filters="filters"
      :requests="requests"
      :loading="requestsQuery.isPending.value"
      @open="openRequest"
      @refresh="requestsQuery.refetch()"
    />
    <PrayerModerationDrawer
      v-model="drawer"
      v-model:form="form"
      :request="selectedRequest"
      :can-moderate="canModerate"
      :can-update="canUpdate"
      :save-pending="updateMutation.isPending.value"
      :approve-pending="approveMutation.isPending.value"
      :hide-pending="hideMutation.isPending.value"
      :archive-pending="archiveMutation.isPending.value"
      :delete-pending="deleteMutation.isPending.value"
      @save="save"
      @approve="approve"
      @hide="hide"
      @archive="archive"
      @delete="deleteSelected"
    />

    <v-snackbar v-model="successVisible" color="success" timeout="2600">
      {{ successMessage }}
    </v-snackbar>
  </div>
</template>
