import 'dart:io';

import 'package:drift_sqflite/drift_sqflite.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

void main() {
  test(
    'migration tolerates partially upgraded development databases',
    () async {
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;

      final tempDir = await Directory.systemTemp.createTemp(
        'mbc_walkwith_migration_test_',
      );
      addTearDown(() => tempDir.delete(recursive: true));
      final path = '${tempDir.path}/partial.sqlite';
      await _createPartiallyMigratedVersion5Database(path);

      final database = AppDatabase(
        SqfliteQueryExecutor(path: path, singleInstance: false),
      );
      addTearDown(database.close);

      final books = await database.select(database.localBibleBooks).get();
      expect(books, isEmpty);

      final version = await database
          .customSelect('PRAGMA user_version')
          .getSingle()
          .then((row) => row.data.values.single);
      expect(version, 15);

      final sermonTopicColumns = await database
          .customSelect('PRAGMA table_info("local_sermon_topics")')
          .get()
          .then((rows) => rows.map((row) => row.data['name']).toSet());
      expect(
        sermonTopicColumns,
        containsAll(['sermon_id', 'topic', 'sort_order']),
      );

      final lifeColumns = await database
          .customSelect('PRAGMA table_info("local_life_posts")')
          .get()
          .then((rows) => rows.map((row) => row.data['name']).toSet());
      expect(
        lifeColumns,
        containsAll(['display_weight', 'cta_label', 'cta_url', 'status']),
      );

      final indexes = await _indexNames(database);
      expect(
        indexes,
        containsAll({
          'idx_local_bible_verses_book_chapter',
          'idx_local_bible_verse_texts_lookup',
          'idx_local_sermons_sermon_date',
          'idx_local_sermon_outlines_sermon_sort',
          'idx_local_sermon_topics_topic',
          'idx_local_sermon_references_verse_id',
          'idx_local_life_posts_weight_starts_at',
          'idx_local_life_posts_type_starts_at',
          'idx_study_notes_verse_id',
          'idx_study_bookmarks_verse_id',
          'idx_sync_queue_entity_created_at',
        }),
      );
    },
  );
}

Future<Set<String>> _indexNames(AppDatabase database) async {
  final rows = await database
      .customSelect(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'",
      )
      .get();
  return rows.map((row) => row.data['name']).whereType<String>().toSet();
}

Future<void> _createPartiallyMigratedVersion5Database(String path) async {
  final raw = await databaseFactoryFfi.openDatabase(
    path,
    options: OpenDatabaseOptions(singleInstance: false),
  );
  try {
    for (final statement in _partialVersion5Schema) {
      await raw.execute(statement);
    }
  } finally {
    await raw.close();
  }
}

const _partialVersion5Schema = [
  '''
CREATE TABLE local_bible_books (
  id TEXT NOT NULL PRIMARY KEY,
  testament TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  name_zh TEXT NOT NULL,
  name_zh_hant TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL,
  abbreviation_zh TEXT NOT NULL DEFAULT '',
  abbreviation_zh_hant TEXT NOT NULL DEFAULT '',
  abbreviation_en TEXT NOT NULL DEFAULT '',
  chapter_count INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
''',
  '''
INSERT INTO local_bible_books (
  id, testament, category, name_zh, name_zh_hant, name_en,
  abbreviation_zh, abbreviation_zh_hant, abbreviation_en,
  chapter_count, sort_order, updated_at
) VALUES (
  'rom', 'new', 'pauline_letters', '罗马书', '羅馬書', 'Romans',
  '罗', '羅', 'Rom', 16, 45, 1
)
''',
  '''
CREATE TABLE local_bible_translations (
  id TEXT NOT NULL PRIMARY KEY,
  locale_code TEXT NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  copyright_status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE local_bible_verses (
  id TEXT NOT NULL PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES local_bible_books (id),
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text_zh TEXT NOT NULL,
  text_en TEXT,
  has_lexicon INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE local_bible_verse_texts (
  id TEXT NOT NULL PRIMARY KEY,
  version_id TEXT NOT NULL,
  verse_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE local_sermons (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  sermon_date INTEGER NOT NULL,
  series TEXT,
  primary_reference TEXT,
  duration_seconds INTEGER NOT NULL,
  summary TEXT,
  audio_url TEXT,
  audio_url_expires_at INTEGER,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE local_sermon_outlines (
  id TEXT NOT NULL PRIMARY KEY,
  sermon_id TEXT NOT NULL REFERENCES local_sermons (id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  start_seconds INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
)
''',
  '''
CREATE TABLE local_sermon_references (
  id TEXT NOT NULL PRIMARY KEY,
  sermon_id TEXT NOT NULL REFERENCES local_sermons (id),
  verse_id TEXT NOT NULL,
  reference_text TEXT NOT NULL,
  note TEXT,
  start_seconds INTEGER
)
''',
  '''
CREATE TABLE local_life_posts (
  id TEXT NOT NULL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  starts_at INTEGER,
  ends_at INTEGER,
  visibility TEXT NOT NULL,
  image_url TEXT,
  updated_at INTEGER NOT NULL,
  meta TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'church'
)
''',
  '''
CREATE TABLE reading_progress (
  id TEXT NOT NULL PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES local_bible_books (id),
  chapter INTEGER NOT NULL,
  verse_id TEXT,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE study_notes (
  id TEXT NOT NULL PRIMARY KEY,
  verse_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  highlight_color TEXT,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE study_bookmarks (
  id TEXT NOT NULL PRIMARY KEY,
  verse_id TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
)
''',
  '''
CREATE TABLE sync_queue (
  id TEXT NOT NULL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL
)
''',
  'PRAGMA user_version = 5',
];
