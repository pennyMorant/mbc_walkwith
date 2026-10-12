import '../../domain/bible_note.dart';

const _authorTypes = {'member', 'external'};

class BibleVerseNoteDto {
  const BibleVerseNoteDto({
    required this.id,
    required this.verseId,
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.content,
    required this.authorType,
    required this.authorDisplayName,
    required this.isMine,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BibleVerseNoteDto.fromJson(Map<String, Object?> json) {
    final bookId = _readString(json, 'bookId', allowEmpty: false);
    final chapter = _readPositiveInt(json, 'chapter');
    final verse = _readPositiveInt(json, 'verse');
    final verseId = _readString(json, 'verseId', allowEmpty: false);
    if (verseId != '$bookId.$chapter.$verse') {
      throw const FormatException(
        'Bible verse note verseId does not match its reference.',
      );
    }
    final createdAt = _readDateTime(json, 'createdAt');
    final updatedAt = _readDateTime(json, 'updatedAt');
    if (updatedAt.isBefore(createdAt)) {
      throw const FormatException(
        'Bible verse note updatedAt must not precede createdAt.',
      );
    }
    return BibleVerseNoteDto(
      id: _readString(json, 'id', allowEmpty: false),
      verseId: verseId,
      bookId: bookId,
      chapter: chapter,
      verse: verse,
      content: _readString(json, 'content', allowEmpty: false),
      authorType: _readEnum(json, 'authorType', _authorTypes),
      authorDisplayName: _readString(
        json,
        'authorDisplayName',
        allowEmpty: false,
      ),
      isMine: _readBool(json, 'isMine'),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  final String id;
  final String verseId;
  final String bookId;
  final int chapter;
  final int verse;
  final String content;
  final String authorType;
  final String authorDisplayName;
  final bool isMine;
  final DateTime createdAt;
  final DateTime updatedAt;

  BibleVerseNote toDomain() {
    return BibleVerseNote(
      id: id,
      verseId: verseId,
      bookId: bookId,
      chapter: chapter,
      verse: verse,
      content: content,
      authorType: authorType,
      authorDisplayName: authorDisplayName,
      isMine: isMine,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

BibleVerseNote readBibleVerseNoteResponse(Map<String, Object?> response) {
  return BibleVerseNoteDto.fromJson(_readData(response)).toDomain();
}

List<BibleVerseNote> readBibleVerseNoteItems(Map<String, Object?> response) {
  final items = _readData(response)['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException(
      'Bible verse note response items must be an object list.',
    );
  }
  return items
      .cast<Map<String, Object?>>()
      .map(BibleVerseNoteDto.fromJson)
      .map((dto) => dto.toDomain())
      .toList(growable: false);
}

Map<String, Object?> _readData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException(
      'Bible verse note response data must be an object.',
    );
  }
  return data;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = true,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('Bible verse note $key must be a string.');
  }
  return value;
}

String _readEnum(Map<String, Object?> json, String key, Set<String> values) {
  final value = _readString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('Bible verse note $key is unsupported.');
  }
  return value;
}

int _readPositiveInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value <= 0) {
    throw FormatException('Bible verse note $key must be a positive integer.');
  }
  return value;
}

bool _readBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! bool) {
    throw FormatException('Bible verse note $key must be a boolean.');
  }
  return value;
}

DateTime _readDateTime(Map<String, Object?> json, String key) {
  final value = _readString(json, key, allowEmpty: false);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('Bible verse note $key must be an ISO date-time.');
  }
  return parsed;
}
