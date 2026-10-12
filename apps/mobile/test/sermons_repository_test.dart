import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/sermons/data/dto/sermon_discovery_facets_dto.dart';
import 'package:mbc_walkwith/features/sermons/data/dto/sermon_dto.dart';
import 'package:mbc_walkwith/features/sermons/data/local/sermons_local_data_source.dart';
import 'package:mbc_walkwith/features/sermons/data/remote/sermons_remote_data_source.dart';
import 'package:mbc_walkwith/features/sermons/data/sermons_repository.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon_list_request.dart';

import 'test_database.dart';

part 'sermons_repository_test_fakes.dart';

void main() {
  test(
    'returns an empty sermon list when the backend returns no sermons',
    () async {
      final repository = RemoteSermonsRepository(
        remoteDataSource: _EmptySermonsRemoteDataSource(),
      );

      await expectLater(repository.getSermons(), completion(isEmpty));
    },
  );

  test('surfaces remote sermon failures instead of using local data', () async {
    final repository = RemoteSermonsRepository(
      remoteDataSource: _FailingSermonsRemoteDataSource(),
    );

    await expectLater(repository.getSermons(), throwsA(isA<ApiError>()));
  });

  test('passes sermon discovery filters to the backend data source', () async {
    final remoteDataSource = _RecordingSermonsRemoteDataSource();
    final repository = RemoteSermonsRepository(
      remoteDataSource: remoteDataSource,
    );

    await repository.getSermons(
      request: const SermonListRequest(
        query: 'Romans',
        speaker: 'Pastor Cache',
        series: 'Romans',
        topic: 'Hope',
      ),
    );

    expect(remoteDataSource.lastRequest?.query, 'Romans');
    expect(remoteDataSource.lastRequest?.speaker, 'Pastor Cache');
    expect(remoteDataSource.lastRequest?.series, 'Romans');
    expect(remoteDataSource.lastRequest?.topic, 'Hope');
  });

  test('returns cached sermons when remote list fails', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _FailingSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final sermons = await repository.getSermons();

    expect(sermons, hasLength(1));
    expect(sermons.single.id, 'cached-sermon');
  });

  test('returns cached sermon detail when remote detail fails', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _FailingSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final sermon = await repository.getSermonById('cached-sermon');

    expect(sermon?.id, 'cached-sermon');
  });

  test('does not mask a malformed sermon list with cached data', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _MalformedSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    await expectLater(repository.getSermons(), throwsA(isA<FormatException>()));
  });

  test('does not mask a malformed sermon detail with cached data', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _MalformedSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    await expectLater(
      repository.getSermonById('cached-sermon'),
      throwsA(isA<FormatException>()),
    );
  });

  test('does not mask malformed recommendations with cached data', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _MalformedSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    await expectLater(
      repository.getRecommendedSermons(bookId: 'rom', chapter: 8),
      throwsA(isA<FormatException>()),
    );
  });

  test('removes cached sermon detail when remote returns no sermon', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _EmptySermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final sermon = await repository.getSermonById('cached-sermon');

    expect(sermon, isNull);
    expect(await localDataSource.fetchSermonById('cached-sermon'), isNull);
  });

  test('removes cached sermon detail when backend reports not found', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _NotFoundSermonsRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final sermon = await repository.getSermonById('cached-sermon');

    expect(sermon, isNull);
    expect(await localDataSource.fetchSermonById('cached-sermon'), isNull);
  });

  test('caches remote sermon list for later offline use', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    final repository = CachedSermonsRepository(
      remoteDataSource: _StaticSermonsRemoteDataSource([_cachedSermonDto]),
      localDataSource: localDataSource,
    );

    await repository.getSermons();
    final cached = await localDataSource.fetchSermonById('cached-sermon');

    expect(cached?.title, 'Cached Sermon');
    expect(cached?.audioUrl, 'https://example.com/audio.mp3');
    expect(cached?.thumbnailUrl, 'https://example.com/sermon-cover.png');
    expect(cached?.topics, ['Hope', 'Suffering']);
  });

  test('filters cached sermons by exact speaker, series, and topic', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([
      _cachedSermonDto,
      _sermonDto(
        id: 'other-sermon',
        date: '2026-05-17',
        topics: const ['Faith'],
      ),
    ]);

    final matching = await localDataSource.fetchSermons(
      request: const SermonListRequest(
        speaker: 'pastor cache',
        series: 'romans',
        topic: 'hope',
      ),
    );

    expect(matching.map((sermon) => sermon.id), ['cached-sermon']);
  });

  test(
    'derives sermon discovery facets from cache on network failure',
    () async {
      final database = AppDatabase(openTestDatabaseConnection());
      addTearDown(database.close);
      final localDataSource = SermonsLocalDataSource(database: database);
      await localDataSource.cacheSermons([_cachedSermonDto]);
      final repository = CachedSermonsRepository(
        remoteDataSource: _FailingSermonsRemoteDataSource(),
        localDataSource: localDataSource,
      );

      final facets = await repository.getDiscoveryFacets();

      expect(facets.speakers, ['Pastor Cache']);
      expect(facets.series, ['Romans']);
      expect(facets.topics, ['Hope', 'Suffering']);
    },
  );

  test('filtered sermon requests cannot reconcile the local cache', () {
    expect(const SermonListRequest(topic: 'Hope').canRefreshCache, isFalse);
  });

  test('reconciles a complete month without deleting other months', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    final staleJune = _sermonDto(id: 'stale-june-sermon', date: '2026-06-07');
    final freshJune = _sermonDto(id: 'fresh-june-sermon', date: '2026-06-14');
    await localDataSource.cacheSermons([_cachedSermonDto, staleJune]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _StaticSermonsRemoteDataSource([freshJune]),
      localDataSource: localDataSource,
    );

    await repository.getSermons(
      request: SermonListRequest(
        from: DateTime.utc(2026, 6),
        to: DateTime.utc(2026, 7),
      ),
    );

    expect(await localDataSource.fetchSermonById('cached-sermon'), isNotNull);
    expect(await localDataSource.fetchSermonById('stale-june-sermon'), isNull);
    expect(
      await localDataSource.fetchSermonById('fresh-june-sermon'),
      isNotNull,
    );
  });

  test('does not reconcile a month from a possibly incomplete page', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    final staleJune = _sermonDto(id: 'stale-june-sermon', date: '2026-06-07');
    final freshJune = _sermonDto(id: 'fresh-june-sermon', date: '2026-06-14');
    await localDataSource.cacheSermons([staleJune]);
    final repository = CachedSermonsRepository(
      remoteDataSource: _StaticSermonsRemoteDataSource([freshJune]),
      localDataSource: localDataSource,
    );

    await repository.getSermons(
      request: SermonListRequest(
        limit: 1,
        from: DateTime.utc(2026, 6),
        to: DateTime.utc(2026, 7),
      ),
    );

    expect(
      await localDataSource.fetchSermonById('stale-june-sermon'),
      isNotNull,
    );
    expect(
      await localDataSource.fetchSermonById('fresh-june-sermon'),
      isNotNull,
    );
  });

  test(
    'loads old sermon detail and recommendations beyond the list limit',
    () async {
      final database = AppDatabase(openTestDatabaseConnection());
      addTearDown(database.close);
      final localDataSource = SermonsLocalDataSource(database: database);
      final recentSermons = List.generate(
        51,
        (index) => _sermonDto(id: 'recent-sermon-$index', date: '2026-07-05'),
      );
      final oldExactMatch = _sermonDto(
        id: 'old-exact-match',
        date: '2020-01-05',
        references: [
          SermonReferenceDto(
            reference: 'Romans 8:28',
            verseId: 'rom.8.28',
            note: 'Exact cached reference',
          ),
        ],
      );
      await localDataSource.cacheSermons([...recentSermons, oldExactMatch]);

      final detail = await localDataSource.fetchSermonById('old-exact-match');
      final recommendations = await localDataSource.fetchRecommendedSermons(
        bookId: 'rom',
        chapter: 8,
        verseId: 'rom.8.28',
      );

      expect(detail?.id, 'old-exact-match');
      expect(recommendations.first.id, 'old-exact-match');
    },
  );

  test('cached recommendations do not cross chapter boundaries', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([
      _sermonDto(
        id: 'romans-eight',
        date: '2026-09-27',
        references: [
          SermonReferenceDto(
            reference: 'Romans 8:28',
            verseId: 'rom.8.28',
            note: 'Romans 8 only',
          ),
        ],
      ),
    ]);

    final recommendations = await localDataSource.fetchRecommendedSermons(
      bookId: 'rom',
      chapter: 1,
    );

    expect(recommendations, isEmpty);
  });

  test('searches structured Scripture text in the local cache', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = SermonsLocalDataSource(database: database);
    await localDataSource.cacheSermons([_cachedSermonDto]);

    final sermons = await localDataSource.fetchSermons(
      request: const SermonListRequest(query: 'Main text'),
    );

    expect(sermons.single.id, 'cached-sermon');
  });

  test('maps ready sermon audio and artwork from backend relative URLs', () {
    final sermon = SermonDto.fromJson({
      'id': 'church-recorded-sermon',
      'title': 'Church Recorded Sermon',
      'speaker': 'Pastor Audio',
      'sermonDate': '2026-06-07',
      'series': 'Church Archive',
      'topics': const ['Discipleship'],
      'primaryReference': 'John 15:5',
      'durationSeconds': 1800,
      'summary': 'A church-recorded sermon.',
      'thumbnailUrl': '/media/sermons/church-recorded-sermon.png',
      'outline': const [],
      'references': const [],
      'transcript': {
        'text': 'Prepared manuscript uploaded by church staff.',
        'source': 'church-recorded-sermon.md',
        'updatedAt': null,
      },
      'audio': {
        'status': 'ready',
        'url': '/v1/sermons/church-recorded-sermon/audio',
        'fileName': 'church-recorded-sermon.mp3',
        'mimeType': 'audio/mpeg',
        'sizeBytes': 27,
        'uploadedAt': '2026-06-07T18:30:00Z',
      },
    }, apiBaseUrl: 'http://localhost:3020/v1').toDomain();

    expect(sermon.hasAudio, isTrue);
    expect(
      sermon.audioUrl,
      'http://localhost:3020/v1/sermons/church-recorded-sermon/audio',
    );
    expect(
      sermon.thumbnailUrl,
      'http://localhost:3020/media/sermons/church-recorded-sermon.png',
    );
    expect(sermon.transcript?.text, contains('Prepared manuscript'));
  });

  test('ignores sermon audio unless backend marks it ready', () {
    final sermon = SermonDto.fromJson({
      'id': 'draft-sermon',
      'title': 'Draft Sermon',
      'speaker': 'Pastor Draft',
      'sermonDate': '2026-06-07',
      'series': 'Drafts',
      'topics': const [],
      'primaryReference': 'John 15:5',
      'durationSeconds': 1800,
      'summary': 'A draft sermon.',
      'outline': const [],
      'references': const [],
      'audio': {'status': 'missing', 'url': '/v1/sermons/draft-sermon/audio'},
    }, apiBaseUrl: 'http://localhost:3020/v1').toDomain();

    expect(sermon.hasAudio, isFalse);
    expect(sermon.audioUrl, isNull);
  });

  test(
    'uses local processing duration metadata when top-level duration is zero',
    () {
      final sermon = SermonDto.fromJson({
        'id': 'metadata-duration-sermon',
        'title': 'Metadata Duration Sermon',
        'speaker': 'Pastor Duration',
        'sermonDate': '2026-06-07',
        'series': 'Local Package',
        'topics': const ['Hope'],
        'primaryReference': 'John 15:5',
        'durationSeconds': 0,
        'summary': 'A sermon imported from a local processing package.',
        'outline': const [],
        'references': const [],
        'processingMetadata': {'durationSeconds': 1991},
        'audio': {
          'status': 'ready',
          'url': '/v1/sermons/metadata-duration-sermon/audio',
        },
      }, apiBaseUrl: 'http://localhost:3020/v1').toDomain();

      expect(sermon.duration, const Duration(seconds: 1991));
    },
  );
}
