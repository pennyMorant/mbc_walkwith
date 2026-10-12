import { appError } from "../../shared/http/app-error.js";

export function bibleVerseNoteAuthorRequired() {
  return appError({
    code: "bible_verse_note_author_required",
    category: "authentication_required",
    sourceLayer: "feature",
    statusCode: 401,
    message: "A member session or external user id is required.",
    recoverable: true,
    retryable: false,
    nextAction: "provide_identity"
  });
}

export function bibleVerseNoteNotFound(noteId: string) {
  return appError({
    code: "bible_verse_note_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Bible verse note not found.",
    recoverable: true,
    retryable: false,
    evidence: { noteId },
    nextAction: "refresh"
  });
}

export function bibleVerseNotePermissionDenied(noteId: string) {
  return appError({
    code: "bible_verse_note_permission_denied",
    category: "permission_denied",
    sourceLayer: "feature",
    statusCode: 403,
    message: "You can only edit your own verse note.",
    recoverable: true,
    retryable: false,
    evidence: { noteId },
    nextAction: "refresh"
  });
}

export function bibleVerseNoteVerseInvalid(verseId: string) {
  return appError({
    code: "bible_verse_note_verse_invalid",
    category: "validation_error",
    sourceLayer: "domain",
    statusCode: 400,
    message: "Verse reference does not match the verse id.",
    recoverable: true,
    retryable: false,
    evidence: { verseId },
    nextAction: "review_request"
  });
}
