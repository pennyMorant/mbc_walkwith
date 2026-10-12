<script setup lang="ts">
import type {
  BibleKnowledgeEntity,
  BibleKnowledgeEntityType
} from "@mbc/api-contracts";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  filters: {
    query: string;
    type: BibleKnowledgeEntityType | "";
    status: string;
    locale: string;
    translationId: "web" | "cuvs" | "cuvt";
  };
  entities: BibleKnowledgeEntity[];
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
  openEntity: (entity: BibleKnowledgeEntity) => void;
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
            @keyup.enter="refetch"
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
            @update:model-value="refetch"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.status"
            :label="t('Status')"
            :items="optionItems(['', 'draft', 'needs_review', 'published', 'archived'])"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="refetch"
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
            @update:model-value="refetch"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.locale"
            :label="t('Locale')"
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="refetch"
          />
        </v-col>
        <v-col cols="12" md="1">
          <v-btn block variant="tonal" @click="refetch">
            {{ t("common.go") }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <v-divider />
    <v-progress-linear v-if="isPending" indeterminate color="primary" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ formatApiErrorMessage(error, t("common.error")) }}
    </v-alert>
    <v-table v-else density="comfortable">
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
          :key="entity.id"
          class="cursor-pointer"
          @click="openEntity(entity)"
        >
          <td>
            <div class="font-weight-bold">{{ entity.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ entity.id }}</div>
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
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
