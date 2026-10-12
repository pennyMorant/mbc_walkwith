import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'connection/database_connection.dart';
import 'tables/local_bible_tables.dart';
import 'tables/local_life_tables.dart';
import 'tables/local_sermon_tables.dart';
import 'tables/local_study_tables.dart';
import 'tables/sync_queue_table.dart';

part 'app_database.g.dart';

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();
  ref.onDispose(database.close);
  return database;
});

@DriftDatabase(
  tables: [
    LocalBibleBooks,
    LocalBibleTranslations,
    LocalBibleVerses,
    LocalBibleVerseTexts,
    LocalSermons,
    LocalSermonTopics,
    LocalSermonOutlines,
    LocalSermonReferences,
    LocalLifePosts,
    ReadingProgress,
    StudyNotes,
    StudyBookmarks,
    SyncQueue,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
    : super(executor ?? openDatabaseConnection());

  @override
  int get schemaVersion => 15;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (migrator) async {
        await migrator.createAll();
        await _createPerformanceIndexes();
      },
      beforeOpen: (_) async {
        await _createPerformanceIndexes();
      },
      onUpgrade: (migrator, from, to) async {
        if (from < 2) {
          await _addColumnIfMissing(
            migrator,
            localBibleBooks,
            localBibleBooks.category,
          );
          await _addColumnIfMissing(
            migrator,
            localBibleBooks,
            localBibleBooks.abbreviationZh,
          );
          await _addColumnIfMissing(
            migrator,
            localBibleBooks,
            localBibleBooks.abbreviationEn,
          );
        }
        if (from < 3) {
          await _addColumnIfMissing(
            migrator,
            localBibleBooks,
            localBibleBooks.nameZhHant,
          );
          await _addColumnIfMissing(
            migrator,
            localBibleBooks,
            localBibleBooks.abbreviationZhHant,
          );
          await _createTableIfMissing(migrator, localBibleTranslations);
          await _createTableIfMissing(migrator, localBibleVerseTexts);
        }
        if (from < 4) {
          await _createPerformanceIndexes();
        }
        if (from < 5) {
          await _createTableIfMissing(migrator, studyBookmarks);
          await _createStudyAnnotationIndexes();
        }
        if (from < 6) {
          await _addColumnIfMissing(
            migrator,
            localSermons,
            localSermons.transcriptText,
          );
          await _addColumnIfMissing(
            migrator,
            localSermons,
            localSermons.transcriptSource,
          );
          await _addColumnIfMissing(
            migrator,
            localSermons,
            localSermons.transcriptUpdatedAt,
          );
        }
        if (from < 7) {
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.meta,
          );
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.iconName,
          );
        }
        if (from < 8) {
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.startsAt,
          );
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.endsAt,
          );
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.imageUrl,
          );
        }
        if (from < 10) {
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.ctaLabel,
          );
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.ctaUrl,
          );
        }
        if (from < 11) {
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.status,
          );
        }
        if (from < 12) {
          await _clearLocalBibleSeedData();
        }
        if (from < 13) {
          await _addColumnIfMissing(
            migrator,
            localLifePosts,
            localLifePosts.displayWeight,
          );
        }
        if (from < 14) {
          await _addColumnIfMissing(
            migrator,
            localSermons,
            localSermons.thumbnailUrl,
          );
        }
        if (from < 15) {
          await _createTableIfMissing(migrator, localSermonTopics);
        }
      },
    );
  }

  Future<void> _clearLocalBibleSeedData() async {
    await delete(localBibleVerseTexts).go();
    await delete(localBibleTranslations).go();
    await delete(localBibleVerses).go();
    await delete(localBibleBooks).go();
  }

  Future<void> _createTableIfMissing(Migrator migrator, TableInfo table) async {
    if (await _tableExists(table)) {
      return;
    }
    await migrator.createTable(table);
  }

  Future<void> _addColumnIfMissing(
    Migrator migrator,
    TableInfo table,
    GeneratedColumn column,
  ) async {
    if (await _columnExists(table, column)) {
      return;
    }
    await migrator.addColumn(table, column);
  }

  Future<bool> _tableExists(TableInfo table) async {
    final result = await customSelect(
      'SELECT 1 FROM sqlite_master WHERE type = ? AND name = ? LIMIT 1',
      variables: [
        Variable.withString('table'),
        Variable.withString(table.actualTableName),
      ],
    ).getSingleOrNull();
    return result != null;
  }

  Future<bool> _columnExists(TableInfo table, GeneratedColumn column) async {
    final rows = await customSelect(
      'PRAGMA table_info(${_quoteIdentifier(table.actualTableName)})',
    ).get();
    return rows.any((row) => row.data['name'] == column.$name);
  }

  String _quoteIdentifier(String identifier) {
    return '"${identifier.replaceAll('"', '""')}"';
  }

  Future<void> _createPerformanceIndexes() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_bible_verses_book_chapter '
      'ON local_bible_verses(book_id, chapter)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_bible_verse_texts_lookup '
      'ON local_bible_verse_texts(version_id, book_id, chapter, verse)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_sermons_sermon_date '
      'ON local_sermons(sermon_date)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_sermon_outlines_sermon_sort '
      'ON local_sermon_outlines(sermon_id, sort_order)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_sermon_topics_topic '
      'ON local_sermon_topics(topic)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_sermon_references_verse_id '
      'ON local_sermon_references(verse_id)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_life_posts_weight_starts_at '
      'ON local_life_posts(display_weight, starts_at)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_local_life_posts_type_starts_at '
      'ON local_life_posts(type, starts_at)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_created_at '
      'ON sync_queue(entity_type, created_at)',
    );
    await _createStudyAnnotationIndexes();
  }

  Future<void> _createStudyAnnotationIndexes() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_study_notes_verse_id '
      'ON study_notes(verse_id)',
    );
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_study_bookmarks_verse_id '
      'ON study_bookmarks(verse_id)',
    );
  }
}
