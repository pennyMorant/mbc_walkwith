part of 'sermons_repository_test.dart';

const _emptyFacetsDto = SermonDiscoveryFacetsDto();

const _cachedSermonDto = SermonDto(
  id: 'cached-sermon',
  title: 'Cached Sermon',
  speaker: 'Pastor Cache',
  date: '2026-05-24',
  series: 'Romans',
  topics: ['Hope', 'Suffering'],
  primaryReference: 'Romans 8:28',
  durationSeconds: 2400,
  summary: 'A cached sermon for offline reading.',
  outline: [
    SermonOutlineItemDto(
      title: 'Cached outline',
      startSeconds: 0,
      summary: 'Stored locally.',
    ),
  ],
  references: [
    SermonReferenceDto(
      reference: 'Romans 8:28',
      verseId: 'rom.8.28',
      note: 'Main text',
    ),
  ],
  audioUrl: 'https://example.com/audio.mp3',
  thumbnailUrl: 'https://example.com/sermon-cover.png',
);

SermonDto _sermonDto({
  required String id,
  required String date,
  List<String> topics = const [],
  List<SermonReferenceDto> references = const [],
}) {
  return SermonDto(
    id: id,
    title: 'Sermon $id',
    speaker: 'Pastor Cache',
    date: date,
    series: 'Cached Series',
    topics: topics,
    primaryReference: '',
    durationSeconds: 1800,
    summary: 'Cached sermon for offline discovery.',
    outline: const [],
    references: references,
  );
}

abstract class _BaseSermonsRemoteDataSource implements SermonsRemoteDataSource {
  const _BaseSermonsRemoteDataSource();

  @override
  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async =>
      _emptyFacetsDto;

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async => const [];
}

class _EmptySermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async => const [];

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async => null;
}

class _FailingSermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async => throw const ApiError(message: 'backend unavailable');

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async =>
      throw const ApiError(message: 'backend unavailable');

  @override
  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async =>
      throw const ApiError(message: 'backend unavailable');

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async => throw const ApiError(message: 'backend unavailable');
}

class _MalformedSermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async => throw const FormatException('malformed sermon list');

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async =>
      throw const FormatException('malformed sermon detail');

  @override
  Future<SermonDiscoveryFacetsDto> fetchDiscoveryFacets() async =>
      throw const FormatException('malformed sermon facets');

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async => throw const FormatException('malformed sermon recommendations');
}

class _NotFoundSermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async => const [];

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async {
    throw const ApiError(
      message: 'Sermon not found.',
      statusCode: 404,
      code: 'sermon_not_found',
    );
  }
}

class _RecordingSermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  SermonListRequest? lastRequest;

  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    lastRequest = request;
    return const [];
  }

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async => null;
}

class _StaticSermonsRemoteDataSource extends _BaseSermonsRemoteDataSource {
  const _StaticSermonsRemoteDataSource(this.sermons);

  final List<SermonDto> sermons;

  @override
  Future<List<SermonDto>> fetchSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async => sermons;

  @override
  Future<SermonDto?> fetchSermonById(String sermonId) async {
    for (final sermon in sermons) {
      if (sermon.id == sermonId) {
        return sermon;
      }
    }
    return null;
  }

  @override
  Future<List<SermonDto>> fetchRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async => sermons.take(limit).toList();
}
