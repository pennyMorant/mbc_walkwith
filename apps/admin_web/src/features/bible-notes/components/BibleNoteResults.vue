<script setup lang="ts">
import type {
  AdminBibleVerseNote,
  BibleVerseNoteStatus
} from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";

defineProps<{
  notes: AdminBibleVerseNote[];
  pending: boolean;
  statusColor: (status: BibleVerseNoteStatus) => string;
}>();
defineEmits<{ open: [note: AdminBibleVerseNote] }>();

const { t } = useI18n();
</script>

<template>
  <v-progress-linear v-if="pending" indeterminate color="primary" />
  <template v-else>
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
          <td>{{ new Date(note.updatedAt).toLocaleDateString() }}</td>
        </tr>
        <tr v-if="notes.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-8">
            {{ t("bibleNotes.empty") }}
          </td>
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
          <span>{{ t(note.authorType) }} · {{ new Date(note.updatedAt).toLocaleDateString() }}</span>
          <span class="bible-note-record__content">{{ note.content }}</span>
        </span>
        <v-chip size="small" :color="statusColor(note.status)" variant="tonal">
          {{ t(note.status) }}
        </v-chip>
        <v-icon icon="mdi-chevron-right" size="20" />
      </button>
      <div v-if="notes.length === 0" class="bible-note-record-empty">
        {{ t("bibleNotes.empty") }}
      </div>
    </div>
  </template>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.note-content { max-width: 420px; }
.bible-note-record { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 10px; border: 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); padding: 14px 16px; color: inherit; background: transparent; text-align: left; }
.bible-note-record__main { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.bible-note-record__main span { overflow: hidden; color: rgba(var(--v-theme-on-surface), 0.62); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.bible-note-record__content { color: rgba(var(--v-theme-on-surface), 0.78) !important; font-size: 13px !important; }
.bible-note-record-empty { padding: 28px 16px; color: rgba(var(--v-theme-on-surface), 0.62); text-align: center; }
</style>
