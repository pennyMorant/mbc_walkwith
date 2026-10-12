import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/storage/shared_preferences_provider.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_inbox_repository.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_repository.dart';
import 'package:mbc_walkwith/features/life/presentation/notification_inbox_provider.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('preserves remote inbox across mutation and refresh failures', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final remote = _FakePushNotificationRepository();
    final container = ProviderContainer.test(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(preferences),
        memberSessionProvider.overrideWith((ref) async => _memberSession),
        pushNotificationRepositoryProvider.overrideWithValue(remote),
      ],
    );
    addTearDown(container.dispose);
    final notifier = container.read(notificationInboxProvider.notifier);

    await notifier.refresh();
    expect(container.read(notificationInboxProvider).isRemote, isTrue);
    expect(
      container.read(notificationInboxProvider).items.single.id,
      'remote-1',
    );

    remote.failMarkRead = true;
    await notifier.markRead('remote-1');
    final afterMutationFailure = container.read(notificationInboxProvider);
    expect(afterMutationFailure.isRemote, isTrue);
    expect(afterMutationFailure.items.single.id, 'remote-1');
    expect(afterMutationFailure.items.single.isRead, isFalse);
    expect(afterMutationFailure.lastError, isNotNull);

    remote.failList = true;
    await notifier.refresh();
    final afterRefreshFailure = container.read(notificationInboxProvider);
    expect(afterRefreshFailure.isRemote, isTrue);
    expect(afterRefreshFailure.items.single.id, 'remote-1');
    expect(afterRefreshFailure.lastError, isNotNull);
  });

  test('clears a signed-in inbox with one archive-all mutation', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final remote = _FakePushNotificationRepository();
    final container = ProviderContainer.test(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(preferences),
        memberSessionProvider.overrideWith((ref) async => _memberSession),
        pushNotificationRepositoryProvider.overrideWithValue(remote),
      ],
    );
    addTearDown(container.dispose);
    final notifier = container.read(notificationInboxProvider.notifier);

    await notifier.refresh();
    await notifier.clear();

    final state = container.read(notificationInboxProvider);
    expect(remote.archiveAllCalls, 1);
    expect(state.isRemote, isTrue);
    expect(state.items, isEmpty);
    expect(state.unreadCount, 0);
    expect(state.lastError, isNull);
  });
}

class _FakePushNotificationRepository extends PushNotificationRepository {
  _FakePushNotificationRepository()
    : super(apiClient: ApiClient(config: _testAppConfig));

  bool failList = false;
  bool failMarkRead = false;
  int archiveAllCalls = 0;

  @override
  Future<MemberNotificationInboxResult> listInbox({
    required MemberSession session,
    int limit = 50,
  }) async {
    if (failList) {
      throw StateError('remote refresh failed');
    }
    return MemberNotificationInboxResult(items: [_remoteItem], unreadCount: 1);
  }

  @override
  Future<PushNotificationInboxItem?> markInboxItemRead({
    required MemberSession session,
    required String notificationId,
  }) async {
    if (failMarkRead) {
      throw StateError('remote mutation failed');
    }
    return _remoteItem.copyWith(readAt: DateTime.utc(2026, 7, 14, 12, 5));
  }

  @override
  Future<int> archiveAllInbox({required MemberSession session}) async {
    archiveAllCalls += 1;
    return 1;
  }
}

final _remoteItem = PushNotificationInboxItem(
  id: 'remote-1',
  type: 'sermon_published',
  title: 'New sermon',
  body: 'Romans 8',
  receivedAt: DateTime.utc(2026, 7, 14, 12),
  data: {'sermonId': 'sermon-1'},
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
  useMockRemoteData: true,
);
