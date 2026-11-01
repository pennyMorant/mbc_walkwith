import '../../domain/sermon.dart';

const _sermonStatuses = {
  'draft',
  'processing',
  'needs_review',
  'published',
  'archived',
  'failed',
};
const _sermonAudioStatuses = {'missing', 'ready', 'failed'};
const _contentLocales = {'en', 'es', 'zh-Hans', 'zh-Hant'};

class SermonDto {
  const SermonDto({
    required this.id,
    required this.title,
    required this.speaker,
    required this.date,
    required this.series,
    required this.topics,
    required this.primaryReference,
    required this.durationSeconds,
    required this.summary,
    required this.outline,
    required this.references,
    this.transcript,
    this.audioUrl,
    this.thumbnailUrl,
  });

  final String id;
  final String title;
  final String speaker;
  final String date;
  final String series;
  final List<String> topics;
  final String primaryReference;
  final int durationSeconds;
  final String summary;
  final List<SermonOutlineItemDto> outline;
  final List<SermonReferenceDto> references;
  final SermonTranscriptDto? transcript;
  final String? audioUrl;
  final String? thumbnailUrl;

  factory SermonDto.fromJson(Map<String, Object?> json, {String? apiBaseUrl}) {
    _validatePublicSermonMetadata(json);
    return SermonDto(
      id: _readString(json, 'id', allowEmpty: false),
      title: _readString(json, 'title'),
      speaker: _readString(json, 'speaker'),
      date: _readDate(json, 'sermonDate'),
      series: _readNullableString(json, 'series') ?? '',
      topics: _stringListFromJson(json['topics']),
      primaryReference: _readNullableString(json, 'primaryReference') ?? '',
      durationSeconds: _readNonNegativeInt(json, 'durationSeconds'),
      summary: _readNullableString(json, 'summary') ?? '',
      outline: _readObjectList(
        json,
        'outline',
      ).map(SermonOutlineItemDto.fromJson).toList(),
      references: _readObjectList(
        json,
        'references',
      ).map(SermonReferenceDto.fromJson).toList(),
      transcript: SermonTranscriptDto.fromJsonOrNull(json['transcript']),
      audioUrl: _audioUrlFromJson(
        _readAudio(json['audio']),
        apiBaseUrl: apiBaseUrl,
      ),
      thumbnailUrl: _absoluteUrlFromJson(
        json['thumbnailUrl'],
        apiBaseUrl: apiBaseUrl,
      ),
    );
  }

  Sermon toDomain() {
    return Sermon(
      id: id,
      title: title,
      speaker: speaker,
      date: date,
      series: series,
      topics: List.unmodifiable(topics),
      primaryReference: primaryReference,
      duration: Duration(seconds: durationSeconds),
      summary: summary,
      outline: outline.map((item) => item.toDomain()).toList(),
      references: references.map((reference) => reference.toDomain()).toList(),
      transcript: transcript?.toDomain(),
      audioUrl: audioUrl,
      thumbnailUrl: thumbnailUrl,
    );
  }
}

List<String> _stringListFromJson(Object? value) {
  if (value is! List<Object?> ||
      value.length > 12 ||
      value.any(
        (item) =>
            item is! String || item.trim().isEmpty || item.trim().length > 80,
      )) {
    throw const FormatException('Sermon topics are malformed.');
  }
  final topics = value.cast<String>();
  final normalized = topics.map((topic) => topic.toLowerCase()).toSet();
  if (normalized.length != topics.length) {
    throw const FormatException('Sermon topics must be unique.');
  }
  return topics;
}

class SermonTranscriptDto {
  const SermonTranscriptDto({required this.text, this.source, this.updatedAt});

  final String text;
  final String? source;
  final String? updatedAt;

  static SermonTranscriptDto? fromJsonOrNull(Object? value) {
    if (value == null) return null;
    if (value is! Map<String, Object?>) {
      throw const FormatException('Sermon transcript must be an object.');
    }
    final text = _readString(value, 'text');
    if (text.trim().isEmpty) {
      return null;
    }
    return SermonTranscriptDto(
      text: text,
      source: _readNullableString(value, 'source'),
      updatedAt: _readNullableString(value, 'updatedAt'),
    );
  }

  SermonTranscript toDomain() {
    return SermonTranscript(text: text, source: source, updatedAt: updatedAt);
  }
}

class SermonOutlineItemDto {
  const SermonOutlineItemDto({
    required this.title,
    required this.startSeconds,
    required this.summary,
  });

  final String title;
  final int startSeconds;
  final String summary;

  factory SermonOutlineItemDto.fromJson(Map<String, Object?> json) {
    return SermonOutlineItemDto(
      title: _readString(json, 'title', allowEmpty: false),
      startSeconds: _readNonNegativeInt(json, 'startSeconds'),
      summary: _readString(json, 'summary'),
    );
  }

  SermonOutlineItem toDomain() {
    return SermonOutlineItem(
      title: title,
      startTime: Duration(seconds: startSeconds),
      summary: summary,
    );
  }
}

class SermonReferenceDto {
  const SermonReferenceDto({
    required this.reference,
    required this.verseId,
    required this.note,
    this.startSeconds,
  });

  final String reference;
  final String verseId;
  final String note;
  final int? startSeconds;

  factory SermonReferenceDto.fromJson(Map<String, Object?> json) {
    return SermonReferenceDto(
      reference: _readString(json, 'reference', allowEmpty: false),
      verseId: _readString(json, 'verseId', allowEmpty: false),
      note: _readString(json, 'note'),
      startSeconds: _readNullableNonNegativeInt(json, 'startSeconds'),
    );
  }

  SermonReference toDomain() {
    return SermonReference(reference: reference, verseId: verseId, note: note);
  }
}

String? _audioUrlFromJson(Map<String, Object?> value, {String? apiBaseUrl}) {
  if (value['status'] != 'ready') {
    return null;
  }
  final url = _readNullableString(value, 'url');
  return _absoluteUrlFromJson(url, apiBaseUrl: apiBaseUrl);
}

void _validatePublicSermonMetadata(Map<String, Object?> json) {
  _readEnum(json, 'sourceLocale', _contentLocales);
  _readEnum(json, 'status', _sermonStatuses);
  _readNullableString(json, 'publishedAt');
  _readNullableString(json, 'thumbnailUrl');
  final createdAt = _readDateTime(json, 'createdAt');
  final updatedAt = _readDateTime(json, 'updatedAt');
  if (updatedAt.isBefore(createdAt)) {
    throw const FormatException('Sermon updatedAt must not precede createdAt.');
  }
}

Map<String, Object?> _readAudio(Object? value) {
  if (value is! Map<String, Object?>) {
    throw const FormatException('Sermon audio must be an object.');
  }
  _readEnum(value, 'status', _sermonAudioStatuses);
  _readNullableString(value, 'url');
  _readNullableString(value, 'fileName');
  _readNullableString(value, 'mimeType');
  _readNonNegativeInt(value, 'sizeBytes');
  _readNullableString(value, 'uploadedAt');
  return value;
}

List<Map<String, Object?>> _readObjectList(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw FormatException('Sermon $key must be an object list.');
  }
  return value.cast<Map<String, Object?>>();
}

String _readString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = true,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('Sermon $key must be a string.');
  }
  return value;
}

String? _readNullableString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! String) {
    throw FormatException('Sermon $key must be null or a string.');
  }
  return value;
}

String _readEnum(Map<String, Object?> json, String key, Set<String> values) {
  final value = _readString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('Sermon $key is unsupported.');
  }
  return value;
}

int _readNonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('Sermon $key must be a non-negative integer.');
  }
  return value;
}

int? _readNullableNonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  return _readNonNegativeInt(json, key);
}

String _readDate(Map<String, Object?> json, String key) {
  final value = _readString(json, key, allowEmpty: false);
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(value);
  final parsed = DateTime.tryParse(value);
  if (match == null ||
      parsed == null ||
      parsed.year != int.parse(match.group(1)!) ||
      parsed.month != int.parse(match.group(2)!) ||
      parsed.day != int.parse(match.group(3)!)) {
    throw FormatException('Sermon $key must be an ISO date.');
  }
  return value;
}

DateTime _readDateTime(Map<String, Object?> json, String key) {
  final value = _readString(json, key, allowEmpty: false);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('Sermon $key must be an ISO date-time.');
  }
  return parsed;
}

String? _absoluteUrlFromJson(Object? value, {String? apiBaseUrl}) {
  if (value is! String || value.isEmpty) {
    return null;
  }
  final uri = Uri.tryParse(value);
  if (uri == null) {
    return null;
  }
  if (uri.hasScheme) {
    return value;
  }
  final baseUri = apiBaseUrl == null ? null : Uri.tryParse(apiBaseUrl);
  return baseUri?.resolveUri(uri).toString() ?? value;
}
