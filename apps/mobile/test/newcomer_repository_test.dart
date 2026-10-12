import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/newcomer_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('submits newcomer with external identity and member session', () async {
    final dio = _NewcomerDio();
    final repository = ApiNewcomerRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final profile = await repository.submitNewcomer(
      identity: _identity,
      displayName: 'Grace Visitor',
      preferredLanguage: 'en',
      email: 'grace@example.com',
      phone: '626-555-0101',
      interest: 'I would like to visit a small group.',
    );

    expect(profile.id, 'newcomer_1');
    expect(profile.status, 'new');
    expect(dio.requests.single.path, '/newcomers');
    expect(dio.requests.single.authorization, 'Bearer member-token');
    expect(dio.requests.single.externalUserId, 'ext_test_user');
    expect(
      dio.requests.single.data,
      containsPair('externalUserId', 'ext_test_user'),
    );
    expect(dio.requests.single.data, containsPair('source', 'app'));
  });

  test(
    'submits guest newcomer with external identity and contact method',
    () async {
      final dio = _NewcomerDio();
      final repository = ApiNewcomerRepository(
        apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
      );

      await repository.submitNewcomer(
        identity: _guestIdentity,
        displayName: '  Grace Visitor  ',
        preferredLanguage: ' zh-Hans ',
        email: '',
        phone: ' 626-555-0101 ',
        interest: '  ',
      );

      final request = dio.requests.single;
      final data = request.data as Map<String, Object?>;
      expect(request.authorization, isNull);
      expect(request.externalUserId, 'ext_guest_user');
      expect(data, containsPair('externalUserId', 'ext_guest_user'));
      expect(data, containsPair('displayName', 'Grace Visitor'));
      expect(data, containsPair('preferredLanguage', 'zh-Hans'));
      expect(data, containsPair('phone', '626-555-0101'));
      expect(data.containsKey('email'), isFalse);
      expect(data.containsKey('interest'), isFalse);
    },
  );

  test('rejects a malformed newcomer submission envelope', () async {
    final dio = _NewcomerDio(
      responseData: const {
        'data': {'id': 'newcomer_1', 'displayName': 'Grace Visitor'},
        'meta': <String, Object?>{},
      },
    );
    final repository = ApiNewcomerRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.submitNewcomer(
        identity: _guestIdentity,
        displayName: 'Grace Visitor',
        preferredLanguage: 'en',
        phone: '626-555-0101',
      ),
      throwsA(isA<FormatException>()),
    );
  });
}

class _NewcomerDio {
  _NewcomerDio({Object? responseData}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedNewcomerRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              externalUserId: options.headers['x-external-user-id'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data:
                  responseData ??
                  const {
                    'data': _newcomerSubmissionJson,
                    'meta': <String, Object?>{},
                  },
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedNewcomerRequest> requests = [];
}

class _RecordedNewcomerRequest {
  const _RecordedNewcomerRequest({
    required this.path,
    required this.authorization,
    required this.externalUserId,
    required this.data,
  });

  final String path;
  final String? authorization;
  final String? externalUserId;
  final Object? data;
}

const _newcomerSubmissionJson = {
  'id': 'newcomer_1',
  'displayName': 'Grace Visitor',
  'status': 'new',
  'createdAt': '2026-06-01T00:00:00.000Z',
};

const _identity = NewcomerIdentity(
  externalUserId: 'ext_test_user',
  session: _memberSession,
);

const _guestIdentity = NewcomerIdentity(
  externalUserId: 'ext_guest_user',
  session: null,
);

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);
