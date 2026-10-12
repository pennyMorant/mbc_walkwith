import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/study/data/bible_catalog_new_testament.dart';
import 'package:mbc_walkwith/features/study/data/bible_catalog_old_testament.dart';
import 'package:mbc_walkwith/features/study/data/local/bible_seed_importer.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_database.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('seeds packaged Bible assets used by release builds', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);

    final importer = BibleSeedImporter(
      database: database,
      sharedPreferences: prefs,
      assetBundle: rootBundle,
    );

    await importer.ensureMetadataSeeded();

    expect(await _countBooks(database), 66);
    expect(await _countTranslations(database), 3);

    await importer.ensureVerseTextsSeeded('cuvs');
    expect(await _countVerseTexts(database, 'cuvs'), greaterThan(30000));
  });

  test('keeps static catalog ids aligned with packaged Bible assets', () async {
    final raw = await rootBundle.loadString('assets/bible/web/books.json');
    final assetBooks = (jsonDecode(raw) as List<Object?>)
        .cast<Map<String, Object?>>();
    final staticBooks = [...oldTestamentBibleBooks, ...newTestamentBibleBooks];

    expect(staticBooks.map((book) => book.id), [
      for (final row in assetBooks) row['id'] as String,
    ]);
    expect(staticBooks.map((book) => book.chapterCount), [
      for (final row in assetBooks) row['chapterCount'] as int,
    ]);
  });
}

Future<int> _countBooks(AppDatabase database) async {
  final countColumn = database.localBibleBooks.id.count();
  final query = database.selectOnly(database.localBibleBooks)
    ..addColumns([countColumn]);
  final row = await query.getSingle();
  return row.read(countColumn) ?? 0;
}

Future<int> _countTranslations(AppDatabase database) async {
  final countColumn = database.localBibleTranslations.id.count();
  final query = database.selectOnly(database.localBibleTranslations)
    ..addColumns([countColumn]);
  final row = await query.getSingle();
  return row.read(countColumn) ?? 0;
}

Future<int> _countVerseTexts(AppDatabase database, String versionId) async {
  final countColumn = database.localBibleVerseTexts.id.count();
  final query = database.selectOnly(database.localBibleVerseTexts)
    ..addColumns([countColumn])
    ..where(database.localBibleVerseTexts.versionId.equals(versionId));
  final row = await query.getSingle();
  return row.read(countColumn) ?? 0;
}
