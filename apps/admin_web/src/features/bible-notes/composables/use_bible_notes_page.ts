import type { AdminBibleVerseNote } from "@mbc/api-contracts";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, reactive, ref } from "vue";

import { formatApiErrorMessage } from "@/core/api/api_errors";
import {
  hideBibleVerseNote,
  restoreBibleVerseNote
} from "@/core/api/bible_verse_notes";
import { useAdminAuthStore } from "@/core/auth/auth_store";
import { useI18n } from "@/core/i18n/i18n";

import {
  bibleNoteCommandTargetsSelection,
  bibleNoteStatusColor,
  createBibleNoteModerationForm,
  fillBibleNoteModerationForm
} from "../bible_note_workspace_models";
import { useBibleNoteQuery } from "./use_bible_note_query";

type ModerationIntent =
  | { type: "hide"; noteId: string; hiddenReason: string | undefined }
  | { type: "restore"; noteId: string };

export function useBibleNotesPage() {
  const queryClient = useQueryClient();
  const authStore = useAdminAuthStore();
  const { t } = useI18n();
  const drawer = ref(false);
  const selectedNote = ref<AdminBibleVerseNote | null>(null);
  const commandErrorMessage = ref("");
  const form = reactive(createBibleNoteModerationForm());
  const query = useBibleNoteQuery();
  const canModerate = computed(() => authStore.can("bible_notes:moderate"));
  const initialErrorMessage = queryErrorMessage(
    query.initialError,
    "common.error"
  );
  const refreshErrorMessage = queryErrorMessage(
    query.refreshError,
    "bibleNotes.refreshFailed"
  );

  const moderationMutation = useMutation({
    mutationFn: (intent: ModerationIntent) =>
      intent.type === "hide"
        ? hideBibleVerseNote(intent.noteId, {
            hiddenReason: intent.hiddenReason
          })
        : restoreBibleVerseNote(intent.noteId),
    onSuccess: async (note, intent) => {
      if (commandTargetsCurrentDrawer(intent.noteId)) openNote(note);
      await invalidateNotes();
    },
    onError: (error, intent) => {
      if (commandTargetsCurrentDrawer(intent.noteId)) {
        commandErrorMessage.value = formatApiErrorMessage(
          error,
          t("common.error")
        );
      }
    }
  });

  const activeCommandType = computed(
    () => moderationMutation.variables.value?.type ?? null
  );
  const hiding = computed(
    () =>
      moderationMutation.isPending.value && activeCommandType.value === "hide"
  );
  const restoring = computed(
    () =>
      moderationMutation.isPending.value &&
      activeCommandType.value === "restore"
  );
  const hasLoadedNotes = computed(
    () => query.notesQuery.data.value !== undefined
  );
  const summaryMetrics = computed(() => [
    {
      id: "loaded",
      label: t("Loaded notes"),
      value: query.notes.value.length,
      icon: "mdi-note-text-outline",
      tone: "primary" as const
    },
    {
      id: "published",
      label: t("Published"),
      value: query.notes.value.filter((note) => note.status === "published")
        .length,
      icon: "mdi-eye-outline",
      tone: "success" as const
    },
    {
      id: "hidden",
      label: t("Hidden"),
      value: query.notes.value.filter((note) => note.status === "hidden")
        .length,
      icon: "mdi-eye-off-outline",
      tone: "warning" as const
    }
  ]);

  function queryErrorMessage(
    error: { value: unknown },
    fallbackKey: string
  ) {
    return computed(() =>
      error.value
        ? formatApiErrorMessage(error.value, t(fallbackKey))
        : ""
    );
  }

  function commandTargetsCurrentDrawer(noteId: string) {
    return (
      drawer.value &&
      bibleNoteCommandTargetsSelection(selectedNote.value?.id ?? null, noteId)
    );
  }

  function openNote(note: AdminBibleVerseNote) {
    commandErrorMessage.value = "";
    selectedNote.value = note;
    fillBibleNoteModerationForm(form, note);
    drawer.value = true;
  }

  function hideSelectedNote() {
    const note = selectedNote.value;
    if (
      !note ||
      note.status !== "published" ||
      !canModerate.value ||
      moderationMutation.isPending.value
    ) {
      return;
    }
    commandErrorMessage.value = "";
    moderationMutation.mutate({
      type: "hide",
      noteId: note.id,
      hiddenReason: form.hiddenReason.trim() || undefined
    });
  }

  function restoreSelectedNote() {
    const note = selectedNote.value;
    if (
      !note ||
      note.status !== "hidden" ||
      !canModerate.value ||
      moderationMutation.isPending.value
    ) {
      return;
    }
    commandErrorMessage.value = "";
    moderationMutation.mutate({ type: "restore", noteId: note.id });
  }

  function invalidateNotes() {
    return queryClient.invalidateQueries({ queryKey: ["bible-verse-notes"] });
  }

  return {
    applyFilters: query.applyFilters,
    bibleNoteStatusColor,
    canModerate,
    commandErrorMessage,
    drawer,
    filters: query.filters,
    form,
    hasLoadedNotes,
    hideSelectedNote,
    hiding,
    initialErrorMessage,
    notes: query.notes,
    notesQuery: query.notesQuery,
    openNote,
    refreshErrorMessage,
    restoreSelectedNote,
    restoring,
    selectedNote,
    summaryMetrics,
    t
  };
}
