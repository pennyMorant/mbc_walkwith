import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/prayer_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('fetches public prayer requests without bearer auth', () async {
    final dio = _PrayerDio();
    final repository = ApiPrayerRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final requests = await repository.fetchPublicRequests();

    expect(requests, hasLength(1));
    expect(requests.single.id, 'public-prayer');
    expect(requests.single.visibility, 'public');
    expect(dio.requests.single.path, '/prayer-requests?limit=20');
    expect(dio.requests.single.authorization, isNull);
  });

  test('fetches and dedupes member prayer requests with bearer auth', () async {
    final dio = _PrayerDio();
    final repository = ApiPrayerRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final requests = await repository.fetchMemberRequests(_memberSession);

    expect(requests.map((request) => request.id), [
      'shared-prayer',
      'own-prayer',
    ]);
    expect(requests.first.title, 'Group care');
    expect(requests.first.status, 'approved');
    expect(dio.requests.map((request) => request.path), [
      '/member/prayer-requests?limit=20',
      '/member/prayer-requests/shared?limit=20',
    ]);
    expect(
      dio.requests.every(
        (request) => request.authorization == 'Bearer member-token',
      ),
      isTrue,
    );
  });

  test('submits guest and member prayer requests to backend API', () async {
    final dio = _PrayerDio();
    final repository = ApiPrayerRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final guestRequest = await repository.submitRequest(
      title: 'Guest prayer',
      body: 'Please pray for my family.',
      visibility: 'private',
      submitterName: '  Guest  ',
    );
    final memberRequest = await repository.submitRequest(
      title: 'Member prayer',
      body: 'Please pray for ministry.',
      visibility: 'members',
      session: _memberSession,
    );

    expect(guestRequest.id, 'created-prayer');
    expect(memberRequest.id, 'created-prayer');
    expect(dio.requests.map((request) => request.path), [
      '/prayer-requests',
      '/prayer-requests',
    ]);
    expect(dio.requests.first.authorization, isNull);
    expect(dio.requests.last.authorization, 'Bearer member-token');
    expect(dio.requests.first.data, {
      'title': 'Guest prayer',
      'body': 'Please pray for my family.',
      'visibility': 'private',
      'submitterName': 'Guest',
    });
    expect(dio.requests.last.data, {
      'title': 'Member prayer',
      'body': 'Please pray for ministry.',
      'visibility': 'members',
    });
  });
}

class _PrayerDio {
  _PrayerDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedPrayerRequest(
              method: options.method,
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: _responseFor(options),
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedPrayerRequest> requests = [];

  Map<String, Object?> _responseFor(RequestOptions options) {
    if (options.path == '/prayer-requests?limit=20') {
      return const {
        'data': {
          'items': [_publicPrayerJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (options.path == '/member/prayer-requests?limit=20') {
      return const {
        'data': {
          'items': [_ownPrayerJson, _sharedPrayerFromOwnJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (options.path == '/member/prayer-requests/shared?limit=20') {
      return const {
        'data': {
          'items': [_sharedPrayerJson],
        },
        'meta': <String, Object?>{},
      };
    }
    return const {'data': _createdPrayerJson, 'meta': <String, Object?>{}};
  }
}

class _RecordedPrayerRequest {
  const _RecordedPrayerRequest({
    required this.method,
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String method;
  final String path;
  final String? authorization;
  final Object? data;
}

const _publicPrayerJson = {
  'id': 'public-prayer',
  'title': 'Sunday thanksgiving',
  'body': 'Give thanks for answered prayer.',
  'visibility': 'public',
  'groupId': null,
  'status': 'approved',
  'submitterName': 'Prayer Team',
  'createdAt': '2026-06-21T16:00:00.000Z',
  'updatedAt': '2026-06-21T16:00:00.000Z',
};

const _ownPrayerJson = {
  'id': 'own-prayer',
  'title': 'Family care',
  'body': 'Please pray for family health.',
  'visibility': 'private',
  'groupId': null,
  'status': 'pending',
  'submitterName': 'Member',
  'createdAt': '2026-06-21T17:00:00.000Z',
  'updatedAt': '2026-06-21T17:00:00.000Z',
};

const _sharedPrayerJson = {
  'id': 'shared-prayer',
  'title': 'Group care',
  'body': 'Please pray for our fellowship group.',
  'visibility': 'group',
  'groupId': 'friday-fellowship',
  'status': 'approved',
  'submitterName': 'Group Member',
  'createdAt': '2026-06-21T18:00:00.000Z',
  'updatedAt': '2026-06-21T18:20:00.000Z',
};

const _sharedPrayerFromOwnJson = {
  'id': 'shared-prayer',
  'title': 'Group care from member list',
  'body': 'Please pray for the member-visible review state.',
  'visibility': 'group',
  'groupId': 'friday-fellowship',
  'status': 'pending',
  'submitterName': 'Group Member',
  'createdAt': '2026-06-21T18:00:00.000Z',
  'updatedAt': '2026-06-21T18:10:00.000Z',
};

const _createdPrayerJson = {
  'id': 'created-prayer',
  'title': 'Created prayer',
  'body': 'Created request body.',
  'visibility': 'private',
  'groupId': null,
  'status': 'pending',
  'submitterName': 'Guest',
  'createdAt': '2026-06-21T19:00:00.000Z',
  'updatedAt': '2026-06-21T19:00:00.000Z',
};

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: 'friday-fellowship',
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);
