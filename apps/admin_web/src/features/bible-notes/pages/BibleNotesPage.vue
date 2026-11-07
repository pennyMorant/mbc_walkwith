<script setup lang="ts">
import AdminMetricGrid from "@/core/ui/AdminMetricGrid.vue";
import AdminPageHeader from "@/core/ui/AdminPageHeader.vue";
import AdminRefreshButton from "@/core/ui/AdminRefreshButton.vue";
import AdminResponsiveDrawer from "@/core/ui/AdminResponsiveDrawer.vue";

import BibleNoteFilterCard from "../components/BibleNoteFilterCard.vue";
import BibleNoteModerationDrawer from "../components/BibleNoteModerationDrawer.vue";
import BibleNoteResults from "../components/BibleNoteResults.vue";
import { useBibleNotesPage } from "../composables/use_bible_notes_page";

const {
  applyFilters,
  bibleNoteStatusColor,
  canModerate,
  commandErrorMessage,
  drawer,
  filters,
  form,
  hasLoadedNotes,
  hideSelectedNote,
  hiding,
  initialErrorMessage,
  notes,
  notesQuery,
  openNote,
  refreshErrorMessage,
  restoreSelectedNote,
  restoring,
  selectedNote,
  summaryMetrics,
  t
} = useBibleNotesPage();
</script>

<template>
  <div>
    <AdminPageHeader :title="t('nav.bibleNotes')" :subtitle="t('bibleNotes.pageSubtitle')">
      <template #actions>
        <AdminRefreshButton
          :label="t('common.refresh')"
          :loading="notesQuery.isFetching.value"
          @refresh="notesQuery.refetch()"
        />
      </template>
    </AdminPageHeader>

    <AdminMetricGrid v-if="hasLoadedNotes" :items="summaryMetrics" />

    <v-card class="mt-6">
      <BibleNoteFilterCard
        v-model="filters"
        :fetching="notesQuery.isFetching.value"
        @apply="applyFilters"
      />
      <v-divider />
      <BibleNoteResults
        :notes="notes"
        :pending="notesQuery.isPending.value"
        :fetching="notesQuery.isFetching.value"
        :error-message="initialErrorMessage"
        :refresh-error-message="refreshErrorMessage"
        :status-color="bibleNoteStatusColor"
        @open="openNote"
        @retry="notesQuery.refetch()"
      />
    </v-card>

    <AdminResponsiveDrawer v-model="drawer" :desktop-width="520">
      <BibleNoteModerationDrawer
        v-if="selectedNote"
        v-model="form"
        :note="selectedNote"
        :can-moderate="canModerate"
        :hiding="hiding"
        :restoring="restoring"
        :error-message="commandErrorMessage"
        :status-color="bibleNoteStatusColor"
        @close="drawer = false"
        @hide="hideSelectedNote"
        @restore="restoreSelectedNote"
      />
    </AdminResponsiveDrawer>
  </div>
</template>
