<script setup lang="ts">
import type { BibleKnowledgeEntity } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminFilterToolbar from "@/core/ui/AdminFilterToolbar.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";

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
    <AdminFilterToolbar class="pa-5" @apply="$emit('applyFilters')">
      <v-text-field
        v-model="filters.query"
        class="admin-filter-control"
        :label="t('Search')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="filters.type"
        class="admin-filter-control"
        :label="t('Type')"
        :items="optionItems(['', 'person', 'place'])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="filters.status"
        class="admin-filter-control"
        :label="t('Status')"
        :items="optionItems(['', 'draft', 'processing', 'needs_review', 'published', 'archived', 'failed'])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-select
        v-model="filters.translationId"
        class="admin-filter-control"
        :label="t('Translation')"
        :items="optionItems(['web', 'cuvs', 'cuvt'])"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-text-field
        v-model="filters.locale"
        class="admin-filter-control"
        :label="t('Locale')"
        density="compact"
        variant="outlined"
        hide-details
      />
      <template #actions>
        <v-btn type="submit" variant="tonal">
          {{ t("common.go") }}
        </v-btn>
      </template>
    </AdminFilterToolbar>
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
      <AdminResponsiveTable>
        <template #desktop>
      <v-table density="comfortable">
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
        </template>
        <template #mobile>
      <div>
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
        </template>
      </AdminResponsiveTable>
    </AdminDataState>
  </v-card>
</template>
