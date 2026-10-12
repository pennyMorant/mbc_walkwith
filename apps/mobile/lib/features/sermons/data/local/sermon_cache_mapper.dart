import '../../../../core/database/app_database.dart';
import '../../domain/sermon_list_request.dart';
import '../dto/sermon_discovery_facets_dto.dart';
import '../dto/sermon_dto.dart';

bool matchesCachedSermon(SermonDto sermon, SermonListRequest request) {
  if (!_matchesDateRange(sermon, request) ||
      !_matchesDiscoveryFilters(sermon, request)) {
    return false;
  }
  final query = request.query?.trim().toLowerCase();
  return query == null ||
      query.isEmpty ||
      _sermonSearchHaystack(sermon).contains(query);
}

SermonDiscoveryFacetsDto cachedSermonFacets(List<SermonDto> sermons) {
  return SermonDiscoveryFacetsDto(
    speakers: _sortedValues(sermons.map((sermon) => sermon.speaker)),
    series: _sortedValues(sermons.map((sermon) => sermon.series)),
    topics: _sortedValues(sermons.expand((sermon) => sermon.topics)),
  );
}

List<SermonDto> mapCachedSermons(
  List<LocalSermon> sermons,
  List<LocalSermonOutline> outlines,
  List<LocalSermonTopic> topics,
  List<LocalSermonReference> references,
) {
  final outlinesBySermonId = <String, List<LocalSermonOutline>>{};
  for (final outline in outlines) {
    outlinesBySermonId.putIfAbsent(outline.sermonId, () => []).add(outline);
  }
  final topicsBySermonId = <String, List<LocalSermonTopic>>{};
  for (final topic in topics) {
    topicsBySermonId.putIfAbsent(topic.sermonId, () => []).add(topic);
  }
  final referencesBySermonId = <String, List<LocalSermonReference>>{};
  for (final reference in references) {
    referencesBySermonId
        .putIfAbsent(reference.sermonId, () => [])
        .add(reference);
  }
  return sermons
      .map(
        (sermon) => _sermonFromRow(
          sermon,
          outlinesBySermonId[sermon.id] ?? const [],
          topicsBySermonId[sermon.id] ?? const [],
          referencesBySermonId[sermon.id] ?? const [],
        ),
      )
      .toList(growable: false);
}

int cachedSermonRecommendationScore(
  SermonDto sermon, {
  required String bookId,
  required String chapterPrefix,
  required String? verseId,
}) {
  var score = 0;
  for (final reference in sermon.references) {
    if (verseId != null && reference.verseId == verseId) {
      score = score < 100 ? 100 : score;
      continue;
    }
    if (reference.verseId.startsWith(chapterPrefix)) {
      score = score < 70 ? 70 : score;
      continue;
    }
  }
  return score;
}

bool _matchesDateRange(SermonDto sermon, SermonListRequest request) {
  if (request.from == null && request.to == null) {
    return true;
  }
  final sermonDate = DateTime.tryParse(sermon.date)?.toUtc();
  if (sermonDate == null) {
    return false;
  }
  if (request.from != null && sermonDate.isBefore(request.from!)) {
    return false;
  }
  return request.to == null || sermonDate.isBefore(request.to!);
}

bool _matchesDiscoveryFilters(SermonDto sermon, SermonListRequest request) {
  return _matchesValue(sermon.speaker, request.speaker) &&
      _matchesValue(sermon.series, request.series) &&
      (request.topic == null ||
          request.topic!.trim().isEmpty ||
          sermon.topics.any((topic) => _matchesValue(topic, request.topic)));
}

bool _matchesValue(String value, String? expected) {
  final cleanExpected = expected?.trim();
  return cleanExpected == null ||
      cleanExpected.isEmpty ||
      value.toLowerCase() == cleanExpected.toLowerCase();
}

String _sermonSearchHaystack(SermonDto sermon) {
  return [
    sermon.title,
    sermon.speaker,
    sermon.series,
    sermon.primaryReference,
    sermon.summary,
    sermon.transcript?.text,
    ...sermon.references.expand(
      (reference) => [reference.reference, reference.note],
    ),
  ].whereType<String>().join(' ').toLowerCase();
}

List<String> _sortedValues(Iterable<String> values) {
  final result =
      values.where((value) => value.trim().isNotEmpty).toSet().toList()..sort();
  return result;
}

SermonDto _sermonFromRow(
  LocalSermon sermon,
  List<LocalSermonOutline> outlines,
  List<LocalSermonTopic> topics,
  List<LocalSermonReference> references,
) {
  return SermonDto(
    id: sermon.id,
    title: sermon.title,
    speaker: sermon.speaker,
    date: sermon.sermonDate.toIso8601String().split('T').first,
    series: sermon.series ?? '',
    topics: topics.map((topic) => topic.topic).toList(growable: false),
    primaryReference: sermon.primaryReference ?? '',
    durationSeconds: sermon.durationSeconds,
    summary: sermon.summary ?? '',
    transcript:
        sermon.transcriptText == null || sermon.transcriptText!.trim().isEmpty
        ? null
        : SermonTranscriptDto(
            text: sermon.transcriptText!,
            source: sermon.transcriptSource,
            updatedAt: sermon.transcriptUpdatedAt,
          ),
    outline: outlines
        .map(
          (outline) => SermonOutlineItemDto(
            title: outline.title,
            startSeconds: outline.startSeconds,
            summary: outline.summary,
          ),
        )
        .toList(growable: false),
    references: references
        .map(
          (reference) => SermonReferenceDto(
            reference: reference.referenceText,
            verseId: reference.verseId,
            note: reference.note ?? '',
            startSeconds: reference.startSeconds,
          ),
        )
        .toList(growable: false),
    audioUrl: sermon.audioUrl,
    thumbnailUrl: sermon.thumbnailUrl,
  );
}
