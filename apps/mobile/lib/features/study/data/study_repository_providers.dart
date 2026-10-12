import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/database/app_database.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import '../domain/bible_book.dart';
import '../domain/bible_search_result.dart';
import '../domain/bible_verse.dart';
import '../domain/study_annotation.dart';
import 'local/bible_seed_importer.dart';
import 'local_study_repository.dart';
import 'study_repository_contract.dart';

final studyRepositoryProvider = Provider<StudyRepository>((ref) {
  return LocalStudyRepository(
    database: ref.watch(appDatabaseProvider),
    seedImporter: BibleSeedImporter(
      database: ref.watch(appDatabaseProvider),
      sharedPreferences: ref.watch(sharedPreferencesProvider),
    ),
  );
});

final bibleBooksProvider = FutureProvider.family<List<BibleBook>, String>((
  ref,
  translationId,
) {
  return ref.watch(studyRepositoryProvider).getBibleBooks(translationId);
});

final bibleBookProvider = FutureProvider.family<BibleBook, BibleBookRequest>((
  ref,
  request,
) {
  return ref
      .watch(studyRepositoryProvider)
      .getBibleBook(request.bookId, request.translationId);
});

final bibleChapterVersesProvider =
    FutureProvider.family<List<BibleVerse>, BibleChapterRequest>((
      ref,
      request,
    ) {
      return ref
          .watch(studyRepositoryProvider)
          .getChapterVerses(
            request.bookId,
            request.chapter,
            request.translationId,
          );
    });

final readingProgressProvider =
    FutureProvider.family<ReadingProgressEntry, String>((ref, translationId) {
      return ref
          .watch(studyRepositoryProvider)
          .getReadingProgress(translationId);
    });

final bibleSearchProvider = FutureProvider.autoDispose
    .family<List<BibleSearchResult>, BibleSearchRequest>((ref, request) {
      return ref
          .watch(studyRepositoryProvider)
          .searchBibleVerses(
            query: request.query,
            translationId: request.translationId,
            limit: request.limit,
          );
    });

final studyAnnotationsProvider =
    FutureProvider.family<
      Map<String, StudyVerseAnnotation>,
      StudyAnnotationsRequest
    >((ref, request) {
      return ref
          .watch(studyRepositoryProvider)
          .getChapterAnnotations(request.bookId, request.chapter);
    });
