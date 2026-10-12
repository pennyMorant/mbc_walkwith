import 'package:drift/drift.dart';

class LocalSermons extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get speaker => text()();
  DateTimeColumn get sermonDate => dateTime()();
  TextColumn get series => text().nullable()();
  TextColumn get primaryReference => text().nullable()();
  IntColumn get durationSeconds => integer()();
  TextColumn get summary => text().nullable()();
  TextColumn get transcriptText => text().nullable()();
  TextColumn get transcriptSource => text().nullable()();
  TextColumn get transcriptUpdatedAt => text().nullable()();
  TextColumn get audioUrl => text().nullable()();
  DateTimeColumn get audioUrlExpiresAt => dateTime().nullable()();
  TextColumn get thumbnailUrl => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalSermonOutlines extends Table {
  TextColumn get id => text()();
  TextColumn get sermonId => text().references(LocalSermons, #id)();
  TextColumn get title => text()();
  TextColumn get summary => text()();
  IntColumn get startSeconds => integer()();
  IntColumn get sortOrder => integer()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class LocalSermonTopics extends Table {
  TextColumn get sermonId => text().references(LocalSermons, #id)();
  TextColumn get topic => text()();
  IntColumn get sortOrder => integer()();

  @override
  Set<Column<Object>> get primaryKey => {sermonId, topic};
}

class LocalSermonReferences extends Table {
  TextColumn get id => text()();
  TextColumn get sermonId => text().references(LocalSermons, #id)();
  TextColumn get verseId => text()();
  TextColumn get referenceText => text()();
  TextColumn get note => text().nullable()();
  IntColumn get startSeconds => integer().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
