import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_inbox_repository.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('maps life post push data to the life post detail route', () {
    expect(
      routeFromPushData({
        'type': 'life_post_published',
        'lifePostId': 'life/post 1',
      }),
      '/life/posts/life%2Fpost%201',
    );
  });

  test('maps sermon push data to the sermon detail route', () {
    expect(
      routeFromPushData({'type': 'sermon_published', 'sermonId': 'sermon/1'}),
      '/sermons/sermon%2F1',
    );
  });

  test('maps weekly bulletin push data to the life post detail route', () {
    expect(
      routeFromPushData({
        'type': 'weekly_bulletin_published',
        'lifePostId': 'weekly/1',
      }),
      '/life/posts/weekly%2F1',
    );
  });

  test('maps prayer update push data to the life tab', () {
    expect(routeFromPushData({'type': 'prayer_update_published'}), '/life');
  });

  test('uses explicit route when push data provides one', () {
    expect(
      routeFromPushData({
        'type': 'life_post_published',
        'route': '/life/posts/manual-route',
        'lifePostId': 'life-post-1',
      }),
      '/life/posts/manual-route',
    );
  });

  test('maps backend member notification JSON to inbox items', () {
    final item = PushNotificationInboxItem.fromMemberNotificationJson(const {
      'id': 'notification-item-1',
      'type': 'life_post_published',
      'title': 'Members meal',
      'body': 'Dinner details for church members.',
      'route': '/life/posts/life-post-1',
      'data': {
        'lifePostId': 'life-post-1',
        'targetType': 'life_post',
        'targetId': 'life-post-1',
      },
      'readAt': null,
      'createdAt': '2026-06-24T16:00:00.000Z',
    });

    expect(item.id, 'notification-item-1');
    expect(item.receivedAt.toIso8601String(), '2026-06-24T16:00:00.000Z');
    expect(item.route, '/life/posts/life-post-1');
    expect(item.data['targetId'], 'life-post-1');
    expect(item.isRead, isFalse);
  });

  test(
    'calls backend member notification inbox APIs with bearer auth',
    () async {
      final dio = _NotificationDio();
      final repository = PushNotificationRepository(
        apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
      );

      final inbox = await repository.listInbox(session: _memberSession);
      final readItem = await repository.markInboxItemRead(
        session: _memberSession,
        notificationId: 'notification/item 1',
      );
      final updatedCount = await repository.markAllInboxRead(
        session: _memberSession,
      );
      final archivedItem = await repository.archiveInboxItem(
        session: _memberSession,
        notificationId: 'notification/item 1',
      );
      final archivedCount = await repository.archiveAllInbox(
        session: _memberSession,
      );

      expect(inbox.unreadCount, 1);
      expect(inbox.items.single.title, 'Members meal');
      expect(readItem?.isRead, isTrue);
      expect(updatedCount, 1);
      expect(archivedItem?.id, 'notification-item-1');
      expect(archivedCount, 1);
      expect(dio.requests.map((request) => request.path), [
        '/member/notifications?limit=50',
        '/member/notifications/notification%2Fitem%201/read',
        '/member/notifications/read-all',
        '/member/notifications/notification%2Fitem%201/archive',
        '/member/notifications/archive-all',
      ]);
      expect(
        dio.requests.every(
          (request) => request.authorization == 'Bearer member-token',
        ),
        isTrue,
      );
    },
  );

  test('registers guest push devices without bearer auth', () async {
    final dio = _NotificationDio();
    final repository = PushNotificationRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await repository.upsertGuestDevice(
      payload: const PushDeviceRegistrationPayload(
        installationId: 'guest-installation-1',
        platform: 'ios',
        provider: 'fcm',
        pushToken: 'token-guest-mobile-abcdefghijklmnopqrstuvwxyz',
        permissionStatus: 'authorized',
        locale: 'en',
      ),
    );

    expect(dio.requests.single.path, '/app/devices/push-token');
    expect(dio.requests.single.authorization, isNull);
  });
}

class _NotificationDio {
  _NotificationDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: _responseFor(options.path),
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedRequest> requests = [];

  Map<String, Object?> _responseFor(String path) {
    if (path == '/member/notifications?limit=50') {
      return const {
        'data': {
          'items': [_notificationItemJson],
          'unreadCount': 1,
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/member/notifications/read-all' ||
        path == '/member/notifications/archive-all') {
      return const {
        'data': {'updatedCount': 1},
        'meta': <String, Object?>{},
      };
    }
    return {
      'data': {
        'item': {
          ..._notificationItemJson,
          'readAt': '2026-06-24T16:05:00.000Z',
        },
      },
      'meta': <String, Object?>{},
    };
  }
}

class _RecordedRequest {
  const _RecordedRequest({required this.path, required this.authorization});

  final String path;
  final String? authorization;
}

const _notificationItemJson = {
  'id': 'notification-item-1',
  'messageId': 'notification-message-1',
  'type': 'life_post_published',
  'title': 'Members meal',
  'body': 'Dinner details for church members.',
  'route': '/life/posts/life-post-1',
  'data': {
    'lifePostId': 'life-post-1',
    'targetType': 'life_post',
    'targetId': 'life-post-1',
  },
  'readAt': null,
  'archivedAt': null,
  'createdAt': '2026-06-24T16:00:00.000Z',
};

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
  useMockRemoteData: true,
);
