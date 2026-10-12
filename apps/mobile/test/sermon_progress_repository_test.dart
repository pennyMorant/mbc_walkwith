import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_progress_models.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_progress_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('calculates saved sermon progress from stored position', () async {
    final repository = await _mockRepository();

    await repository.savePosition(
      sermonId: 'sermon-1',
      position: const Duration(minutes: 10),
    );

    expect(
      repository.savedProgress(
        sermonId: 'sermon-1',
        duration: const Duration(minutes: 40),
      ),
      0.25,
    );
  });

  test('saves and restores sermon playback speed preference', () async {
    final repository = await _mockRepository();

    expect(repository.savedSpeed(), 1);

    await repository.saveSpeed(1.5);
    expect(repository.savedSpeed(), 1.5);

    await repository.saveSpeed(1.7);
    expect(repository.savedSpeed(), 1);
  });

  test('skips remote sermon progress reporting in mock mode', () async {
    final dio = _RecordingDio();
    final repository = await _mockRepository(dio: dio);

    await repository.reportProgress(
      sermonId: 'sermon-1',
      position: const Duration(minutes: 3, seconds: 20),
      completed: false,
    );

    expect(dio.requests, isEmpty);
  });

  test('reports sermon playback progress to the backend', () async {
    final dio = _RecordingDio();
    final repository = await _remoteRepository(dio);

    await repository.reportProgress(
      sermonId: 'church/recorded sermon',
      position: const Duration(minutes: 7),
      completed: false,
    );

    expect(dio.requests, hasLength(1));
    expect(
      dio.requests.single.path,
      '/sermons/church%2Frecorded%20sermon/progress',
    );
    expect(dio.requests.single.data, {
      'positionSeconds': 420,
      'completed': false,
    });
    expect(dio.requests.single.headers['authorization'], 'Bearer test-token');
    expect(
      dio.requests.single.headers['x-external-user-id'],
      'ext_test_sermon_progress',
    );
  });

  test('loads remote sermon playback progress with identity', () async {
    final dio = _RecordingDio();
    final repository = await _remoteRepository(dio);

    final progress = await repository.fetchRemoteProgress('sermon-1');

    expect(progress?.position, const Duration(minutes: 7));
    expect(progress?.completed, isFalse);
    expect(dio.requests.single.method, 'GET');
    expect(dio.requests.single.headers['authorization'], 'Bearer test-token');
  });
}

Future<SermonProgressRepository> _mockRepository({_RecordingDio? dio}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return SermonProgressRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio?.instance),
    sharedPreferences: prefs,
    useMockRemoteData: true,
    identity: _testProgressIdentity,
  );
}

Future<SermonProgressRepository> _remoteRepository(_RecordingDio dio) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return SermonProgressRepository(
    apiClient: ApiClient(
      config: const AppConfig(
        apiBaseUrl: 'http://localhost:3020/v1',
        useMockRemoteData: false,
      ),
      dio: dio.instance,
    ),
    sharedPreferences: prefs,
    useMockRemoteData: false,
    identity: _testProgressIdentity,
  );
}

class _RecordingDio {
  _RecordingDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedRequest(
              method: options.method,
              path: options.path,
              data: options.data,
              headers: Map<String, Object?>.from(options.headers),
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: {
                'data': {
                  'sermonId': options.method == 'POST'
                      ? 'church/recorded sermon'
                      : 'sermon-1',
                  'positionSeconds': 420,
                  'completed': false,
                  'completedAt': null,
                  'updatedAt': '2026-07-12T18:00:00.000Z',
                },
                'meta': <String, Object?>{},
              },
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedRequest> requests = [];
}

class _RecordedRequest {
  const _RecordedRequest({
    required this.method,
    required this.path,
    required this.data,
    required this.headers,
  });

  final String method;
  final String path;
  final Object? data;
  final Map<String, Object?> headers;
}

Future<SermonProgressIdentity> _testProgressIdentity() async {
  return const SermonProgressIdentity(
    externalUserId: 'ext_test_sermon_progress',
    accessToken: 'test-token',
  );
}

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);
