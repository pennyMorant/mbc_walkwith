import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';

void main() {
  test('ApiClient injects request id and accept language headers', () async {
    final requests = <RequestOptions>[];
    final dio = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
    final client = ApiClient(
      config: _testAppConfig,
      dio: dio,
      acceptLanguageProvider: () => 'zh-Hans',
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(options);
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: const {'data': {}},
            ),
          );
        },
      ),
    );

    await client.getJsonMap('/settings/public');

    expect(requests, hasLength(1));
    expect(requests.single.headers['x-request-id'], isNotEmpty);
    expect(requests.single.headers['accept-language'], 'zh-Hans');
  });

  test('ApiClient preserves structured backend errors', () async {
    final dio = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          handler.reject(
            DioException(
              requestOptions: options,
              response: Response<Object?>(
                requestOptions: options,
                statusCode: 409,
                data: const {
                  'error': {
                    'code': 'event_capacity_full',
                    'category': 'state_conflict',
                    'sourceLayer': 'feature',
                    'message': 'Event registration is full.',
                    'recoverable': true,
                    'retryable': false,
                    'evidence': {'eventId': 'event-1'},
                    'nextAction': 'refresh',
                    'details': {'remainingCount': 0},
                  },
                  'requestId': 'req-structured-error',
                },
              ),
            ),
          );
        },
      ),
    );

    final client = ApiClient(config: _testAppConfig, dio: dio);

    await expectLater(
      client.getJsonMap('/life/events/event-1'),
      throwsA(
        isA<ApiError>()
            .having((error) => error.code, 'code', 'event_capacity_full')
            .having((error) => error.category, 'category', 'state_conflict')
            .having((error) => error.sourceLayer, 'sourceLayer', 'feature')
            .having((error) => error.recoverable, 'recoverable', isTrue)
            .having((error) => error.retryable, 'retryable', isFalse)
            .having((error) => error.nextAction, 'nextAction', 'refresh')
            .having(
              (error) => error.requestId,
              'requestId',
              'req-structured-error',
            )
            .having(
              (error) => error.evidence['eventId'],
              'evidence.eventId',
              'event-1',
            )
            .having(
              (error) => error.details['remainingCount'],
              'details.remainingCount',
              0,
            )
            .having((error) => error.isStateConflict, 'isStateConflict', isTrue)
            .having((error) => error.isNotFound, 'isNotFound', isFalse)
            .having(
              (error) => error.hasCode(const {'event_capacity_full'}),
              'hasCode',
              isTrue,
            ),
      ),
    );
  });

  test('ApiError exposes shared category helpers', () {
    const missing = ApiError(
      message: 'Missing',
      statusCode: 404,
      code: 'life_post_not_found',
      category: 'not_found',
    );
    const auth = ApiError(
      message: 'Sign in',
      statusCode: 401,
      category: 'authentication_required',
    );
    const capability = ApiError(
      message: 'Provider failed',
      category: 'external_dependency_failed',
      sourceLayer: 'capability',
    );

    expect(missing.isNotFound, isTrue);
    expect(missing.hasCode(const {'life_post_not_found'}), isTrue);
    expect(auth.isAuthenticationRequired, isTrue);
    expect(capability.isCapabilityFailure, isTrue);
  });

  test('formatApiErrorMessage returns user-facing API messages', () {
    const error = ApiError(
      message: 'Event registration is full.',
      statusCode: 409,
      code: 'event_capacity_full',
      requestId: 'req-hidden',
    );

    expect(formatApiErrorMessage(error), 'Event registration is full.');
    expect(
      formatApiErrorMessage(StateError('plain failure')),
      contains('plain failure'),
    );
  });
}

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);
