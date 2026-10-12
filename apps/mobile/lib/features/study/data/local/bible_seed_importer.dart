import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/database/app_database.dart';

class BibleSeedImporter {
  BibleSeedImporter({
    required this.database,
    required this.sharedPreferences,
    AssetBundle? assetBundle,
  }) : assetBundle = assetBundle ?? rootBundle;

  static const seedVersion = 'bible-multi-2026-05-11-v2';
  static const _translations = [
    _SeedTranslation(
      id: 'web',
      localeCode: 'en',
      name: 'World English Bible',
      abbreviation: 'WEB',
      copyrightStatus: 'Public Domain',
      sourceUrl: 'https://ebible.org/bible/details.php?all=1&id=engwebp',
    ),
    _SeedTranslation(
      id: 'cuvs',
      localeCode: 'zh-Hans',
      name: '新标点和合本',
      abbreviation: '和合本',
      copyrightStatus: 'Public Domain',
      sourceUrl: 'https://ebible.org/bible/details.php?all=1&id=cmn-cu89s',
    ),
    _SeedTranslation(
      id: 'cuvt',
      localeCode: 'zh-Hant',
      name: '新標點和合本',
      abbreviation: '和合本',
      copyrightStatus: 'Public Domain',
      sourceUrl: 'https://ebible.org/bible/details.php?all=1&id=cmn-cu89t',
    ),
  ];
  static const _metadataSeedVersionKey = 'bible_seed_version:metadata';

  final AppDatabase database;
  final SharedPreferences sharedPreferences;
  final AssetBundle assetBundle;
  Future<void>? _metadataSeedFuture;
  final Map<String, Future<void>> _verseSeedFutures = {};
  bool _metadataSeededInMemory = false;
  final Set<String> _seededVerseTextVersions = {};

  Future<void> ensureSeeded() async {
    await ensureMetadataSeeded();
  }

  Future<void> ensureMetadataSeeded() async {
    if (_metadataSeededInMemory) {
      return;
    }

    final runningSeed = _metadataSeedFuture;
    if (runningSeed != null) {
      return runningSeed;
    }

    final seedFuture = _ensureMetadataSeeded();
    _metadataSeedFuture = seedFuture;
    try {
      await seedFuture;
    } finally {
      _metadataSeedFuture = null;
    }
  }

  Future<void> ensureVerseTextsSeeded(String versionId) async {
    _assertSupportedVersion(versionId);
    if (_seededVerseTextVersions.contains(versionId)) {
      return;
    }

    await ensureMetadataSeeded();

    final runningSeed = _verseSeedFutures[versionId];
    if (runningSeed != null) {
      return runningSeed;
    }

    final seedFuture = _ensureVerseTextsSeeded(versionId);
    _verseSeedFutures[versionId] = seedFuture;
    try {
      await seedFuture;
    } finally {
      _verseSeedFutures.remove(versionId);
    }
  }

  Future<void> _ensureMetadataSeeded() async {
    final savedVersion = sharedPreferences.getString(_metadataSeedVersionKey);
    final existingTranslationCount = await database
        .select(database.localBibleTranslations)
        .get()
        .then((translations) => translations.length);
    final existingBookCount = await database
        .select(database.localBibleBooks)
        .get()
        .then((books) => books.length);

    if (savedVersion == seedVersion &&
        existingTranslationCount == _translations.length &&
        existingBookCount > 0) {
      _metadataSeededInMemory = true;
      return;
    }

    final now = DateTime.now().toUtc();
    final books = await _loadBooks(now);
    final translations = _loadTranslations(now);

    await database.transaction(() async {
      await database.delete(database.localBibleVerseTexts).go();
      await database.delete(database.localBibleTranslations).go();
      await database.delete(database.localBibleVerses).go();
      await database.delete(database.localBibleBooks).go();

      await database.batch((batch) {
        batch.insertAll(
          database.localBibleBooks,
          books,
          mode: InsertMode.insertOrReplace,
        );
        batch.insertAll(
          database.localBibleTranslations,
          translations,
          mode: InsertMode.insertOrReplace,
        );
      });
    });

    await sharedPreferences.setString(_metadataSeedVersionKey, seedVersion);
    _metadataSeededInMemory = true;
    _seededVerseTextVersions.clear();
  }

  Future<void> _ensureVerseTextsSeeded(String versionId) async {
    final savedVersion = sharedPreferences.getString(
      _verseSeedVersionKey(versionId),
    );
    final existingVerseCount = await _countVerseTexts(versionId);
    if (savedVersion == seedVersion && existingVerseCount > 0) {
      _seededVerseTextVersions.add(versionId);
      return;
    }

    final now = DateTime.now().toUtc();
    final verseTexts = await _loadVerseTexts(versionId, now);

    await database.transaction(() async {
      await (database.delete(
        database.localBibleVerseTexts,
      )..where((verse) => verse.versionId.equals(versionId))).go();
      await database.batch((batch) {
        batch.insertAll(
          database.localBibleVerseTexts,
          verseTexts,
          mode: InsertMode.insertOrReplace,
        );
      });
    });

    await sharedPreferences.setString(
      _verseSeedVersionKey(versionId),
      seedVersion,
    );
    _seededVerseTextVersions.add(versionId);
  }

  Future<List<LocalBibleBooksCompanion>> _loadBooks(DateTime updatedAt) async {
    final webRows = await _loadBookRows('web');
    final cuvsRows = await _loadBookRows('cuvs');
    final cuvtRows = await _loadBookRows('cuvt');

    return webRows.map((webRow) {
      final bookId = webRow['id'] as String;
      final cuvsRow = cuvsRows.firstWhere((row) => row['id'] == bookId);
      final cuvtRow = cuvtRows.firstWhere((row) => row['id'] == bookId);

      return LocalBibleBooksCompanion.insert(
        id: bookId,
        testament: webRow['testament'] as String,
        category: Value(webRow['category'] as String),
        nameZh: cuvsRow['nameLocal'] as String,
        nameZhHant: Value(cuvtRow['nameLocal'] as String),
        nameEn: webRow['nameEn'] as String,
        abbreviationZh: Value(cuvsRow['abbrLocal'] as String),
        abbreviationZhHant: Value(cuvtRow['abbrLocal'] as String),
        abbreviationEn: Value(webRow['abbrEn'] as String),
        chapterCount: webRow['chapterCount'] as int,
        sortOrder: webRow['canonicalOrder'] as int,
        updatedAt: updatedAt,
      );
    }).toList();
  }

  Future<List<Map<String, Object?>>> _loadBookRows(String versionId) async {
    final raw = await assetBundle.loadString(
      'assets/bible/$versionId/books.json',
    );
    return (jsonDecode(raw) as List<Object?>).cast<Map<String, Object?>>();
  }

  List<LocalBibleTranslationsCompanion> _loadTranslations(DateTime updatedAt) {
    return _translations.map((translation) {
      return LocalBibleTranslationsCompanion.insert(
        id: translation.id,
        localeCode: translation.localeCode,
        name: translation.name,
        abbreviation: translation.abbreviation,
        copyrightStatus: translation.copyrightStatus,
        sourceUrl: translation.sourceUrl,
        updatedAt: updatedAt,
      );
    }).toList();
  }

  Future<List<LocalBibleVerseTextsCompanion>> _loadVerseTexts(
    String versionId,
    DateTime updatedAt,
  ) async {
    final raw = await assetBundle.loadString(
      'assets/bible/$versionId/verses.jsonl',
    );
    final lines = const LineSplitter().convert(raw);
    final verses = <LocalBibleVerseTextsCompanion>[];

    for (final line in lines) {
      if (line.trim().isEmpty) {
        continue;
      }
      final row = jsonDecode(line) as Map<String, Object?>;
      verses.add(
        LocalBibleVerseTextsCompanion.insert(
          id: '$versionId.${row['id']}',
          versionId: versionId,
          verseId: row['id'] as String,
          bookId: row['bookId'] as String,
          chapter: row['chapter'] as int,
          verse: row['verse'] as int,
          verseText: row['text'] as String,
          updatedAt: updatedAt,
        ),
      );
    }

    return verses;
  }

  Future<int> _countVerseTexts(String versionId) async {
    final countColumn = database.localBibleVerseTexts.id.count();
    final query = database.selectOnly(database.localBibleVerseTexts)
      ..addColumns([countColumn])
      ..where(database.localBibleVerseTexts.versionId.equals(versionId));
    final row = await query.getSingle();
    return row.read(countColumn) ?? 0;
  }

  String _verseSeedVersionKey(String versionId) =>
      'bible_seed_version:verse:$versionId';

  void _assertSupportedVersion(String versionId) {
    final isSupported = _translations.any(
      (translation) => translation.id == versionId,
    );
    if (!isSupported) {
      throw ArgumentError.value(
        versionId,
        'versionId',
        'Unsupported Bible translation.',
      );
    }
  }
}

class _SeedTranslation {
  const _SeedTranslation({
    required this.id,
    required this.localeCode,
    required this.name,
    required this.abbreviation,
    required this.copyrightStatus,
    required this.sourceUrl,
  });

  final String id;
  final String localeCode;
  final String name;
  final String abbreviation;
  final String copyrightStatus;
  final String sourceUrl;
}
