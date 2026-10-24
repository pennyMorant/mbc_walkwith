import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/settings/app_settings.dart';
import 'package:mbc_walkwith/core/settings/app_settings_repository.dart';

void main() {
  test('unavailable settings fail closed for backend-owned entries', () {
    expect(AppSettings.unavailable.memberRegistrationOpen, isFalse);
    expect(AppSettings.unavailable.givingEnabled, isFalse);
    expect(AppSettings.unavailable.prayerEnabled, isFalse);
  });

  test('API settings repository maps public settings', () async {
    final repository = _repositoryWithResponse({
      'data': {
        'items': [
          {'key': 'member.registrationMode', 'value': 'open'},
          {'key': 'features.givingEnabled', 'value': true},
        ],
      },
    });

    final settings = await repository.getSettings();

    expect(settings.memberRegistrationOpen, isTrue);
    expect(settings.givingEnabled, isTrue);
  });

  test('API settings repository rejects malformed envelopes', () async {
    final repository = _repositoryWithResponse({
      'data': {
        'items': ['not-a-setting'],
      },
    });

    await expectLater(repository.getSettings(), throwsA(isA<ApiError>()));
  });
}

ApiAppSettingsRepository _repositoryWithResponse(
  Map<String, Object?> response,
) {
  final dio = Dio(BaseOptions(baseUrl: _config.apiBaseUrl));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        handler.resolve(
          Response<Object?>(
            requestOptions: options,
            statusCode: 200,
            data: response,
          ),
        );
      },
    ),
  );
  return ApiAppSettingsRepository(
    apiClient: ApiClient(config: _config, dio: dio),
  );
}

const _config = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);
