import 'package:drift/drift.dart';

class LocalLifePosts extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  TextColumn get title => text()();
  TextColumn get body => text()();
  TextColumn get meta => text().withDefault(const Constant(''))();
  TextColumn get iconName => text().withDefault(const Constant('church'))();
  DateTimeColumn get startsAt => dateTime().nullable()();
  DateTimeColumn get endsAt => dateTime().nullable()();
  TextColumn get visibility => text()();
  TextColumn get status => text().withDefault(const Constant('published'))();
  TextColumn get imageUrl => text().nullable()();
  IntColumn get displayWeight => integer().withDefault(const Constant(0))();
  TextColumn get ctaLabel => text().nullable()();
  TextColumn get ctaUrl => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
