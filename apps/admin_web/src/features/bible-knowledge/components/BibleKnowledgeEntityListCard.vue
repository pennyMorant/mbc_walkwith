<script setup lang="ts">
import type { BibleKnowledgeEntity } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";

import type { BibleKnowledgeFilterForm } from "../bible_knowledge_workspace_models";

const filters = defineModel<BibleKnowledgeFilterForm>({ required: true });
defineProps<{
  entities: BibleKnowledgeEntity[];
  isPending: boolean;
  isFetching: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
}>();
defineEmits<{
  applyFilters: [];
  openEntity: [entity: BibleKnowledgeEntity];
  retry: [];
}>();

const { optionItems, t } = useI18n();
</script>

<template>
  <v-card class="mt-6">
    <div class="pa-5">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.query"
            :label="t('Search')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="$emit('applyFilters')"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.type"
            :label="t('Type')"
            :items="optionItems(['', 'person', 'place'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="optionItems(['', 'draft', 'processing', 'needs_review', 'published', 'archived', 'failed'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.translationId"
            :label="t('Translation')"
            :items="optionItems(['web', 'cuvs', 'cuvt'])"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.locale"
            :label="t('Locale')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="$emit('applyFilters')"
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="$emit('applyFilters')">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <v-divider />

    <AdminDataState
      :pending="(isPending || isFetching) && entities.length === 0"
      :error-message="entities.length === 0 ? errorMessage : ''"
      :empty="!isFetching && !errorMessage && !refreshErrorMessage && entities.length === 0"
      :empty-title="t('nav.searchEmpty')"
      empty-icon="mdi-book-search-outline"
      :retry-label="t('common.refresh')"
      @retry="$emit('retry')"
    >
      <v-progress-linear
        v-if="isFetching && entities.length > 0"
        indeterminate
        color="primary"
      />
      <AdminRetryAlert
        :message="refreshErrorMessage"
        :retry-label="t('common.refresh')"
        class="ma-4"
        @retry="$emit('retry')"
      />
      <v-table class="d-none d-md-block" density="comfortable">
        <thead>
          <tr>
            <th>{{ t("Name") }}</th>
            <th>{{ t("Type") }}</th>
            <th>{{ t("Category") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("Aliases") }}</th>
          </tr>
        </thead>
        <tbody>
          <AdminTableActionRow
            v-for="entity in entities"
            :key="`${entity.translationId}:${entity.locale}:${entity.id}`"
            @activate="$emit('openEntity', entity)"
          >
            <td>
              <div class="font-weight-bold">{{ entity.name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ entity.id }}
              </div>
            </td>
            <td>{{ t(entity.type) }}</td>
            <td>{{ entity.category }}</td>
            <td>
              <v-chip size="small">{{ t(entity.status) }}</v-chip>
            </td>
            <td>{{ entity.aliases.length }}</td>
          </AdminTableActionRow>
        </tbody>
      </v-table>
      <div class="d-md-none">
        <AdminMobileRecord
          v-for="entity in entities"
          :key="`${entity.translationId}:${entity.locale}:${entity.id}`"
          @activate="$emit('openEntity', entity)"
        >
          <strong>{{ entity.name }}</strong>
          <span>{{ t(entity.type) }} · {{ entity.category }}</span>
          <span>{{ entity.id }} · {{ t("Aliases") }}: {{ entity.aliases.length }}</span>
          <template #trailing>
            <v-chip size="small">{{ t(entity.status) }}</v-chip>
          </template>
        </AdminMobileRecord>
      </div>
    </AdminDataState>
  </v-card>
</template>
