import 'package:drift/drift.dart';

class LocalBibleBooks extends Table {
  TextColumn get id => text()();
  TextColumn get testament => text()();
  TextColumn get category => text().withDefault(const Constant(''))();
  TextColumn get nameZh => text()();
  TextColumn get nameZhHant => text().withDefault(const Constant(''))();
  TextColumn get nameEn => text()();
  TextColumn get abbreviationZh => text().withDefault(const Constant(''))();
  TextColumn get abbreviationZhHant => text().withDefault(const Constant(''))();
  TextColumn get abbreviationEn => text().withDefault(const Constant(''))();
  IntColumn get chapterCount => integer()();
  IntColumn get sortOrder => integer()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalBibleTranslations extends Table {
  TextColumn get id => text()();
  TextColumn get localeCode => text()();
  TextColumn get name => text()();
  TextColumn get abbreviation => text()();
  TextColumn get copyrightStatus => text()();
  TextColumn get sourceUrl => text()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalBibleVerses extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text().references(LocalBibleBooks, #id)();
  IntColumn get chapter => integer()();
  IntColumn get verse => integer()();
  TextColumn get textZh => text()();
  TextColumn get textEn => text().nullable()();
  BoolColumn get hasLexicon => boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalBibleVerseTexts extends Table {
  TextColumn get id => text()();
  TextColumn get versionId => text()();
  TextColumn get verseId => text()();
  TextColumn get bookId => text()();
  IntColumn get chapter => integer()();
  IntColumn get verse => integer()();
  TextColumn get verseText => text().named('text')();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
