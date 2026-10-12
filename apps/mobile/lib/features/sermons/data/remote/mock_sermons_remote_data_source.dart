import '../../domain/sermon.dart';
import '../../domain/sermon_list_request.dart';
import '../dto/sermon_discovery_facets_dto.dart';
import '../dto/sermon_dto.dart';
import '../mock_sermon_data.dart' as mock;
import 'sermons_remote_data_source.dart';

class MockSermonsRemoteDataSource implements SermonsRemoteDataSource {
  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final cleanQuery = request.query?.trim().toLowerCase();
    final sermons =
        (cleanQuery == null || cleanQuery.isEmpty
                ? mock.sermons
                : mock.sermons.where((sermon) {
                    final haystack = [
                      sermon.title,
                      sermon.speaker,
                      sermon.series,
                      sermon.primaryReference,
                      sermon.summary,
                      sermon.transcript?.text,
                      ...sermon.references.expand(
                        (reference) => [reference.reference, reference.note],
                      ),
                    ].join(' ').toLowerCase();
                    return haystack.contains(cleanQuery);
                  }))
            .where((sermon) => _matchesDiscoveryFilters(sermon, request));
    return sermons
        .where((sermon) => _sermonInRange(sermon, request))
        .take(request.limit)
        .map(_toDto)
        .toList();
  }

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    for (final sermon in mock.sermons) {
      if (sermon.id == sermonId) {
        return _toDto(sermon);
      }
    }
    return null;
  }

  @override
  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async {
    return SermonDiscoveryFacetsDto(
      speakers: _sortedValues(mock.sermons.map((sermon) => sermon.speaker)),
      series: _sortedValues(mock.sermons.map((sermon) => sermon.series)),
      topics: _sortedValues(mock.sermons.expand((sermon) => sermon.topics)),
    );
  }

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    final prefix = '$bookId.$chapter.';
    final sermons = mock.sermons
        .where((sermon) {
          return sermon.references.any((reference) {
            if (verseId != null && reference.verseId == verseId) {
              return true;
            }
            return reference.verseId.startsWith(prefix);
          });
        })
        .take(limit);
    return sermons.map(_toDto).toList();
  }
}

bool _sermonInRange(Sermon sermon, SermonListRequest request) {
  if (request.from == null && request.to == null) {
    return true;
  }
  final sermonDate = DateTime.tryParse(sermon.date);
  if (sermonDate == null) {
    return false;
  }
  if (request.from != null && sermonDate.isBefore(request.from!)) {
    return false;
  }
  if (request.to != null && !sermonDate.isBefore(request.to!)) {
    return false;
  }
  return true;
}

SermonDto _toDto(Sermon sermon) {
  return SermonDto.fromJson({
    'id': sermon.id,
    'title': sermon.title,
    'speaker': sermon.speaker,
    'date': sermon.date,
    'series': sermon.series,
    'topics': sermon.topics,
    'primaryReference': sermon.primaryReference,
    'durationSeconds': sermon.duration.inSeconds,
    'summary': sermon.summary,
    'outline': sermon.outline.map(_outlineToJson).toList(),
    'references': sermon.references.map(_referenceToJson).toList(),
    'transcript': sermon.transcript == null
        ? null
        : {
            'text': sermon.transcript!.text,
            'source': sermon.transcript!.source,
            'updatedAt': sermon.transcript!.updatedAt,
          },
  });
}

bool _matchesDiscoveryFilters(Sermon sermon, SermonListRequest request) {
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

List<String> _sortedValues(Iterable<String> values) {
  final result =
      values.where((value) => value.trim().isNotEmpty).toSet().toList()..sort();
  return result;
}

Map<String, Object?> _outlineToJson(SermonOutlineItem item) {
  return {
    'title': item.title,
    'startSeconds': item.startTime.inSeconds,
    'summary': item.summary,
  };
}

Map<String, Object?> _referenceToJson(SermonReference reference) {
  return {
    'reference': reference.reference,
    'verseId': reference.verseId,
    'note': reference.note,
  };
}
