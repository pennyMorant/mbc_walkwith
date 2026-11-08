<script setup lang="ts">
import type {
  AdminBibleVerseNote,
  BibleVerseNoteStatus
} from "@mbc/api-contracts";

import { formatAdminDate } from "@/core/i18n/date_time";
import { useI18n } from "@/core/i18n/i18n";
import AdminDataState from "@/core/ui/AdminDataState.vue";
import AdminMobileRecord from "@/core/ui/AdminMobileRecord.vue";
import AdminRetryAlert from "@/core/ui/AdminRetryAlert.vue";
import AdminResponsiveTable from "@/core/ui/AdminResponsiveTable.vue";
import AdminTableActionRow from "@/core/ui/AdminTableActionRow.vue";

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
    <AdminRetryAlert
      :message="refreshErrorMessage"
      :retry-label="t('common.refresh')"
      class="ma-4"
      @retry="$emit('retry')"
    />
    <AdminResponsiveTable>
      <template #desktop>
    <v-table hover>
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
        <AdminTableActionRow
          v-for="note in notes"
          :key="note.id"
          @activate="$emit('open', note)"
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
        </AdminTableActionRow>
      </tbody>
    </v-table>

      </template>
      <template #mobile>
    <div>
      <AdminMobileRecord
        v-for="note in notes"
        :key="note.id"
        @activate="$emit('open', note)"
      >
        <strong>{{ note.verseId }} · {{ note.authorDisplayName }}</strong>
        <span>{{ t(note.authorType) }} · {{ formatAdminDate(note.updatedAt, locale) }}</span>
        <span class="bible-note-record__content">{{ note.content }}</span>
        <template #trailing>
          <v-chip size="small" :color="statusColor(note.status)" variant="tonal">
            {{ t(note.status) }}
          </v-chip>
        </template>
      </AdminMobileRecord>
    </div>
      </template>
    </AdminResponsiveTable>
  </AdminDataState>
</template>

<style scoped>
.note-content { max-width: 420px; }
.bible-note-record__content { color: rgba(var(--v-theme-on-surface), 0.78) !important; font-size: 13px !important; }
</style>
