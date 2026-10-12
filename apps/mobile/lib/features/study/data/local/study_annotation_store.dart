import 'dart:convert';

import 'package:drift/drift.dart';

import '../../../../core/database/app_database.dart';
import '../../domain/study_annotation.dart';

class StudyAnnotationStore {
  const StudyAnnotationStore(this.database);

  final AppDatabase database;

  Future<Map<String, StudyVerseAnnotation>> getChapterAnnotations(
    String bookId,
    int chapter,
  ) async {
    final versePrefix = '$bookId.$chapter.%';
    final notesQuery = database.select(database.studyNotes)
      ..where((note) => note.verseId.like(versePrefix))
      ..where((note) => note.deleted.equals(false));
    final bookmarkQuery = database.select(database.studyBookmarks)
      ..where((bookmark) => bookmark.verseId.like(versePrefix))
      ..where((bookmark) => bookmark.deleted.equals(false));

    final notes = await notesQuery.get();
    final bookmarks = await bookmarkQuery.get();
    final annotations = <String, StudyVerseAnnotation>{};

    for (final note in notes) {
      annotations[note.verseId] = StudyVerseAnnotation(
        verseId: note.verseId,
        noteText: note.noteText,
        highlightColor: note.highlightColor,
      );
    }

    for (final bookmark in bookmarks) {
      final existing = annotations[bookmark.verseId];
      annotations[bookmark.verseId] =
          existing?.copyWith(isBookmarked: true) ??
          StudyVerseAnnotation(verseId: bookmark.verseId, isBookmarked: true);
    }

    return annotations;
  }

  Future<void> saveVerseNote({
    required String verseId,
    required String noteText,
  }) async {
    final cleanNoteText = noteText.trim();
    final existing = await _studyNoteByVerseId(verseId);
    await _upsertStudyNote(
      verseId: verseId,
      noteText: cleanNoteText,
      highlightColor: existing?.highlightColor,
    );
  }

  Future<void> setVerseHighlight({
    required String verseId,
    required String? highlightColor,
  }) async {
    final existing = await _studyNoteByVerseId(verseId);
    await _upsertStudyNote(
      verseId: verseId,
      noteText: existing?.noteText ?? '',
      highlightColor: highlightColor,
    );
  }

  Future<void> setVerseBookmark({
    required String verseId,
    required bool isBookmarked,
  }) async {
    final now = DateTime.now().toUtc();
    final id = _bookmarkId(verseId);
    await database
        .into(database.studyBookmarks)
        .insertOnConflictUpdate(
          StudyBookmarksCompanion.insert(
            id: id,
            verseId: verseId,
            dirty: const Value(true),
            deleted: Value(!isBookmarked),
            updatedAt: now,
          ),
        );
    await _enqueueSync(
      entityType: 'study_bookmark',
      entityId: id,
      action: isBookmarked ? 'upsert' : 'delete',
      payload: {'verseId': verseId, 'deleted': !isBookmarked},
    );
  }

  Future<StudyNote?> _studyNoteByVerseId(String verseId) {
    final query = database.select(database.studyNotes)
      ..where((note) => note.verseId.equals(verseId))
      ..limit(1);
    return query.getSingleOrNull();
  }

  Future<void> _upsertStudyNote({
    required String verseId,
    required String noteText,
    required String? highlightColor,
  }) async {
    final now = DateTime.now().toUtc();
    final id = _noteId(verseId);
    final shouldDelete =
        noteText.trim().isEmpty &&
        (highlightColor == null || highlightColor.isEmpty);

    await database
        .into(database.studyNotes)
        .insertOnConflictUpdate(
          StudyNotesCompanion.insert(
            id: id,
            verseId: verseId,
            noteText: noteText,
            highlightColor: Value(highlightColor),
            dirty: const Value(true),
            deleted: Value(shouldDelete),
            updatedAt: now,
          ),
        );
    await _enqueueSync(
      entityType: 'study_note',
      entityId: id,
      action: shouldDelete ? 'delete' : 'upsert',
      payload: {
        'verseId': verseId,
        'noteText': noteText,
        'highlightColor': highlightColor,
        'deleted': shouldDelete,
      },
    );
  }

  Future<void> _enqueueSync({
    required String entityType,
    required String entityId,
    required String action,
    required Map<String, Object?> payload,
  }) async {
    final now = DateTime.now().toUtc();
    final id = 'sync.${now.microsecondsSinceEpoch}.$entityType.$entityId';
    await database
        .into(database.syncQueue)
        .insert(
          SyncQueueCompanion.insert(
            id: id,
            entityType: entityType,
            entityId: entityId,
            action: action,
            payloadJson: jsonEncode(payload),
            createdAt: now,
          ),
        );
  }
}

String _noteId(String verseId) => 'note:$verseId';

String _bookmarkId(String verseId) => 'bookmark:$verseId';
