import '../domain/bible_book.dart';

String bibleBookDisplayName(BibleBook book, {required bool useEnglishNames}) {
  final englishName = book.nameEn.trim();
  if (useEnglishNames && englishName.isNotEmpty) {
    return englishName;
  }
  return book.nameZh;
}
