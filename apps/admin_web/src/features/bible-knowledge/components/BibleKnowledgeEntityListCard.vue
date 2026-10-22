<script setup lang="ts">
import type {
  BibleKnowledgeEntity,
  BibleKnowledgeEntityType
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

type BibleKnowledgeFilters = {
  query: string;
  type: BibleKnowledgeEntityType | "";
  status: BibleKnowledgeEntity["status"] | "";
  locale: string;
  translationId: "web" | "cuvs" | "cuvt";
};

const filters = defineModel<BibleKnowledgeFilters>({ required: true });
defineProps<{
  entities: BibleKnowledgeEntity[];
  isPending: boolean;
  isFetching: boolean;
  errorMessage: string;
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
            @update:model-value="$emit('applyFilters')"
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
            @update:model-value="$emit('applyFilters')"
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
            @update:model-value="$emit('applyFilters')"
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
      :empty="!isFetching && !errorMessage && entities.length === 0"
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
      <v-alert
        v-if="entities.length > 0 && errorMessage"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
          <span>{{ errorMessage }}</span>
          <v-btn
            color="error"
            prepend-icon="mdi-refresh"
            size="small"
            variant="tonal"
            @click="$emit('retry')"
          >
            {{ t("common.refresh") }}
          </v-btn>
        </div>
      </v-alert>
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
          <tr
            v-for="entity in entities"
            :key="`${entity.translationId}:${entity.locale}:${entity.id}`"
            class="cursor-pointer"
            @click="$emit('openEntity', entity)"
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
          </tr>
        </tbody>
      </v-table>
    </AdminDataState>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
