import 'bible_catalog_new_testament.dart';
import 'bible_catalog_old_testament.dart';
import '../domain/bible_book.dart';

const List<BibleBook> bibleBooks = [
  ...oldTestamentBibleBooks,
  ...newTestamentBibleBooks,
];
