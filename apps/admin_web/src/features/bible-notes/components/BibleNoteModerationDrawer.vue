<script setup lang="ts">
import type { AdminBibleVerseNote, BibleVerseNoteStatus } from "@mbc/api-contracts";

import { useI18n } from "@/core/i18n/i18n";
import AdminDrawerHeader from "@/core/ui/AdminDrawerHeader.vue";

import type { BibleNoteModerationForm } from "../bible_note_workspace_models";

const form = defineModel<BibleNoteModerationForm>({ required: true });
defineProps<{
  note: AdminBibleVerseNote;
  canModerate: boolean;
  hiding: boolean;
  restoring: boolean;
  errorMessage: string;
  statusColor: (status: BibleVerseNoteStatus) => string;
}>();
defineEmits<{ close: []; hide: []; restore: [] }>();

const { t } = useI18n();
</script>

<template>
  <div class="pa-5">
    <AdminDrawerHeader
      :title="note.verseId"
      :subtitle="`${note.authorDisplayName} · ${t(note.authorType)}`"
      :close-label="t('common.close')"
      @close="$emit('close')"
    >
      <template #meta>
        <v-chip :color="statusColor(note.status)" variant="tonal">
          {{ t(note.status) }}
        </v-chip>
      </template>
    </AdminDrawerHeader>

    <v-card class="mt-5 pa-4" variant="tonal">
      <div class="text-body-1">{{ note.content }}</div>
    </v-card>

    <v-textarea
      v-model="form.hiddenReason"
      class="mt-5"
      :label="t('Moderation note')"
      rows="4"
      variant="outlined"
    />

    <v-alert
      v-if="errorMessage"
      class="mt-4"
      type="error"
      variant="tonal"
      density="comfortable"
    >
      {{ errorMessage }}
    </v-alert>

    <div class="d-flex justify-end ga-3 mt-5">
      <v-btn
        v-if="note.status === 'hidden'"
        color="primary"
        variant="tonal"
        :disabled="!canModerate || hiding || restoring"
        :loading="restoring"
        @click="$emit('restore')"
      >
        {{ t("Restore") }}
      </v-btn>
      <v-btn
        v-else-if="note.status === 'published'"
        color="error"
        variant="tonal"
        :disabled="!canModerate || hiding || restoring"
        :loading="hiding"
        @click="$emit('hide')"
      >
        {{ t("Hide") }}
      </v-btn>
    </div>
  </div>
</template>
