import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/study/data/local/bible_seed_importer.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_database.dart';

void main() {
  test('seeds Bible metadata first and verse texts per translation', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);

    final importer = BibleSeedImporter(
      database: database,
      sharedPreferences: prefs,
      assetBundle: _BibleFixtureBundle(),
    );

    await importer.ensureSeeded();

    expect(await _countBooks(database), 1);
    expect(await _countTranslations(database), 3);
    expect(await _countVerseTexts(database, 'web'), 0);
    expect(await _countVerseTexts(database, 'cuvs'), 0);

    await importer.ensureVerseTextsSeeded('cuvs');

    expect(await _countVerseTexts(database, 'web'), 0);
    expect(await _countVerseTexts(database, 'cuvs'), 1);
    expect(await _countVerseTexts(database, 'cuvt'), 0);

    await importer.ensureVerseTextsSeeded('web');

    expect(await _countVerseTexts(database, 'web'), 1);
    expect(await _countVerseTexts(database, 'cuvs'), 1);
    expect(await _countVerseTexts(database, 'cuvt'), 0);
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

class _BibleFixtureBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) async {
    final value = _assets[key];
    if (value == null) {
      throw StateError('Missing test asset: $key');
    }
    final bytes = Uint8List.fromList(utf8.encode(value));
    return ByteData.sublistView(bytes);
  }
}

final _assets = {
  'assets/bible/web/books.json': _books(
    nameLocal: 'Matthew',
    abbrLocal: 'Matt',
  ),
  'assets/bible/cuvs/books.json': _books(nameLocal: '马太福音', abbrLocal: '太'),
  'assets/bible/cuvt/books.json': _books(nameLocal: '馬太福音', abbrLocal: '太'),
  'assets/bible/web/verses.jsonl': _verse(
    versionText: 'The book of the genealogy of Jesus Christ.',
  ),
  'assets/bible/cuvs/verses.jsonl': _verse(
    versionText: '亚伯拉罕的后裔，大卫的子孙，耶稣基督的家谱。',
  ),
  'assets/bible/cuvt/verses.jsonl': _verse(
    versionText: '亞伯拉罕的後裔，大衛的子孫，耶穌基督的家譜。',
  ),
};

String _books({required String nameLocal, required String abbrLocal}) {
  return jsonEncode([
    {
      'id': 'mat',
      'testament': 'new',
      'category': 'gospels',
      'nameEn': 'Matthew',
      'abbrEn': 'Matt',
      'nameLocal': nameLocal,
      'abbrLocal': abbrLocal,
      'chapterCount': 1,
      'canonicalOrder': 40,
    },
  ]);
}

String _verse({required String versionText}) {
  return '${jsonEncode({'id': 'mat.1.1', 'bookId': 'mat', 'chapter': 1, 'verse': 1, 'text': versionText})}\n';
}
