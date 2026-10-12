import 'package:drift/drift.dart';

import 'local_bible_tables.dart';

class ReadingProgress extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text().references(LocalBibleBooks, #id)();
  IntColumn get chapter => integer()();
  TextColumn get verseId => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class StudyNotes extends Table {
  TextColumn get id => text()();
  TextColumn get verseId => text()();
  TextColumn get noteText => text()();
  TextColumn get highlightColor => text().nullable()();
  BoolColumn get dirty => boolean().withDefault(const Constant(false))();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class StudyBookmarks extends Table {
  TextColumn get id => text()();
  TextColumn get verseId => text()();
  BoolColumn get dirty => boolean().withDefault(const Constant(false))();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
