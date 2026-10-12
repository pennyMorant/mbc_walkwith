import '../domain/bible_book.dart';
import '../domain/bible_search_result.dart';
import '../domain/bible_verse.dart';
import '../domain/study_annotation.dart';

class BibleBookRequest {
  const BibleBookRequest({required this.bookId, required this.translationId});

  final String bookId;
  final String translationId;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is BibleBookRequest &&
            runtimeType == other.runtimeType &&
            bookId == other.bookId &&
            translationId == other.translationId;
  }

  @override
  int get hashCode => Object.hash(bookId, translationId);
}

class BibleChapterRequest {
  const BibleChapterRequest({
    required this.bookId,
    required this.chapter,
    required this.translationId,
  });

  final String bookId;
  final int chapter;
  final String translationId;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is BibleChapterRequest &&
            runtimeType == other.runtimeType &&
            bookId == other.bookId &&
            chapter == other.chapter &&
            translationId == other.translationId;
  }

  @override
  int get hashCode => Object.hash(bookId, chapter, translationId);
}

class BibleSearchRequest {
  const BibleSearchRequest({
    required this.query,
    required this.translationId,
    this.limit = 30,
  });

  final String query;
  final String translationId;
  final int limit;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is BibleSearchRequest &&
            runtimeType == other.runtimeType &&
            query == other.query &&
            translationId == other.translationId &&
            limit == other.limit;
  }

  @override
  int get hashCode => Object.hash(query, translationId, limit);
}

class StudyAnnotationsRequest {
  const StudyAnnotationsRequest({required this.bookId, required this.chapter});

  final String bookId;
  final int chapter;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is StudyAnnotationsRequest &&
            runtimeType == other.runtimeType &&
            bookId == other.bookId &&
            chapter == other.chapter;
  }

  @override
  int get hashCode => Object.hash(bookId, chapter);
}

class ReadingProgressEntry {
  const ReadingProgressEntry({
    required this.book,
    required this.chapter,
    this.verseId,
  });

  final BibleBook book;
  final int chapter;
  final String? verseId;
}

abstract class StudyRepository {
  Future<List<BibleBook>> getBibleBooks(String translationId);

  Future<BibleBook> getBibleBook(String bookId, String translationId);

  Future<List<BibleVerse>> getChapterVerses(
    String bookId,
    int chapter,
    String translationId,
  );

  Future<List<BibleVerse>> getCurrentChapter();

  Future<List<BibleSearchResult>> searchBibleVerses({
    required String query,
    required String translationId,
    int limit = 30,
  });

  Future<ReadingProgressEntry> getReadingProgress(String translationId);

  Future<void> saveReadingProgress({
    required String bookId,
    required int chapter,
    String? verseId,
  });

  Future<Map<String, StudyVerseAnnotation>> getChapterAnnotations(
    String bookId,
    int chapter,
  );

  Future<void> saveVerseNote({
    required String verseId,
    required String noteText,
  });

  Future<void> setVerseHighlight({
    required String verseId,
    required String? highlightColor,
  });

  Future<void> setVerseBookmark({
    required String verseId,
    required bool isBookmarked,
  });
}
