<script setup lang="ts">
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import BibleKnowledgeEntityEditor from "../components/BibleKnowledgeEntityEditor.vue";
import BibleKnowledgeEntityListCard from "../components/BibleKnowledgeEntityListCard.vue";
import { useBibleKnowledgePage } from "../composables/use_bible_knowledge_page";

const {
  addSection,
  applyFilters,
  canManage,
  canSave,
  commandErrorMessage,
  deleteCurrentEntity,
  deleteMutation,
  drawer,
  entities,
  entitiesQuery,
  filters,
  form,
  initialErrorMessage,
  moveSection,
  newEntity,
  openEntity,
  refreshErrorMessage,
  removeSection,
  saveEntity,
  saveMutation,
  selectedEntity,
  t
} = useBibleKnowledgePage();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.bibleKnowledge')" :subtitle="t('bible.entitySubtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="entitiesQuery.isFetching.value"
          @refresh="entitiesQuery.refetch()"
        />
        <v-btn
          v-if="canManage"
          color="primary"
          prepend-icon="mdi-plus"
          @click="newEntity"
        >
          {{ t("New entity") }}
        </v-btn>
      </template>
    </AdminPageHeader>

    <BibleKnowledgeEntityListCard
      v-model="filters"
      :entities="entities"
      :is-pending="entitiesQuery.isPending.value"
      :is-fetching="entitiesQuery.isFetching.value"
      :error-message="initialErrorMessage"
      :refresh-error-message="refreshErrorMessage"
      @apply-filters="applyFilters"
      @retry="entitiesQuery.refetch()"
      @open-entity="openEntity"
    />

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="560">
      <div class="pa-5">
        <AdminDrawerHeader
          :title="selectedEntity ? selectedEntity.name : t('New entity')"
          :close-label="t('common.close')"
          @close="drawer = false"
        />
        <BibleKnowledgeEntityEditor
          v-model="form"
          :selected-entity="selectedEntity"
          :can-manage="canManage"
          :can-save="canSave"
          :saving="saveMutation.isPending.value"
          :deleting="deleteMutation.isPending.value"
          :error-message="commandErrorMessage"
          @add-section="addSection"
          @move-section="moveSection"
          @remove-section="removeSection"
          @save="saveEntity"
          @delete="deleteCurrentEntity"
        />
      </div>
    </AdminResponsiveDrawer>
  </div>
</template>
