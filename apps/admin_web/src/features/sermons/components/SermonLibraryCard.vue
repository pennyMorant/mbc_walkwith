<script setup lang="ts">
import type { Sermon } from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminPanelHeader from "@/core/ui/AdminPanelHeader.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";
import { sermonStatusColor } from "../sermon_pipeline";

type SermonLibraryFilters = {
  query: string;
  status: string;
  speaker: string;
  series: string;
  topic: string;
};

defineProps<{
  filters: SermonLibraryFilters;
  sermons: Sermon[];
  pending: boolean;
  fetching: boolean;
  error: unknown;
  hasMore: boolean;
  topicOptions: string[];
  topicsLoading: boolean;
}>();

const emit = defineEmits<{
  search: [];
  loadMore: [];
  open: [sermon: Sermon];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card>
    <div class="pa-5">
      <AdminPanelHeader
        :title="t('Sermon library')"
        :subtitle="t('sermons.librarySubtitle')"
      >
        <template #actions>
          <v-chip>{{ sermons.length }}</v-chip>
        </template>
      </AdminPanelHeader>
      <v-row dense class="mt-4">
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('search')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="
              optionItems([
                '',
                'draft',
                'processing',
                'needs_review',
                'published',
                'archived',
                'failed'
              ])
            "
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="emit('search')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.speaker"
            :label="t('Speaker')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('search')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.series"
            :label="t('Series')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="emit('search')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-combobox
            v-model="filters.topic"
            :label="t('Topic')"
            :items="topicOptions"
            :loading="topicsLoading"
            density="compact"
            variant="outlined"
            clearable
            hide-details
            @update:model-value="emit('search')"
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="emit('search')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <v-divider />

    <v-progress-linear v-if="pending" indeterminate color="primary" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>

    <v-empty-state
      v-else-if="sermons.length === 0"
      icon="mdi-microphone-off"
      :title="t('sermons.noResults')"
    />

    <template v-else>
      <AdminResponsiveTable>
        <template #desktop>
      <v-table density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Title") }}</th>
            <th>{{ t("Speaker") }}</th>
            <th>{{ t("Date") }}</th>
            <th>{{ t("Audio") }}</th>
            <th>{{ t("Status") }}</th>
          </tr>
        </thead>
        <tbody>
          <AdminTableActionRow
            v-for="sermon in sermons"
            :key="sermon.id"
            @activate="emit('open', sermon)"
          >
            <td>
              <div class="font-weight-bold">{{ sermon.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ sermon.primaryReference || t("No Scripture tagged") }}
              </div>
            </td>
            <td>{{ sermon.speaker }}</td>
            <td>{{ sermon.sermonDate }}</td>
            <td>
              <v-chip
                size="small"
                :color="sermon.audio.status === 'ready' ? 'success' : 'grey'"
                variant="tonal"
              >
                {{ t(sermon.audio.status) }}
              </v-chip>
            </td>
            <td>
              <v-chip size="small" :color="sermonStatusColor(sermon.status)">
                {{ t(sermon.status) }}
              </v-chip>
            </td>
          </AdminTableActionRow>
        </tbody>
      </v-table>

        </template>
        <template #mobile>
      <div>
        <AdminMobileRecord
          v-for="sermon in sermons"
          :key="sermon.id"
          @activate="emit('open', sermon)"
        >
          <strong>{{ sermon.title }}</strong>
          <span>{{ sermon.speaker }} · {{ sermon.sermonDate }}</span>
          <span>{{ sermon.primaryReference || t("No Scripture tagged") }}</span>
          <template #trailing>
            <div class="d-flex flex-column align-end ga-1">
              <v-chip
                size="small"
                :color="sermonStatusColor(sermon.status)"
                variant="tonal"
              >
                {{ t(sermon.status) }}
              </v-chip>
              <v-chip
                size="small"
                :color="sermon.audio.status === 'ready' ? 'success' : 'grey'"
                variant="tonal"
              >
                {{ t(sermon.audio.status) }}
              </v-chip>
            </div>
          </template>
        </AdminMobileRecord>
      </div>
        </template>
      </AdminResponsiveTable>
    </template>

    <div v-if="hasMore" class="pa-4 d-flex justify-center">
      <v-btn variant="tonal" :loading="fetching" @click="emit('loadMore')">
        {{ t("Load more") }}
      </v-btn>
    </div>
  </v-card>
</template>
