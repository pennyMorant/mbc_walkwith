import 'dart:convert';
import 'dart:io';

const _versions = [
  _VersionConfig(
    versionId: 'web',
    sourceId: 'engwebp',
    sourceArchivePath:
        'packages/bible_content/sources/web/raw/engwebp_usfm.zip',
    outputDirectoryPath: 'packages/bible_content/sources/web/normalized',
  ),
  _VersionConfig(
    versionId: 'cuvs',
    sourceId: 'cmn-cu89s',
    sourceArchivePath:
        'packages/bible_content/sources/cuvs/raw/cmn-cu89s_usfm.zip',
    outputDirectoryPath: 'packages/bible_content/sources/cuvs/normalized',
  ),
  _VersionConfig(
    versionId: 'cuvt',
    sourceId: 'cmn-cu89t',
    sourceArchivePath:
        'packages/bible_content/sources/cuvt/raw/cmn-cu89t_usfm.zip',
    outputDirectoryPath: 'packages/bible_content/sources/cuvt/normalized',
  ),
];

void main() {
  for (final version in _versions) {
    _normalizeVersion(version);
  }
}

void _normalizeVersion(_VersionConfig version) {
  final archive = File(version.sourceArchivePath);
  if (!archive.existsSync()) {
    throw StateError('Missing source archive: ${archive.path}');
  }

  final outputDirectory = Directory(version.outputDirectoryPath)
    ..createSync(recursive: true);
  final sourceFiles = _listUsfmSourceFiles(archive.path, version.sourceId);

  final books = <Map<String, Object?>>[];
  final chapters = <Map<String, Object?>>[];
  final verses = <Map<String, Object?>>[];
  final mappings = <Map<String, Object?>>[];

  for (final book in _books) {
    final sourceFile = sourceFiles[book.usfmId];
    if (sourceFile == null) {
      throw StateError('Missing USFM file for ${book.usfmId}');
    }

    final usfm = _readZipEntry(archive.path, sourceFile);
    final parsed = _parseBookUsfm(usfm, book, sourceFile, version);

    books.add(parsed.book);
    chapters.addAll(parsed.chapters);
    verses.addAll(parsed.verses);
    mappings.add(parsed.mapping);
  }

  _validateCounts(books: books, chapters: chapters, verses: verses);

  _writeJson(File('${outputDirectory.path}/books.json'), books);
  _writeJson(File('${outputDirectory.path}/book_mappings.json'), mappings);
  _writeJson(File('${outputDirectory.path}/index.json'), {
    'versionId': version.versionId,
    'sourceId': version.sourceId,
    'sourceArchive': version.sourceArchivePath,
    'bookCount': books.length,
    'chapterCount': chapters.length,
    'verseCount': verses.length,
    'emptyVerseCount': verses.where((verse) => verse['isEmpty'] == true).length,
    'idPattern': {'bookId': 'rom', 'chapterId': 'rom.8', 'verseId': 'rom.8.28'},
    'outputs': {
      'books': 'books.json',
      'bookMappings': 'book_mappings.json',
      'chapters': 'chapters.jsonl',
      'verses': 'verses.jsonl',
    },
  });
  _writeJsonLines(File('${outputDirectory.path}/chapters.jsonl'), chapters);
  _writeJsonLines(File('${outputDirectory.path}/verses.jsonl'), verses);

  stdout.writeln(
    'Generated ${version.versionId}: ${books.length} books, ${chapters.length} chapters, '
    '${verses.length} verses.',
  );
}

Map<String, String> _listUsfmSourceFiles(String archivePath, String sourceId) {
  final result = Process.runSync('unzip', ['-Z', '-1', archivePath]);
  if (result.exitCode != 0) {
    throw StateError('Failed to list zip entries: ${result.stderr}');
  }

  final files = <String, String>{};
  final lines = const LineSplitter().convert(result.stdout as String);
  final escapedSourceId = RegExp.escape(sourceId);
  for (final line in lines) {
    final match = RegExp(
      '^\\d+-([1-3]?[A-Z]{2,3})$escapedSourceId\\.usfm\$',
    ).firstMatch(line.trim());
    if (match == null) {
      continue;
    }
    files[match.group(1)!] = line.trim();
  }
  return files;
}

String _readZipEntry(String archivePath, String entryName) {
  final result = Process.runSync('unzip', ['-p', archivePath, entryName]);
  if (result.exitCode != 0) {
    throw StateError('Failed to read $entryName: ${result.stderr}');
  }
  return result.stdout as String;
}

_ParsedBook _parseBookUsfm(
  String usfm,
  _BookDefinition book,
  String sourceFile,
  _VersionConfig version,
) {
  final lines = const LineSplitter().convert(usfm);
  final toc1 = _readMarkerValue(lines, 'toc1') ?? book.nameEn;
  final toc2 = _readMarkerValue(lines, 'toc2') ?? book.nameEn;
  final toc3 = _readMarkerValue(lines, 'toc3') ?? book.abbrEn;
  final chapters = <Map<String, Object?>>[];
  final verses = <Map<String, Object?>>[];
  final verseCountsByChapter = <int, int>{};

  int? chapter;
  int? verse;
  final textBuffer = StringBuffer();

  void flushVerse() {
    if (chapter == null || verse == null) {
      return;
    }

    final text = _normalizeWhitespace(textBuffer.toString());
    final currentChapter = chapter;
    final currentVerse = verse;

    verseCountsByChapter[currentChapter] =
        (verseCountsByChapter[currentChapter] ?? 0) + 1;
    verses.add({
      'id': '${book.id}.$currentChapter.$currentVerse',
      'versionId': version.versionId,
      'bookId': book.id,
      'chapterId': '${book.id}.$currentChapter',
      'chapter': currentChapter,
      'verse': currentVerse,
      'text': text,
      'isEmpty': text.isEmpty,
      'sourceFile': sourceFile,
    });

    textBuffer.clear();
  }

  for (final rawLine in lines) {
    final line = rawLine.trim();
    if (line.isEmpty) {
      continue;
    }

    final chapterMatch = RegExp(r'^\\c\s+(\d+)').firstMatch(line);
    if (chapterMatch != null) {
      flushVerse();
      chapter = int.parse(chapterMatch.group(1)!);
      verse = null;
      continue;
    }

    final verseMatch = RegExp(r'\\v\s+(\d+)\s*(.*)$').firstMatch(line);
    if (verseMatch != null) {
      flushVerse();
      if (chapter == null) {
        throw StateError('Verse before chapter in $sourceFile');
      }
      verse = int.parse(verseMatch.group(1)!);
      final verseText = _stripUsfmInlineMarkup(verseMatch.group(2)!);
      if (verseText.isNotEmpty) {
        textBuffer.write(' ');
        textBuffer.write(verseText);
      }
      continue;
    }

    if (chapter != null && verse != null) {
      if (_isNonVerseHeadingOrMetadataLine(line)) {
        continue;
      }
      final continuation = _stripUsfmInlineMarkup(line);
      if (continuation.isNotEmpty) {
        textBuffer.write(' ');
        textBuffer.write(continuation);
      }
    }
  }

  flushVerse();

  for (final entry in verseCountsByChapter.entries) {
    chapters.add({
      'id': '${book.id}.${entry.key}',
      'versionId': version.versionId,
      'bookId': book.id,
      'chapter': entry.key,
      'verseCount': entry.value,
      'canonicalOrder': book.canonicalOrder,
      'sourceFile': sourceFile,
    });
  }

  final chapterCount = chapters.length;
  return _ParsedBook(
    book: {
      'id': book.id,
      'versionId': version.versionId,
      'usfmId': book.usfmId,
      'osisId': book.osisId,
      'testament': book.testament,
      'category': book.category,
      'canonicalOrder': book.canonicalOrder,
      'nameEn': version.versionId == 'web' ? toc2 : book.nameEn,
      'nameZh': book.nameZh,
      'nameLocal': toc2,
      'titleEn': toc1,
      'titleLocal': toc1,
      'abbrEn': toc3,
      'abbrZh': book.abbrZh,
      'abbrLocal': toc3,
      'chapterCount': chapterCount,
      'sourceFile': sourceFile,
    },
    chapters: chapters,
    verses: verses,
    mapping: {
      'bookId': book.id,
      'versionId': version.versionId,
      'canonicalOrder': book.canonicalOrder,
      'usfmId': book.usfmId,
      'osisId': book.osisId,
      'aliases': book.aliases,
    },
  );
}

String? _readMarkerValue(List<String> lines, String marker) {
  for (final line in lines) {
    final match = RegExp('^\\\\$marker\\s+(.+)\$').firstMatch(line.trim());
    if (match != null) {
      return _normalizeWhitespace(_stripUsfmInlineMarkup(match.group(1)!));
    }
  }
  return null;
}

String _stripUsfmInlineMarkup(String text) {
  var result = text;

  result = result.replaceAll(RegExp(r'\\f\s+.*?\\f\*'), ' ');
  result = result.replaceAll(RegExp(r'\\x\s+.*?\\x\*'), ' ');
  result = result.replaceAllMapped(
    RegExp(r'\\\+?w\s+([^|\\]+)(?:\|[^\\]*?)?\\\+?w\*'),
    (match) => match.group(1) ?? '',
  );
  result = result.replaceAll(RegExp(r'\\\+?[A-Za-z0-9-]+\*?'), ' ');
  result = result.replaceAllMapped(
    RegExp(r'\s+([,.;:?!])'),
    (match) => match.group(1) ?? '',
  );
  result = result.replaceAllMapped(
    RegExp(r'([“‘"(\[])\s+'),
    (match) => match.group(1) ?? '',
  );

  return _normalizeWhitespace(result);
}

bool _isNonVerseHeadingOrMetadataLine(String line) {
  final match = RegExp(r'^\\([A-Za-z0-9]+)\b').firstMatch(line);
  if (match == null) {
    return false;
  }
  final marker = match.group(1)!.toLowerCase();
  if (_nonVerseHeadingAndMetadataMarkers.contains(marker)) {
    return true;
  }
  return marker.startsWith('s') || marker.startsWith('mt');
}

const _nonVerseHeadingAndMetadataMarkers = {
  'id',
  'ide',
  'usfm',
  'h',
  'toc1',
  'toc2',
  'toc3',
  'rem',
  'cl',
  'cp',
  'cd',
  'ms',
  'mr',
  'r',
  'd',
  'sp',
  'b',
};

String _normalizeWhitespace(String text) {
  return text.replaceAll('\u00a0', ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
}

void _writeJson(File file, Object value) {
  const encoder = JsonEncoder.withIndent('  ');
  file.writeAsStringSync('${encoder.convert(value)}\n');
}

void _writeJsonLines(File file, List<Map<String, Object?>> values) {
  final sink = file.openWrite();
  for (final value in values) {
    sink.writeln(jsonEncode(value));
  }
  sink.close();
}

void _validateCounts({
  required List<Map<String, Object?>> books,
  required List<Map<String, Object?>> chapters,
  required List<Map<String, Object?>> verses,
}) {
  if (books.length != 66) {
    throw StateError('Expected 66 books, got ${books.length}');
  }
  if (chapters.length != 1189) {
    throw StateError('Expected 1189 chapters, got ${chapters.length}');
  }
  if (verses.length < 31000 || verses.length > 31200) {
    throw StateError(
      'Expected roughly 31k source verse markers, got ${verses.length}',
    );
  }
}

class _ParsedBook {
  const _ParsedBook({
    required this.book,
    required this.chapters,
    required this.verses,
    required this.mapping,
  });

  final Map<String, Object?> book;
  final List<Map<String, Object?>> chapters;
  final List<Map<String, Object?>> verses;
  final Map<String, Object?> mapping;
}

class _VersionConfig {
  const _VersionConfig({
    required this.versionId,
    required this.sourceId,
    required this.sourceArchivePath,
    required this.outputDirectoryPath,
  });

  final String versionId;
  final String sourceId;
  final String sourceArchivePath;
  final String outputDirectoryPath;
}

class _BookDefinition {
  const _BookDefinition({
    required this.id,
    required this.usfmId,
    required this.osisId,
    required this.testament,
    required this.category,
    required this.canonicalOrder,
    required this.nameEn,
    required this.nameZh,
    required this.abbrEn,
    required this.abbrZh,
  });

  final String id;
  final String usfmId;
  final String osisId;
  final String testament;
  final String category;
  final int canonicalOrder;
  final String nameEn;
  final String nameZh;
  final String abbrEn;
  final String abbrZh;

  List<String> get aliases {
    return {
      id,
      usfmId,
      osisId,
      nameEn,
      nameEn.toLowerCase(),
      abbrEn,
      abbrEn.toLowerCase(),
      nameZh,
      abbrZh,
      canonicalOrder.toString(),
      canonicalOrder.toString().padLeft(2, '0'),
    }.toList();
  }
}

const _books = [
  _BookDefinition(
    id: 'gen',
    usfmId: 'GEN',
    osisId: 'Gen',
    testament: 'old',
    category: 'law',
    canonicalOrder: 1,
    nameEn: 'Genesis',
    nameZh: '创世记',
    abbrEn: 'Gen',
    abbrZh: '创',
  ),
  _BookDefinition(
    id: 'exo',
    usfmId: 'EXO',
    osisId: 'Exod',
    testament: 'old',
    category: 'law',
    canonicalOrder: 2,
    nameEn: 'Exodus',
    nameZh: '出埃及记',
    abbrEn: 'Exod',
    abbrZh: '出',
  ),
  _BookDefinition(
    id: 'lev',
    usfmId: 'LEV',
    osisId: 'Lev',
    testament: 'old',
    category: 'law',
    canonicalOrder: 3,
    nameEn: 'Leviticus',
    nameZh: '利未记',
    abbrEn: 'Lev',
    abbrZh: '利',
  ),
  _BookDefinition(
    id: 'num',
    usfmId: 'NUM',
    osisId: 'Num',
    testament: 'old',
    category: 'law',
    canonicalOrder: 4,
    nameEn: 'Numbers',
    nameZh: '民数记',
    abbrEn: 'Num',
    abbrZh: '民',
  ),
  _BookDefinition(
    id: 'deu',
    usfmId: 'DEU',
    osisId: 'Deut',
    testament: 'old',
    category: 'law',
    canonicalOrder: 5,
    nameEn: 'Deuteronomy',
    nameZh: '申命记',
    abbrEn: 'Deut',
    abbrZh: '申',
  ),
  _BookDefinition(
    id: 'jos',
    usfmId: 'JOS',
    osisId: 'Josh',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 6,
    nameEn: 'Joshua',
    nameZh: '约书亚记',
    abbrEn: 'Josh',
    abbrZh: '书',
  ),
  _BookDefinition(
    id: 'jdg',
    usfmId: 'JDG',
    osisId: 'Judg',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 7,
    nameEn: 'Judges',
    nameZh: '士师记',
    abbrEn: 'Judg',
    abbrZh: '士',
  ),
  _BookDefinition(
    id: 'rut',
    usfmId: 'RUT',
    osisId: 'Ruth',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 8,
    nameEn: 'Ruth',
    nameZh: '路得记',
    abbrEn: 'Ruth',
    abbrZh: '得',
  ),
  _BookDefinition(
    id: '1sa',
    usfmId: '1SA',
    osisId: '1Sam',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 9,
    nameEn: '1 Samuel',
    nameZh: '撒母耳记上',
    abbrEn: '1 Sam',
    abbrZh: '撒上',
  ),
  _BookDefinition(
    id: '2sa',
    usfmId: '2SA',
    osisId: '2Sam',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 10,
    nameEn: '2 Samuel',
    nameZh: '撒母耳记下',
    abbrEn: '2 Sam',
    abbrZh: '撒下',
  ),
  _BookDefinition(
    id: '1ki',
    usfmId: '1KI',
    osisId: '1Kgs',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 11,
    nameEn: '1 Kings',
    nameZh: '列王纪上',
    abbrEn: '1 Kgs',
    abbrZh: '王上',
  ),
  _BookDefinition(
    id: '2ki',
    usfmId: '2KI',
    osisId: '2Kgs',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 12,
    nameEn: '2 Kings',
    nameZh: '列王纪下',
    abbrEn: '2 Kgs',
    abbrZh: '王下',
  ),
  _BookDefinition(
    id: '1ch',
    usfmId: '1CH',
    osisId: '1Chr',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 13,
    nameEn: '1 Chronicles',
    nameZh: '历代志上',
    abbrEn: '1 Chr',
    abbrZh: '代上',
  ),
  _BookDefinition(
    id: '2ch',
    usfmId: '2CH',
    osisId: '2Chr',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 14,
    nameEn: '2 Chronicles',
    nameZh: '历代志下',
    abbrEn: '2 Chr',
    abbrZh: '代下',
  ),
  _BookDefinition(
    id: 'ezr',
    usfmId: 'EZR',
    osisId: 'Ezra',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 15,
    nameEn: 'Ezra',
    nameZh: '以斯拉记',
    abbrEn: 'Ezra',
    abbrZh: '拉',
  ),
  _BookDefinition(
    id: 'neh',
    usfmId: 'NEH',
    osisId: 'Neh',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 16,
    nameEn: 'Nehemiah',
    nameZh: '尼希米记',
    abbrEn: 'Neh',
    abbrZh: '尼',
  ),
  _BookDefinition(
    id: 'est',
    usfmId: 'EST',
    osisId: 'Esth',
    testament: 'old',
    category: 'old_testament_history',
    canonicalOrder: 17,
    nameEn: 'Esther',
    nameZh: '以斯帖记',
    abbrEn: 'Esth',
    abbrZh: '斯',
  ),
  _BookDefinition(
    id: 'job',
    usfmId: 'JOB',
    osisId: 'Job',
    testament: 'old',
    category: 'wisdom',
    canonicalOrder: 18,
    nameEn: 'Job',
    nameZh: '约伯记',
    abbrEn: 'Job',
    abbrZh: '伯',
  ),
  _BookDefinition(
    id: 'psa',
    usfmId: 'PSA',
    osisId: 'Ps',
    testament: 'old',
    category: 'wisdom',
    canonicalOrder: 19,
    nameEn: 'Psalms',
    nameZh: '诗篇',
    abbrEn: 'Ps',
    abbrZh: '诗',
  ),
  _BookDefinition(
    id: 'pro',
    usfmId: 'PRO',
    osisId: 'Prov',
    testament: 'old',
    category: 'wisdom',
    canonicalOrder: 20,
    nameEn: 'Proverbs',
    nameZh: '箴言',
    abbrEn: 'Prov',
    abbrZh: '箴',
  ),
  _BookDefinition(
    id: 'ecc',
    usfmId: 'ECC',
    osisId: 'Eccl',
    testament: 'old',
    category: 'wisdom',
    canonicalOrder: 21,
    nameEn: 'Ecclesiastes',
    nameZh: '传道书',
    abbrEn: 'Eccl',
    abbrZh: '传',
  ),
  _BookDefinition(
    id: 'sng',
    usfmId: 'SNG',
    osisId: 'Song',
    testament: 'old',
    category: 'wisdom',
    canonicalOrder: 22,
    nameEn: 'Song of Songs',
    nameZh: '雅歌',
    abbrEn: 'Song',
    abbrZh: '歌',
  ),
  _BookDefinition(
    id: 'isa',
    usfmId: 'ISA',
    osisId: 'Isa',
    testament: 'old',
    category: 'major_prophets',
    canonicalOrder: 23,
    nameEn: 'Isaiah',
    nameZh: '以赛亚书',
    abbrEn: 'Isa',
    abbrZh: '赛',
  ),
  _BookDefinition(
    id: 'jer',
    usfmId: 'JER',
    osisId: 'Jer',
    testament: 'old',
    category: 'major_prophets',
    canonicalOrder: 24,
    nameEn: 'Jeremiah',
    nameZh: '耶利米书',
    abbrEn: 'Jer',
    abbrZh: '耶',
  ),
  _BookDefinition(
    id: 'lam',
    usfmId: 'LAM',
    osisId: 'Lam',
    testament: 'old',
    category: 'major_prophets',
    canonicalOrder: 25,
    nameEn: 'Lamentations',
    nameZh: '耶利米哀歌',
    abbrEn: 'Lam',
    abbrZh: '哀',
  ),
  _BookDefinition(
    id: 'ezk',
    usfmId: 'EZK',
    osisId: 'Ezek',
    testament: 'old',
    category: 'major_prophets',
    canonicalOrder: 26,
    nameEn: 'Ezekiel',
    nameZh: '以西结书',
    abbrEn: 'Ezek',
    abbrZh: '结',
  ),
  _BookDefinition(
    id: 'dan',
    usfmId: 'DAN',
    osisId: 'Dan',
    testament: 'old',
    category: 'major_prophets',
    canonicalOrder: 27,
    nameEn: 'Daniel',
    nameZh: '但以理书',
    abbrEn: 'Dan',
    abbrZh: '但',
  ),
  _BookDefinition(
    id: 'hos',
    usfmId: 'HOS',
    osisId: 'Hos',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 28,
    nameEn: 'Hosea',
    nameZh: '何西阿书',
    abbrEn: 'Hos',
    abbrZh: '何',
  ),
  _BookDefinition(
    id: 'jol',
    usfmId: 'JOL',
    osisId: 'Joel',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 29,
    nameEn: 'Joel',
    nameZh: '约珥书',
    abbrEn: 'Joel',
    abbrZh: '珥',
  ),
  _BookDefinition(
    id: 'amo',
    usfmId: 'AMO',
    osisId: 'Amos',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 30,
    nameEn: 'Amos',
    nameZh: '阿摩司书',
    abbrEn: 'Amos',
    abbrZh: '摩',
  ),
  _BookDefinition(
    id: 'oba',
    usfmId: 'OBA',
    osisId: 'Obad',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 31,
    nameEn: 'Obadiah',
    nameZh: '俄巴底亚书',
    abbrEn: 'Obad',
    abbrZh: '俄',
  ),
  _BookDefinition(
    id: 'jon',
    usfmId: 'JON',
    osisId: 'Jonah',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 32,
    nameEn: 'Jonah',
    nameZh: '约拿书',
    abbrEn: 'Jonah',
    abbrZh: '拿',
  ),
  _BookDefinition(
    id: 'mic',
    usfmId: 'MIC',
    osisId: 'Mic',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 33,
    nameEn: 'Micah',
    nameZh: '弥迦书',
    abbrEn: 'Mic',
    abbrZh: '弥',
  ),
  _BookDefinition(
    id: 'nam',
    usfmId: 'NAM',
    osisId: 'Nah',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 34,
    nameEn: 'Nahum',
    nameZh: '那鸿书',
    abbrEn: 'Nah',
    abbrZh: '鸿',
  ),
  _BookDefinition(
    id: 'hab',
    usfmId: 'HAB',
    osisId: 'Hab',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 35,
    nameEn: 'Habakkuk',
    nameZh: '哈巴谷书',
    abbrEn: 'Hab',
    abbrZh: '哈',
  ),
  _BookDefinition(
    id: 'zep',
    usfmId: 'ZEP',
    osisId: 'Zeph',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 36,
    nameEn: 'Zephaniah',
    nameZh: '西番雅书',
    abbrEn: 'Zeph',
    abbrZh: '番',
  ),
  _BookDefinition(
    id: 'hag',
    usfmId: 'HAG',
    osisId: 'Hag',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 37,
    nameEn: 'Haggai',
    nameZh: '哈该书',
    abbrEn: 'Hag',
    abbrZh: '该',
  ),
  _BookDefinition(
    id: 'zec',
    usfmId: 'ZEC',
    osisId: 'Zech',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 38,
    nameEn: 'Zechariah',
    nameZh: '撒迦利亚书',
    abbrEn: 'Zech',
    abbrZh: '亚',
  ),
  _BookDefinition(
    id: 'mal',
    usfmId: 'MAL',
    osisId: 'Mal',
    testament: 'old',
    category: 'minor_prophets',
    canonicalOrder: 39,
    nameEn: 'Malachi',
    nameZh: '玛拉基书',
    abbrEn: 'Mal',
    abbrZh: '玛',
  ),
  _BookDefinition(
    id: 'mat',
    usfmId: 'MAT',
    osisId: 'Matt',
    testament: 'new',
    category: 'gospels',
    canonicalOrder: 40,
    nameEn: 'Matthew',
    nameZh: '马太福音',
    abbrEn: 'Matt',
    abbrZh: '太',
  ),
  _BookDefinition(
    id: 'mrk',
    usfmId: 'MRK',
    osisId: 'Mark',
    testament: 'new',
    category: 'gospels',
    canonicalOrder: 41,
    nameEn: 'Mark',
    nameZh: '马可福音',
    abbrEn: 'Mark',
    abbrZh: '可',
  ),
  _BookDefinition(
    id: 'luk',
    usfmId: 'LUK',
    osisId: 'Luke',
    testament: 'new',
    category: 'gospels',
    canonicalOrder: 42,
    nameEn: 'Luke',
    nameZh: '路加福音',
    abbrEn: 'Luke',
    abbrZh: '路',
  ),
  _BookDefinition(
    id: 'jhn',
    usfmId: 'JHN',
    osisId: 'John',
    testament: 'new',
    category: 'gospels',
    canonicalOrder: 43,
    nameEn: 'John',
    nameZh: '约翰福音',
    abbrEn: 'John',
    abbrZh: '约',
  ),
  _BookDefinition(
    id: 'act',
    usfmId: 'ACT',
    osisId: 'Acts',
    testament: 'new',
    category: 'acts',
    canonicalOrder: 44,
    nameEn: 'Acts',
    nameZh: '使徒行传',
    abbrEn: 'Acts',
    abbrZh: '徒',
  ),
  _BookDefinition(
    id: 'rom',
    usfmId: 'ROM',
    osisId: 'Rom',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 45,
    nameEn: 'Romans',
    nameZh: '罗马书',
    abbrEn: 'Rom',
    abbrZh: '罗',
  ),
  _BookDefinition(
    id: '1co',
    usfmId: '1CO',
    osisId: '1Cor',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 46,
    nameEn: '1 Corinthians',
    nameZh: '哥林多前书',
    abbrEn: '1 Cor',
    abbrZh: '林前',
  ),
  _BookDefinition(
    id: '2co',
    usfmId: '2CO',
    osisId: '2Cor',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 47,
    nameEn: '2 Corinthians',
    nameZh: '哥林多后书',
    abbrEn: '2 Cor',
    abbrZh: '林后',
  ),
  _BookDefinition(
    id: 'gal',
    usfmId: 'GAL',
    osisId: 'Gal',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 48,
    nameEn: 'Galatians',
    nameZh: '加拉太书',
    abbrEn: 'Gal',
    abbrZh: '加',
  ),
  _BookDefinition(
    id: 'eph',
    usfmId: 'EPH',
    osisId: 'Eph',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 49,
    nameEn: 'Ephesians',
    nameZh: '以弗所书',
    abbrEn: 'Eph',
    abbrZh: '弗',
  ),
  _BookDefinition(
    id: 'php',
    usfmId: 'PHP',
    osisId: 'Phil',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 50,
    nameEn: 'Philippians',
    nameZh: '腓立比书',
    abbrEn: 'Phil',
    abbrZh: '腓',
  ),
  _BookDefinition(
    id: 'col',
    usfmId: 'COL',
    osisId: 'Col',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 51,
    nameEn: 'Colossians',
    nameZh: '歌罗西书',
    abbrEn: 'Col',
    abbrZh: '西',
  ),
  _BookDefinition(
    id: '1th',
    usfmId: '1TH',
    osisId: '1Thess',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 52,
    nameEn: '1 Thessalonians',
    nameZh: '帖撒罗尼迦前书',
    abbrEn: '1 Thess',
    abbrZh: '帖前',
  ),
  _BookDefinition(
    id: '2th',
    usfmId: '2TH',
    osisId: '2Thess',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 53,
    nameEn: '2 Thessalonians',
    nameZh: '帖撒罗尼迦后书',
    abbrEn: '2 Thess',
    abbrZh: '帖后',
  ),
  _BookDefinition(
    id: '1ti',
    usfmId: '1TI',
    osisId: '1Tim',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 54,
    nameEn: '1 Timothy',
    nameZh: '提摩太前书',
    abbrEn: '1 Tim',
    abbrZh: '提前',
  ),
  _BookDefinition(
    id: '2ti',
    usfmId: '2TI',
    osisId: '2Tim',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 55,
    nameEn: '2 Timothy',
    nameZh: '提摩太后书',
    abbrEn: '2 Tim',
    abbrZh: '提后',
  ),
  _BookDefinition(
    id: 'tit',
    usfmId: 'TIT',
    osisId: 'Titus',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 56,
    nameEn: 'Titus',
    nameZh: '提多书',
    abbrEn: 'Titus',
    abbrZh: '多',
  ),
  _BookDefinition(
    id: 'phm',
    usfmId: 'PHM',
    osisId: 'Phlm',
    testament: 'new',
    category: 'pauline_letters',
    canonicalOrder: 57,
    nameEn: 'Philemon',
    nameZh: '腓利门书',
    abbrEn: 'Phlm',
    abbrZh: '门',
  ),
  _BookDefinition(
    id: 'heb',
    usfmId: 'HEB',
    osisId: 'Heb',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 58,
    nameEn: 'Hebrews',
    nameZh: '希伯来书',
    abbrEn: 'Heb',
    abbrZh: '来',
  ),
  _BookDefinition(
    id: 'jas',
    usfmId: 'JAS',
    osisId: 'Jas',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 59,
    nameEn: 'James',
    nameZh: '雅各书',
    abbrEn: 'Jas',
    abbrZh: '雅',
  ),
  _BookDefinition(
    id: '1pe',
    usfmId: '1PE',
    osisId: '1Pet',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 60,
    nameEn: '1 Peter',
    nameZh: '彼得前书',
    abbrEn: '1 Pet',
    abbrZh: '彼前',
  ),
  _BookDefinition(
    id: '2pe',
    usfmId: '2PE',
    osisId: '2Pet',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 61,
    nameEn: '2 Peter',
    nameZh: '彼得后书',
    abbrEn: '2 Pet',
    abbrZh: '彼后',
  ),
  _BookDefinition(
    id: '1jn',
    usfmId: '1JN',
    osisId: '1John',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 62,
    nameEn: '1 John',
    nameZh: '约翰一书',
    abbrEn: '1 John',
    abbrZh: '约一',
  ),
  _BookDefinition(
    id: '2jn',
    usfmId: '2JN',
    osisId: '2John',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 63,
    nameEn: '2 John',
    nameZh: '约翰二书',
    abbrEn: '2 John',
    abbrZh: '约二',
  ),
  _BookDefinition(
    id: '3jn',
    usfmId: '3JN',
    osisId: '3John',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 64,
    nameEn: '3 John',
    nameZh: '约翰三书',
    abbrEn: '3 John',
    abbrZh: '约三',
  ),
  _BookDefinition(
    id: 'jud',
    usfmId: 'JUD',
    osisId: 'Jude',
    testament: 'new',
    category: 'general_letters',
    canonicalOrder: 65,
    nameEn: 'Jude',
    nameZh: '犹大书',
    abbrEn: 'Jude',
    abbrZh: '犹',
  ),
  _BookDefinition(
    id: 'rev',
    usfmId: 'REV',
    osisId: 'Rev',
    testament: 'new',
    category: 'apocalyptic',
    canonicalOrder: 66,
    nameEn: 'Revelation',
    nameZh: '启示录',
    abbrEn: 'Rev',
    abbrZh: '启',
  ),
];
