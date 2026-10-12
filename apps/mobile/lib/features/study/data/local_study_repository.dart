import 'package:drift/drift.dart';

import '../../../core/database/app_database.dart';
import '../domain/bible_book.dart';
import '../domain/bible_search_result.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';
import '../domain/study_annotation.dart';
import 'local/bible_search_ranker.dart';
import 'local/bible_seed_importer.dart';
import 'local/study_annotation_store.dart';
import 'local/study_row_mappers.dart';
import 'study_repository_contract.dart';

class LocalStudyRepository implements StudyRepository {
  const LocalStudyRepository({
    required this.database,
    required this.seedImporter,
  });

  final AppDatabase database;
  final BibleSeedImporter seedImporter;

  StudyAnnotationStore get _annotationStore => StudyAnnotationStore(database);

  @override
  Future<List<BibleBook>> getBibleBooks(String translationId) async {
    await seedImporter.ensureMetadataSeeded();
    final query = database.select(database.localBibleBooks)
      ..orderBy([(book) => OrderingTerm.asc(book.sortOrder)]);
    final rows = await query.get();
    return rows.map((row) => bookFromLocalRow(row, translationId)).toList();
  }

  @override
  Future<BibleBook> getBibleBook(String bookId, String translationId) async {
    await seedImporter.ensureMetadataSeeded();
    final query = database.select(database.localBibleBooks)
      ..where((book) => book.id.equals(bookId));
    final row = await query.getSingleOrNull();
    if (row != null) {
      return bookFromLocalRow(row, translationId);
    }

    final fallbackQuery = database.select(database.localBibleBooks)
      ..where((book) => book.id.equals('rom'));
    final fallback = await fallbackQuery.getSingleOrNull();
    if (fallback == null) {
      throw StateError('Bible seed data is not available.');
    }
    return bookFromLocalRow(fallback, translationId);
  }

  @override
  Future<List<BibleVerse>> getChapterVerses(
    String bookId,
    int chapter,
    String translationId,
  ) async {
    await seedImporter.ensureVerseTextsSeeded(translationId);
    final query = database.select(database.localBibleVerseTexts)
      ..where((verse) => verse.versionId.equals(translationId))
      ..where((verse) => verse.bookId.equals(bookId))
      ..where((verse) => verse.chapter.equals(chapter))
      ..orderBy([(verse) => OrderingTerm.asc(verse.verse)]);
    final rows = await query.get();
    return rows.map(verseFromLocalRow).toList();
  }

  @override
  Future<List<BibleVerse>> getCurrentChapter() {
    return getChapterVerses('rom', 8, BibleTranslation.web.id);
  }

  @override
  Future<List<BibleSearchResult>> searchBibleVerses({
    required String query,
    required String translationId,
    int limit = 30,
  }) async {
    final normalizedQuery = normalizeSearchText(query);
    if (normalizedQuery.length < 2) {
      return const [];
    }

    await seedImporter.ensureVerseTextsSeeded(translationId);

    final booksQuery = database.select(database.localBibleBooks)
      ..orderBy([(book) => OrderingTerm.asc(book.sortOrder)]);
    final bookRows = await booksQuery.get();
    final booksById = {
      for (final row in bookRows) row.id: bookFromLocalRow(row, translationId),
    };

    final verseQuery = database.select(database.localBibleVerseTexts)
      ..where((verse) => verse.versionId.equals(translationId));
    final verseRows = await verseQuery.get();
    final tokens = searchTokens(query);
    final scored = <BibleSearchResult>[];

    for (final row in verseRows) {
      final score = scoreBibleSearchResult(
        normalizedQuery: normalizedQuery,
        tokens: tokens,
        verseText: row.verseText,
      );
      if (score <= 0) {
        continue;
      }

      final book = booksById[row.bookId];
      if (book == null) {
        continue;
      }

      scored.add(
        BibleSearchResult(
          verseId: row.verseId,
          bookId: row.bookId,
          bookName: book.nameZh,
          chapter: row.chapter,
          verse: row.verse,
          text: row.verseText,
          score: score,
          bookSortOrder: book.sortOrder,
        ),
      );
    }

    scored.sort((a, b) {
      final scoreCompare = b.score.compareTo(a.score);
      if (scoreCompare != 0) {
        return scoreCompare;
      }
      final bookCompare = a.bookSortOrder.compareTo(b.bookSortOrder);
      if (bookCompare != 0) {
        return bookCompare;
      }
      final chapterCompare = a.chapter.compareTo(b.chapter);
      if (chapterCompare != 0) {
        return chapterCompare;
      }
      return a.verse.compareTo(b.verse);
    });

    return scored.take(limit).toList(growable: false);
  }

  @override
  Future<ReadingProgressEntry> getReadingProgress(String translationId) async {
    await seedImporter.ensureMetadataSeeded();
    final query = database.select(database.readingProgress)
      ..where((progress) => progress.id.equals('current'))
      ..limit(1);
    final row = await query.getSingleOrNull();
    final bookId = row?.bookId ?? 'rom';
    final chapter = row?.chapter ?? 8;
    final book = await getBibleBook(bookId, translationId);

    return ReadingProgressEntry(
      book: book,
      chapter: chapter,
      verseId: row?.verseId,
    );
  }

  @override
  Future<void> saveReadingProgress({
    required String bookId,
    required int chapter,
    String? verseId,
  }) async {
    await seedImporter.ensureMetadataSeeded();
    await database
        .into(database.readingProgress)
        .insertOnConflictUpdate(
          ReadingProgressCompanion.insert(
            id: 'current',
            bookId: bookId,
            chapter: chapter,
            verseId: Value(verseId),
            updatedAt: DateTime.now().toUtc(),
          ),
        );
  }

  @override
  Future<Map<String, StudyVerseAnnotation>> getChapterAnnotations(
    String bookId,
    int chapter,
  ) async {
    return _annotationStore.getChapterAnnotations(bookId, chapter);
  }

  @override
  Future<void> saveVerseNote({
    required String verseId,
    required String noteText,
  }) async {
    await _annotationStore.saveVerseNote(verseId: verseId, noteText: noteText);
  }

  @override
  Future<void> setVerseHighlight({
    required String verseId,
    required String? highlightColor,
  }) async {
    await _annotationStore.setVerseHighlight(
      verseId: verseId,
      highlightColor: highlightColor,
    );
  }

  @override
  Future<void> setVerseBookmark({
    required String verseId,
    required bool isBookmarked,
  }) async {
    await _annotationStore.setVerseBookmark(
      verseId: verseId,
      isBookmarked: isBookmarked,
    );
  }
}
