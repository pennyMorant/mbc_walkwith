import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/sermons/data/remote/api_sermons_remote_data_source.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon_list_request.dart';

void main() {
  test('parses the canonical sermon list envelope', () async {
    final source = _sourceFor({
      'data': {
        'items': [_sermonJson],
        'nextCursor': null,
      },
    });

    final sermons = await source.fetchSermons();

    expect(sermons.single.id, 'sermon-1');
  });

  test('parses the canonical sermon recommendation envelope', () async {
    final source = _sourceFor({
      'data': {
        'items': [_sermonJson],
      },
    });

    final sermons = await source.fetchRecommendedSermons(
      bookId: 'jhn',
      chapter: 15,
    );

    expect(sermons.single.id, 'sermon-1');
  });

  test('parses the canonical sermon discovery facets envelope', () async {
    final source = _sourceFor({
      'data': {
        'speakers': ['Pastor'],
        'series': ['John'],
        'topics': ['Discipleship'],
      },
    });

    final facets = await source.fetchDiscoveryFacets();

    expect(facets.speakers, ['Pastor']);
    expect(facets.series, ['John']);
    expect(facets.topics, ['Discipleship']);
  });

  test('sends exact sermon discovery filters as query parameters', () async {
    RequestOptions? request;
    final source = _sourceFor({
      'data': {'items': <Object?>[], 'nextCursor': null},
    }, onRequest: (value) => request = value);

    await source.fetchSermons(
      request: const SermonListRequest(
        speaker: 'Pastor',
        series: 'John',
        topic: 'Discipleship',
      ),
    );

    expect(request?.uri.queryParameters['speaker'], 'Pastor');
    expect(request?.uri.queryParameters['series'], 'John');
    expect(request?.uri.queryParameters['topic'], 'Discipleship');
  });

  test('rejects the removed array sermon list envelope', () async {
    final source = _sourceFor({
      'data': [_sermonJson],
    });

    await expectLater(source.fetchSermons(), throwsA(isA<FormatException>()));
  });

  test('rejects malformed sermon list items', () async {
    final source = _sourceFor({
      'data': {
        'items': ['not-a-sermon'],
      },
    });

    await expectLater(source.fetchSermons(), throwsA(isA<FormatException>()));
  });

  test('rejects malformed sermon topics', () async {
    final source = _sourceFor({
      'data': {
        'items': [
          {
            ..._sermonJson,
            'topics': <Object?>['Discipleship', 1],
          },
        ],
      },
    });

    await expectLater(source.fetchSermons(), throwsA(isA<FormatException>()));
  });

  test('rejects malformed sermon discovery facets', () async {
    final source = _sourceFor({
      'data': {
        'speakers': <Object?>['Pastor', 1],
        'series': <Object?>[],
        'topics': <Object?>[],
      },
    });

    await expectLater(
      source.fetchDiscoveryFacets(),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects a successful detail response without sermon data', () async {
    final source = _sourceFor({'data': null});

    await expectLater(
      source.fetchSermonById('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });
}

ApiSermonsRemoteDataSource _sourceFor(
  Map<String, Object?> responseBody, {
  void Function(RequestOptions request)? onRequest,
}) {
  final dio = Dio(BaseOptions(baseUrl: _config.apiBaseUrl));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        onRequest?.call(options);
        handler.resolve(
          Response<Object?>(
            requestOptions: options,
            statusCode: 200,
            data: responseBody,
          ),
        );
      },
    ),
  );
  return ApiSermonsRemoteDataSource(
    apiClient: ApiClient(config: _config, dio: dio),
  );
}

const _config = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);

const _sermonJson = <String, Object?>{
  'id': 'sermon-1',
  'title': 'Abide in Christ',
  'speaker': 'Pastor',
  'sermonDate': '2026-07-12',
  'series': 'John',
  'topics': <Object?>['Discipleship'],
  'primaryReference': 'John 15:5',
  'durationSeconds': 1800,
  'summary': 'A sermon about abiding in Christ.',
  'outline': <Object?>[],
  'references': <Object?>[],
  'audio': <String, Object?>{
    'status': 'ready',
    'url': '/v1/sermons/sermon-1/audio',
  },
};
