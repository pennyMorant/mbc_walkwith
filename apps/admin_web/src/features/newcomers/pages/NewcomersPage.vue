<script setup lang="ts">
import { useI18n } from "@/core/i18n/i18n";
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
  errorMessage,
  filters,
  followUpForm,
  followUpMutation,
  followUps,
  followUpsQuery,
  form,
  newCount,
  newcomers,
  newcomersQuery,
  openNewcomer,
  saveNewcomer,
  selectedNewcomer,
  updateMutation
} = useNewcomerPage();
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.newcomers") }}</div>
        <div class="page-subtitle">
          {{ t("newcomers.pageSubtitle") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        :loading="newcomersQuery.isFetching.value"
        prepend-icon="mdi-refresh"
        @click="newcomersQuery.refetch()"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
      {{ errorMessage }}
    </v-alert>

    <v-row class="mt-5" dense>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("New newcomer profiles") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ newCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("Active follow-up") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ assignedCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4" variant="outlined">
          <div class="text-caption text-medium-emphasis">
            {{ t("In discipleship") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ discipleshipCount }}</div>
        </v-card>
      </v-col>
    </v-row>

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
      <v-progress-linear
        v-if="newcomersQuery.isPending.value"
        indeterminate
        color="primary"
      />
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Display name") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Assignee") }}</th>
            <th>{{ t("Source") }}</th>
            <th>{{ t("Next follow-up") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="newcomers.length === 0">
            <td colspan="5" class="text-medium-emphasis">
              {{ t("No newcomers match the current filters.") }}
            </td>
          </tr>
          <tr
            v-for="newcomer in newcomers"
            :key="newcomer.id"
            class="cursor-pointer"
            @click="openNewcomer(newcomer)"
          >
            <td>
              <div class="font-weight-bold">{{ newcomer.displayName }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ newcomerContactLine(newcomer) || t("common.notSet") }}
              </div>
            </td>
            <td>
              <v-chip
                size="small"
                :color="newcomerStatusColor(newcomer.status)"
              >
                {{ t(newcomer.status) }}
              </v-chip>
            </td>
            <td>{{ newcomer.assigneeName || t("common.notSet") }}</td>
            <td>{{ newcomer.source || t("common.notSet") }}</td>
            <td>{{ newcomer.nextFollowUpAt || t("Not scheduled") }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-navigation-drawer v-model="drawer" location="right" temporary width="640">
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
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
