import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/storage/session_store.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('restores debug member session when debug bypass is enabled', () async {
    final sessionStore = _FakeSessionStore();
    final repository = MemberSessionRepository(
      apiClient: ApiClient(config: _debugConfig),
      sessionStore: sessionStore,
    );

    final session = await repository.restoreSession();

    expect(session, isNotNull);
    expect(session?.accessToken, 'debug-token');
    expect(session?.member.email, 'debug.member@mbc.local');
    expect(session?.member.fellowshipGroupId, 'friday-fellowship');
  });

  test(
    'stored member session remains disabled when debug bypass is off',
    () async {
      final sessionStore = _FakeSessionStore();
      final repository = MemberSessionRepository(
        apiClient: ApiClient(config: _normalConfig),
        sessionStore: sessionStore,
      );

      final session = await repository.restoreSession();

      expect(session, isNull);
    },
  );

  test('persists access token through the session store boundary', () async {
    final sessionStore = _FakeSessionStore();
    final repository = MemberSessionRepository(
      apiClient: ApiClient(config: _normalConfig),
      sessionStore: sessionStore,
    );
    const session = MemberSession(
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

    await repository.persistSession(session);

    expect(sessionStore.accessToken, 'member-token');
    expect(sessionStore.memberProfileJson, contains('member@example.com'));
  });

  test('clears the local session after a password reset', () async {
    final sessionStore = _FakeSessionStore()
      ..accessToken = 'member-token'
      ..memberProfileJson = jsonEncode(_memberJson);
    final repository = MemberSessionRepository(
      apiClient: ApiClient(config: _normalConfig),
      sessionStore: sessionStore,
    );

    await repository.clearLocalSession();

    expect(sessionStore.accessToken, isNull);
    expect(sessionStore.memberProfileJson, isNull);
  });

  test(
    'clears a cached session when the backend rejects authentication',
    () async {
      final sessionStore = _FakeSessionStore()
        ..accessToken = 'expired-token'
        ..memberProfileJson = jsonEncode(_memberJson);
      final dio = _MemberSessionDio.error(
        statusCode: 401,
        code: 'member_session_invalid',
        category: 'authentication_required',
      );
      final repository = MemberSessionRepository(
        apiClient: ApiClient(config: _normalConfig, dio: dio.instance),
        sessionStore: sessionStore,
      );

      final session = await repository.restoreSession();

      expect(session, isNull);
      expect(sessionStore.accessToken, isNull);
      expect(sessionStore.memberProfileJson, isNull);
    },
  );

  test(
    'uses the secured profile cache only for a transient API failure',
    () async {
      final sessionStore = _FakeSessionStore()
        ..accessToken = 'member-token'
        ..memberProfileJson = jsonEncode(_memberJson);
      final dio = _MemberSessionDio.error(
        statusCode: 503,
        code: 'service_unavailable',
        category: 'external_dependency_failed',
      );
      final repository = MemberSessionRepository(
        apiClient: ApiClient(config: _normalConfig, dio: dio.instance),
        sessionStore: sessionStore,
      );

      final session = await repository.restoreSession();

      expect(session?.accessToken, 'member-token');
      expect(session?.member.email, 'member@example.com');
      expect(sessionStore.accessToken, 'member-token');
    },
  );

  test(
    'loads the canonical profile when only a secured token exists',
    () async {
      final sessionStore = _FakeSessionStore()..accessToken = 'member-token';
      final dio = _MemberSessionDio.success();
      final repository = MemberSessionRepository(
        apiClient: ApiClient(config: _normalConfig, dio: dio.instance),
        sessionStore: sessionStore,
      );

      final session = await repository.restoreSession();

      expect(session?.member.id, 'member-1');
      expect(sessionStore.memberProfileJson, contains('member@example.com'));
    },
  );

  test('exchanges a Firebase token for the canonical member session', () async {
    final sessionStore = _FakeSessionStore();
    final dio = _MemberSessionDio.firebaseSession();
    final repository = MemberSessionRepository(
      apiClient: ApiClient(config: _normalConfig, dio: dio.instance),
      sessionStore: sessionStore,
    );

    final result = await repository.signInWithFirebase(
      idToken: 'firebase-id-token',
    );

    expect(result.status, 'signed_in');
    expect(result.session?.member.id, 'member-1');
    expect(sessionStore.accessToken, 'backend-member-token');
    expect(dio.lastPath, '/member/auth/firebase');
    expect(dio.lastData, {'idToken': 'firebase-id-token'});
  });
}

const _normalConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);

const _debugConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
  debugMemberAuthBypass: true,
  debugMemberAccessToken: 'debug-token',
);

class _FakeSessionStore implements SessionStore {
  String? accessToken;
  String? memberProfileJson;

  @override
  Future<void> clearAccessToken() async {
    accessToken = null;
  }

  @override
  Future<void> clearMemberProfileJson() async {
    memberProfileJson = null;
  }

  @override
  Future<void> clearSession() async {
    await clearAccessToken();
    await clearMemberProfileJson();
  }

  @override
  Future<String?> readAccessToken() async {
    return accessToken;
  }

  @override
  Future<String?> readMemberProfileJson() async {
    return memberProfileJson;
  }

  @override
  Future<void> writeAccessToken(String accessToken) async {
    this.accessToken = accessToken;
  }

  @override
  Future<void> writeMemberProfileJson(String profileJson) async {
    memberProfileJson = profileJson;
  }
}

class _MemberSessionDio {
  _MemberSessionDio.success()
    : _statusCode = 200,
      _response = const {
        'data': {'member': _memberJson},
        'meta': <String, Object?>{},
      } {
    _installInterceptor();
  }

  _MemberSessionDio.error({
    required int statusCode,
    required String code,
    required String category,
  }) : _statusCode = statusCode,
       _response = {
         'error': {
           'code': code,
           'category': category,
           'sourceLayer': 'feature',
           'message': 'Session check failed.',
           'recoverable': true,
           'retryable': statusCode >= 500,
           'evidence': <String, Object?>{},
           'nextAction': statusCode == 401 ? 'sign_in' : 'retry',
           'details': <String, Object?>{},
         },
       } {
    _installInterceptor();
  }

  _MemberSessionDio.firebaseSession()
    : _statusCode = 200,
      _response = const {
        'data': {
          'status': 'signed_in',
          'provider': 'google',
          'session': {
            'accessToken': 'backend-member-token',
            'expiresInSeconds': 2592000,
            'member': _memberJson,
          },
        },
        'meta': <String, Object?>{},
      } {
    _installInterceptor();
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _normalConfig.apiBaseUrl));
  final int _statusCode;
  final Map<String, Object?> _response;
  String? lastPath;
  Object? lastData;

  void _installInterceptor() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          lastPath = options.path;
          lastData = options.data;
          final response = Response<Object?>(
            requestOptions: options,
            statusCode: _statusCode,
            data: _response,
          );
          if (_statusCode >= 400) {
            handler.reject(
              DioException(requestOptions: options, response: response),
            );
            return;
          }
          handler.resolve(response);
        },
      ),
    );
  }
}

const _memberJson = <String, Object?>{
  'id': 'member-1',
  'email': 'member@example.com',
  'displayName': 'Member',
  'phone': null,
  'address': null,
  'faithStartYear': null,
  'baptizedYear': null,
  'joinedChurchAt': null,
  'emergencyContactName': null,
  'emergencyContactPhone': null,
  'status': 'active',
  'roles': <Object?>['member'],
  'appLocale': 'en',
  'fellowshipGroupId': null,
  'notificationSettings': <String, Object?>{
    'weeklyBulletin': true,
    'sermonPublished': true,
    'lifePostPublished': true,
    'prayerUpdates': false,
  },
};
