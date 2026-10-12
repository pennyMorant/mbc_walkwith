import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/presentation/bible_book_display.dart';

void main() {
  test('uses English book name when English names are requested', () {
    expect(bibleBookDisplayName(_romans, useEnglishNames: true), 'Romans');
  });

  test('uses localized book name when English names are not requested', () {
    expect(bibleBookDisplayName(_romans, useEnglishNames: false), '罗马书');
  });
}

const _romans = BibleBook(
  id: 'rom',
  testament: BibleTestament.newTestament,
  category: BibleBookCategory.paulineLetters,
  nameZh: '罗马书',
  nameEn: 'Romans',
  abbreviationZh: '罗',
  abbreviationEn: 'Rom',
  chapterCount: 16,
  sortOrder: 45,
);
