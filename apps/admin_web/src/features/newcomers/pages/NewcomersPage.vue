<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/core/i18n/i18n";
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import NewcomerResults from "../components/NewcomerResults.vue";
import { useNewcomerPage } from "../composables/use_newcomer_page";
import {
  conversionStatusOptions,
  followUpStatusOptions,
  newcomerContactLine,
  newcomerFilterStatusOptions,
  newcomerStatusColor,
  newcomerStatusOptions
} from "../newcomer_presenters";

const { optionItems, t } = useI18n();
const {
  addFollowUp,
  assignedCount,
  canCreateFollowUp,
  canManage,
  canSave,
  discipleshipCount,
  drawer,
  detailErrorMessage,
  filters,
  followUpForm,
  followUpMutation,
  followUps,
  followUpsQuery,
  form,
  newCount,
  newcomers,
  newcomersQuery,
  listErrorMessage,
  openNewcomer,
  saveNewcomer,
  selectedNewcomer,
  updateMutation
} = useNewcomerPage();
const summaryMetrics = computed(() => [
  { id: "new", label: t("New newcomer profiles"), value: newCount.value, icon: "mdi-account-star-outline", tone: "primary" as const },
  { id: "follow_up", label: t("Active follow-up"), value: assignedCount.value, icon: "mdi-account-clock-outline", tone: "warning" as const },
  { id: "discipleship", label: t("In discipleship"), value: discipleshipCount.value, icon: "mdi-school-outline", tone: "success" as const }
]);
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.newcomers')" :subtitle="t('newcomers.pageSubtitle')">
      <template #actions>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="newcomersQuery.isFetching.value"
          prepend-icon="mdi-refresh"
          @click="newcomersQuery.refetch()"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-alert v-if="detailErrorMessage" type="error" variant="tonal" class="mt-4">
      {{ detailErrorMessage }}
    </v-alert>

    <AdminMetricGrid :items="summaryMetrics" />

    <v-card class="mt-6" variant="outlined">
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="newcomersQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(newcomerFilterStatusOptions)"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="newcomersQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn block variant="tonal" @click="newcomersQuery.refetch()">
              {{ t("common.go") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <v-divider />
      <NewcomerResults
        :newcomers="newcomers"
        :pending="newcomersQuery.isPending.value"
        :error-message="listErrorMessage"
        @open="openNewcomer"
        @retry="newcomersQuery.refetch()"
      />
    </v-card>

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="640">
      <div v-if="selectedNewcomer" class="pa-5">
        <div class="d-flex align-start justify-space-between ga-4">
          <div>
            <div class="text-h6 font-weight-bold">
              {{ selectedNewcomer.displayName }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ newcomerContactLine(selectedNewcomer) || t("common.notSet") }}
            </div>
          </div>
          <v-chip
            size="small"
            :color="newcomerStatusColor(selectedNewcomer.status)"
          >
            {{ t(selectedNewcomer.status) }}
          </v-chip>
        </div>

        <v-alert type="info" variant="tonal" class="mt-5">
          {{ t("newcomers.privacyNotice") }}
        </v-alert>

        <v-divider class="my-5" />

        <v-form @submit.prevent="saveNewcomer">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.status"
                :label="t('Status')"
                :items="optionItems(newcomerStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.conversionStatus"
                :label="t('Conversion')"
                :items="optionItems(conversionStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.assigneeName"
                :label="t('Assignee')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.nextFollowUpAt"
                :label="t('Next follow-up')"
                type="datetime-local"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.preferredLanguage"
                :label="t('Preferred language')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.linkedMemberUserId"
                :label="t('Linked member user ID')"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="form.interest"
            :label="t('Interest')"
            :disabled="!canManage"
            rows="4"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            :disabled="!canSave || updateMutation.isPending.value"
            :loading="updateMutation.isPending.value"
          >
            {{ t("common.save") }}
          </v-btn>
        </v-form>

        <v-divider class="my-5" />

        <div class="text-subtitle-1 font-weight-bold">
          {{ t("Follow-up records") }}
        </div>
        <v-form class="mt-3" @submit.prevent="addFollowUp">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="followUpForm.status"
                :label="t('Status')"
                :items="optionItems(followUpStatusOptions)"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="followUpForm.plannedAt"
                :label="t('Planned time')"
                type="datetime-local"
                :disabled="!canManage"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="followUpForm.note"
            :label="t('Follow-up note')"
            :disabled="!canManage"
            rows="3"
            density="comfortable"
            variant="outlined"
          />
          <v-btn
            type="submit"
            color="primary"
            variant="tonal"
            :disabled="!canCreateFollowUp || followUpMutation.isPending.value"
            :loading="followUpMutation.isPending.value"
          >
            {{ t("Add follow-up") }}
          </v-btn>
        </v-form>

        <v-progress-linear
          v-if="followUpsQuery.isPending.value"
          class="mt-4"
          color="primary"
          indeterminate
        />
        <v-list v-else class="mt-4" lines="three">
          <v-list-item v-if="followUps.length === 0">
            <v-list-item-title>{{ t("No follow-ups recorded.") }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-for="followUp in followUps" :key="followUp.id">
            <v-list-item-title>
              {{ followUp.authorName || t("Admin") }} · {{ t(followUp.status) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ followUp.note }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
