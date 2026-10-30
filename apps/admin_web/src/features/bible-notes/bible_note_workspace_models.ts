import type {
  AdminBibleVerseNote,
  BibleVerseNoteAuthorType,
  BibleVerseNoteStatus
} from "@mbc/api-contracts";

import type { BibleVerseNoteFilters } from "@/core/api/bible_verse_notes";

export type BibleNoteFilterForm = {
  query: string;
  verseId: string;
  status: BibleVerseNoteStatus | "";
  authorType: BibleVerseNoteAuthorType | "";
};

export type BibleNoteModerationForm = {
  hiddenReason: string;
};

export function createBibleNoteFilterForm(): BibleNoteFilterForm {
  return { query: "", verseId: "", status: "", authorType: "" };
}

export function bibleNoteFilterSnapshot(
  filters: BibleNoteFilterForm
): BibleVerseNoteFilters {
  return {
    query: filters.query.trim(),
    verseId: filters.verseId.trim(),
    status: filters.status,
    authorType: filters.authorType,
    limit: 100
  };
}

export function sameBibleNoteFilters(
  current: BibleVerseNoteFilters,
  next: BibleVerseNoteFilters
) {
  return (
    current.query === next.query &&
    current.verseId === next.verseId &&
    current.status === next.status &&
    current.authorType === next.authorType &&
    current.limit === next.limit
  );
}

export function createBibleNoteModerationForm(): BibleNoteModerationForm {
  return { hiddenReason: "" };
}

export function fillBibleNoteModerationForm(
  form: BibleNoteModerationForm,
  note: AdminBibleVerseNote
) {
  form.hiddenReason = note.hiddenReason ?? "";
}

export function bibleNoteStatusColor(status: BibleVerseNoteStatus) {
  if (status === "published") return "success";
  if (status === "hidden") return "error";
  return "secondary";
}

export function bibleNoteCommandTargetsSelection(
  selectedNoteId: string | null,
  commandNoteId: string
) {
  return selectedNoteId === commandNoteId;
}
