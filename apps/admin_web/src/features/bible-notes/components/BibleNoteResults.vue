<script setup lang="ts">
import type {
  AdminBibleVerseNote,
  BibleVerseNoteStatus
} from "@mbc/api-contracts";

import { formatAdminDate } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";

defineProps<{
  notes: AdminBibleVerseNote[];
  pending: boolean;
  fetching: boolean;
  errorMessage: string;
  refreshErrorMessage: string;
  statusColor: (status: BibleVerseNoteStatus) => string;
}>();
defineEmits<{ open: [note: AdminBibleVerseNote]; retry: [] }>();

const { locale, t } = useI18n();
</script>

<template>
  <AdminDataState
    :pending="(pending || fetching) && notes.length === 0"
    :error-message="notes.length === 0 ? errorMessage : ''"
    :empty="!fetching && !errorMessage && !refreshErrorMessage && notes.length === 0"
    :empty-title="t('bibleNotes.empty')"
    empty-icon="mdi-note-off-outline"
    :retry-label="t('common.refresh')"
    @retry="$emit('retry')"
  >
    <v-progress-linear
      v-if="fetching && notes.length > 0"
      indeterminate
      color="primary"
    />
    <v-alert
      v-if="refreshErrorMessage"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3">
        <span>{{ refreshErrorMessage }}</span>
        <v-btn
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          @click="$emit('retry')"
        >
          {{ t("common.refresh") }}
        </v-btn>
      </div>
    </v-alert>
    <v-table class="d-none d-md-block" hover>
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
          @click="$emit('open', note)"
        >
          <td class="font-weight-bold">{{ note.verseId }}</td>
          <td>
            <div>{{ note.authorDisplayName }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t(note.authorType) }}
            </div>
          </td>
          <td class="text-truncate note-content">{{ note.content }}</td>
          <td>
            <v-chip size="small" :color="statusColor(note.status)" variant="tonal">
              {{ t(note.status) }}
            </v-chip>
          </td>
          <td>{{ formatAdminDate(note.updatedAt, locale) }}</td>
        </tr>
      </tbody>
    </v-table>

    <div class="d-md-none">
      <button
        v-for="note in notes"
        :key="note.id"
        class="bible-note-record"
        type="button"
        @click="$emit('open', note)"
      >
        <span class="bible-note-record__main">
          <strong>{{ note.verseId }} · {{ note.authorDisplayName }}</strong>
          <span>{{ t(note.authorType) }} · {{ formatAdminDate(note.updatedAt, locale) }}</span>
          <span class="bible-note-record__content">{{ note.content }}</span>
        </span>
        <v-chip size="small" :color="statusColor(note.status)" variant="tonal">
          {{ t(note.status) }}
        </v-chip>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
    </div>
  </AdminDataState>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.note-content { max-width: 420px; }
.bible-note-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.bible-note-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.bible-note-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.bible-note-record__content { color: rgba(var(--v-theme-on-surface), 0.78) !important; font-size: 13px !important; }
</style>
