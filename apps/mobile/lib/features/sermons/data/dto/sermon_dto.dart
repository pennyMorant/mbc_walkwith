import '../../domain/sermon.dart';

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
    return SermonDto(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      speaker: json['speaker'] as String? ?? '',
      date: (json['date'] ?? json['sermonDate']) as String? ?? '',
      series: json['series'] as String? ?? '',
      topics: _stringListFromJson(json['topics']),
      primaryReference: json['primaryReference'] as String? ?? '',
      durationSeconds: _durationSecondsFromJson(json),
      summary: json['summary'] as String? ?? '',
      outline: ((json['outline'] as List<Object?>?) ?? const [])
          .cast<Map<String, Object?>>()
          .map(SermonOutlineItemDto.fromJson)
          .toList(),
      references: ((json['references'] as List<Object?>?) ?? const [])
          .cast<Map<String, Object?>>()
          .map(SermonReferenceDto.fromJson)
          .toList(),
      transcript: SermonTranscriptDto.fromJsonOrNull(json['transcript']),
      audioUrl: _audioUrlFromJson(json['audio'], apiBaseUrl: apiBaseUrl),
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
  if (value is! List<Object?> || value.any((item) => item is! String)) {
    throw const FormatException('Sermon topics are malformed.');
  }
  return value.cast<String>();
}

class SermonTranscriptDto {
  const SermonTranscriptDto({required this.text, this.source, this.updatedAt});

  final String text;
  final String? source;
  final String? updatedAt;

  static SermonTranscriptDto? fromJsonOrNull(Object? value) {
    if (value is! Map<String, Object?>) {
      return null;
    }
    final text = value['text'] as String? ?? '';
    if (text.trim().isEmpty) {
      return null;
    }
    return SermonTranscriptDto(
      text: text,
      source: value['source'] as String?,
      updatedAt: value['updatedAt'] as String?,
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
      title: json['title'] as String? ?? '',
      startSeconds: _intFromJson(json['startSeconds']),
      summary: json['summary'] as String? ?? '',
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
      reference: json['reference'] as String? ?? '',
      verseId: json['verseId'] as String? ?? '',
      note: json['note'] as String? ?? '',
      startSeconds: _intFromJsonOrNull(json['startSeconds']),
    );
  }

  SermonReference toDomain() {
    return SermonReference(reference: reference, verseId: verseId, note: note);
  }
}

int _intFromJson(Object? value) {
  return _intFromJsonOrNull(value) ?? 0;
}

int _durationSecondsFromJson(Map<String, Object?> json) {
  final durationSeconds = _intFromJson(json['durationSeconds']);
  if (durationSeconds > 0) {
    return durationSeconds;
  }

  final processingMetadata = json['processingMetadata'];
  if (processingMetadata is Map<String, Object?>) {
    return _intFromJsonOrNull(processingMetadata['durationSeconds']) ??
        _intFromJsonOrNull(processingMetadata['audioDurationSeconds']) ??
        durationSeconds;
  }

  return durationSeconds;
}

int? _intFromJsonOrNull(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.round();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

String? _audioUrlFromJson(Object? value, {String? apiBaseUrl}) {
  if (value is! Map<String, Object?>) {
    return null;
  }
  if (value['status'] != 'ready') {
    return null;
  }
  final url = value['url'] as String?;
  return _absoluteUrlFromJson(url, apiBaseUrl: apiBaseUrl);
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
