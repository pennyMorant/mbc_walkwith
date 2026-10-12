import '../../../../core/database/app_database.dart';
import '../../domain/bible_book.dart';
import '../../domain/bible_translation.dart';
import '../../domain/bible_verse.dart';

BibleBook bookFromLocalRow(LocalBibleBook row, String translationId) {
  final translation = BibleTranslation.fromId(translationId);
  final nameZh = translation.usesEnglishNames
      ? row.nameEn
      : translation.usesTraditionalChineseNames
      ? row.nameZhHant
      : row.nameZh;
  final abbreviationZh = translation.usesEnglishNames
      ? row.abbreviationEn
      : translation.usesTraditionalChineseNames
      ? row.abbreviationZhHant
      : row.abbreviationZh;

  return BibleBook(
    id: row.id,
    testament: testamentFromStorage(row.testament),
    category: categoryFromStorage(row.category),
    nameZh: nameZh,
    nameEn: row.nameEn,
    abbreviationZh: abbreviationZh,
    abbreviationEn: row.abbreviationEn,
    chapterCount: row.chapterCount,
    sortOrder: row.sortOrder,
  );
}

BibleVerse verseFromLocalRow(LocalBibleVerseText row) {
  return BibleVerse(
    id: row.verseId,
    number: row.verse,
    text: row.verseText,
    hasLexicon: false,
  );
}

BibleTestament testamentFromStorage(String value) {
  return switch (value) {
    'old' => BibleTestament.old,
    'new' => BibleTestament.newTestament,
    _ => BibleTestament.old,
  };
}

BibleBookCategory categoryFromStorage(String value) {
  return switch (value) {
    'law' => BibleBookCategory.law,
    'old_testament_history' => BibleBookCategory.oldTestamentHistory,
    'wisdom' => BibleBookCategory.wisdom,
    'major_prophets' => BibleBookCategory.majorProphets,
    'minor_prophets' => BibleBookCategory.minorProphets,
    'gospels' => BibleBookCategory.gospels,
    'acts' => BibleBookCategory.acts,
    'pauline_letters' => BibleBookCategory.paulineLetters,
    'general_letters' => BibleBookCategory.generalLetters,
    'apocalyptic' => BibleBookCategory.apocalyptic,
    _ => BibleBookCategory.law,
  };
}
