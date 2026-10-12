<script setup lang="ts">
import type {
  AdminBibleVerseNote,
  BibleVerseNoteAuthorType,
  BibleVerseNoteStatus
} from "@mbc/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { requireSelected } from "@/core/actions/action_guard";
import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  hideBibleVerseNote,
  listBibleVerseNotes,
  restoreBibleVerseNote
} from "@/core/api/bible_verse_notes";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

const queryClient = useQueryClient();
const authStore = useAdminAuthStore();
const { optionItems, t } = useI18n();
const selectedNote = ref<AdminBibleVerseNote | null>(null);
const drawer = ref(false);
const mutationErrorMessage = ref("");

const filters = reactive({
  query: "",
  verseId: "",
  status: "" as BibleVerseNoteStatus | "",
  authorType: "" as BibleVerseNoteAuthorType | ""
});

const form = reactive({
  hiddenReason: ""
});

const activeFilters = computed(() => ({ ...filters, limit: 100 }));
const notesQuery = useQuery({
  queryKey: ["bible-verse-notes", activeFilters],
  queryFn: () => listBibleVerseNotes(activeFilters.value)
});

const hideMutation = useMutation({
  onMutate: clearMutationError,
  mutationFn: () => {
    const note = requireSelected(selectedNote.value, t("No note selected."));
    if (!canModerate.value) {
      throw new Error(t("Bible note moderation access required"));
    }
    return hideBibleVerseNote(note.id, {
      hiddenReason: form.hiddenReason.trim() || undefined
    });
  },
  onSuccess: refreshSelected,
  onError: captureMutationError
});

const restoreMutation = useMutation({
  onMutate: clearMutationError,
  mutationFn: () => {
    const note = requireSelected(selectedNote.value, t("No note selected."));
    if (!canModerate.value) {
      throw new Error(t("Bible note moderation access required"));
    }
    return restoreBibleVerseNote(note.id);
  },
  onSuccess: refreshSelected,
  onError: captureMutationError
});

const notes = computed(() => notesQuery.data.value ?? []);
const canModerate = computed(() => authStore.can("bible_notes:moderate"));
const publishedCount = computed(
  () => notes.value.filter((note) => note.status === "published").length
);
const hiddenCount = computed(
  () => notes.value.filter((note) => note.status === "hidden").length
);
const queryErrorMessage = computed(() =>
  notesQuery.error.value
    ? formatApiErrorMessage(notesQuery.error.value, t("common.error"))
    : ""
);

function openNote(note: AdminBibleVerseNote) {
  clearMutationError();
  selectedNote.value = note;
  form.hiddenReason = note.hiddenReason ?? "";
  drawer.value = true;
}

async function refreshSelected(note: AdminBibleVerseNote) {
  openNote(note);
  await queryClient.invalidateQueries({ queryKey: ["bible-verse-notes"] });
}

function clearMutationError() {
  mutationErrorMessage.value = "";
}

function captureMutationError(error: unknown) {
  mutationErrorMessage.value = formatApiErrorMessage(error, t("common.error"));
}

function statusColor(status: BibleVerseNoteStatus) {
  if (status === "published") {
    return "success";
  }
  if (status === "hidden") {
    return "error";
  }
  return "secondary";
}

function hideSelectedNote() {
  if (
    !selectedNote.value ||
    selectedNote.value.status !== "published" ||
    !canModerate.value ||
    hideMutation.isPending.value
  ) {
    return;
  }
  hideMutation.mutate();
}

function restoreSelectedNote() {
  if (
    !selectedNote.value ||
    selectedNote.value.status !== "hidden" ||
    !canModerate.value ||
    restoreMutation.isPending.value
  ) {
    return;
  }
  restoreMutation.mutate();
}
</script>

<template>
  <div>
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
      <div>
        <div class="page-title">{{ t("nav.bibleNotes") }}</div>
        <div class="page-subtitle">
          {{ t("bibleNotes.pageSubtitle") }}
        </div>
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        :loading="notesQuery.isFetching.value"
        @click="notesQuery.refetch()"
      >
        {{ t("common.refresh") }}
      </v-btn>
    </div>

    <v-alert
      v-if="queryErrorMessage"
      type="error"
      variant="tonal"
      density="comfortable"
      class="mt-4"
    >
      {{ queryErrorMessage }}
    </v-alert>

    <v-row class="mt-5" dense>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Loaded notes") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ notes.length }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Published") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ publishedCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ t("Hidden") }}
          </div>
          <div class="text-h5 font-weight-bold mt-1">{{ hiddenCount }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-progress-linear
        v-if="notesQuery.isPending.value"
        indeterminate
        color="primary"
      />
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.query"
              :label="t('Search')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="notesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-text-field
              v-model="filters.verseId"
              :label="t('Verse ID')"
              density="compact"
              variant="outlined"
              hide-details
              @keyup.enter="notesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :label="t('Status')"
              :items="optionItems(['', 'published', 'hidden', 'deleted'])"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="notesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.authorType"
              :label="t('Author')"
              :items="optionItems(['', 'member', 'external'])"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="notesQuery.refetch()"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              block
              color="primary"
              variant="tonal"
              :loading="notesQuery.isFetching.value"
              @click="notesQuery.refetch()"
            >
              {{ t("common.search") }}
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <v-divider />

      <v-table>
        <thead>
          <tr>
            <th>{{ t("Verse") }}</th>
            <th>{{ t("Author") }}</th>
            <th>{{ t("Content") }}</th>
            <th>{{ t("Status") }}</th>
            <th>{{ t("common.updated") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="note in notes"
            :key="note.id"
            class="cursor-pointer"
            @click="openNote(note)"
          >
            <td class="font-weight-bold">{{ note.verseId }}</td>
            <td>
              <div>{{ note.authorDisplayName }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ t(note.authorType) }}
              </div>
            </td>
            <td class="text-truncate" style="max-width: 420px">
              {{ note.content }}
            </td>
            <td>
              <v-chip size="small" :color="statusColor(note.status)" variant="tonal">
                {{ t(note.status) }}
              </v-chip>
            </td>
            <td>{{ new Date(note.updatedAt).toLocaleDateString() }}</td>
          </tr>
          <tr v-if="!notesQuery.isPending.value && notes.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-8">
              {{ t("bibleNotes.empty") }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-navigation-drawer v-model="drawer" location="right" temporary width="520">
      <div v-if="selectedNote" class="pa-5">
        <div class="d-flex align-center justify-space-between ga-3">
          <div>
            <div class="text-h6 font-weight-bold">{{ selectedNote.verseId }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedNote.authorDisplayName }} · {{ t(selectedNote.authorType) }}
            </div>
          </div>
          <v-chip :color="statusColor(selectedNote.status)" variant="tonal">
            {{ t(selectedNote.status) }}
          </v-chip>
        </div>

        <v-card class="mt-5 pa-4" variant="tonal">
          <div class="text-body-1">{{ selectedNote.content }}</div>
        </v-card>

        <v-textarea
          v-model="form.hiddenReason"
          class="mt-5"
          :label="t('Moderation note')"
          rows="4"
          variant="outlined"
        />

        <v-alert
          v-if="mutationErrorMessage"
          class="mt-4"
          type="error"
          variant="tonal"
          density="comfortable"
        >
          {{ mutationErrorMessage }}
        </v-alert>

        <div class="d-flex justify-end ga-3 mt-5">
          <v-btn variant="text" @click="drawer = false">
            {{ t("common.close") }}
          </v-btn>
          <v-btn
            v-if="selectedNote.status === 'hidden'"
            color="primary"
            variant="tonal"
            :disabled="!canModerate || restoreMutation.isPending.value"
            :loading="restoreMutation.isPending.value"
            @click="restoreSelectedNote"
          >
            {{ t("Restore") }}
          </v-btn>
          <v-btn
            v-else-if="selectedNote.status === 'published'"
            color="error"
            variant="tonal"
            :disabled="!canModerate || hideMutation.isPending.value"
            :loading="hideMutation.isPending.value"
            @click="hideSelectedNote"
          >
            {{ t("Hide") }}
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>
