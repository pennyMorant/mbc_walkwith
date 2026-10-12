class Sermon {
  const Sermon({
    required this.id,
    required this.title,
    required this.speaker,
    required this.date,
    required this.series,
    this.topics = const [],
    required this.primaryReference,
    required this.duration,
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
  final Duration duration;
  final String summary;
  final List<SermonOutlineItem> outline;
  final List<SermonReference> references;
  final SermonTranscript? transcript;
  final String? audioUrl;
  final String? thumbnailUrl;

  bool get hasAudio => audioUrl != null && audioUrl!.isNotEmpty;
}

class SermonTranscript {
  const SermonTranscript({required this.text, this.source, this.updatedAt});

  final String text;
  final String? source;
  final String? updatedAt;

  bool get isNotEmpty => text.trim().isNotEmpty;
}

class SermonOutlineItem {
  const SermonOutlineItem({
    required this.title,
    required this.startTime,
    required this.summary,
  });

  final String title;
  final Duration startTime;
  final String summary;
}

class SermonReference {
  const SermonReference({
    required this.reference,
    required this.verseId,
    required this.note,
  });

  final String reference;
  final String verseId;
  final String note;

  String get bookId {
    final parts = verseId.split('.');
    return parts.isNotEmpty && parts.first.isNotEmpty ? parts.first : 'rom';
  }

  int get chapter {
    final parts = verseId.split('.');
    if (parts.length < 2) {
      return 1;
    }
    return int.tryParse(parts[1]) ?? 1;
  }
}
