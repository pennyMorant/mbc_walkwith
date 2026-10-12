import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/storage/shared_preferences_provider.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_platform_service.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_platform_types.dart';
import 'package:mbc_walkwith/features/life/data/push_notification_repository.dart';
import 'package:mbc_walkwith/features/life/data/system_notification_permission_service.dart';
import 'package:mbc_walkwith/features/life/presentation/push_notifications_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'first start requests permission once and registers guest token',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      final permission = _FakeSystemNotificationPermissionService();
      final platform = _FakePushNotificationPlatformService();
      final pushRepository = _FakePushNotificationRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(_testAppConfig),
          sharedPreferencesProvider.overrideWithValue(preferences),
          systemNotificationPermissionServiceProvider.overrideWithValue(
            permission,
          ),
          pushNotificationPlatformServiceProvider.overrideWithValue(platform),
          pushNotificationRepositoryProvider.overrideWithValue(pushRepository),
        ],
      );
      addTearDown(container.dispose);

      await container
          .read(pushNotificationsControllerProvider.notifier)
          .start(_testRouter());

      final state = container.read(pushNotificationsControllerProvider);
      expect(permission.requestPermissionCount, 1);
      expect(state.permissionGranted, isTrue);
      expect(pushRepository.guestRegistrations, 1);
      expect(pushRepository.lastPermissionStatus, 'authorized');
    },
  );

  test('granted switch path opens native notification settings', () async {
    SharedPreferences.setMockInitialValues({
      'push_notification_permission_requested_once': true,
    });
    final preferences = await SharedPreferences.getInstance();
    final permission = _FakeSystemNotificationPermissionService(
      permissionStatus: 'authorized',
    );
    final platform = _FakePushNotificationPlatformService();
    final container = ProviderContainer(
      overrides: [
        appConfigProvider.overrideWithValue(_testAppConfig),
        sharedPreferencesProvider.overrideWithValue(preferences),
        systemNotificationPermissionServiceProvider.overrideWithValue(
          permission,
        ),
        pushNotificationPlatformServiceProvider.overrideWithValue(platform),
        pushNotificationRepositoryProvider.overrideWithValue(
          _FakePushNotificationRepository(),
        ),
      ],
    );
    addTearDown(container.dispose);
    final controller = container.read(
      pushNotificationsControllerProvider.notifier,
    );

    await controller.start(_testRouter());
    await controller.openSystemNotificationSettingsAndRefresh();

    expect(permission.openSettingsCount, 1);
    expect(
      container.read(pushNotificationsControllerProvider).permissionGranted,
      isTrue,
    );
  });

  test(
    'system permission remains available when Firebase push is unavailable',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      final permission = _FakeSystemNotificationPermissionService();
      final platform = _FakePushNotificationPlatformService(
        supported: false,
        setupError: 'Firebase is not configured.',
      );
      final pushRepository = _FakePushNotificationRepository();
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(_testAppConfig),
          sharedPreferencesProvider.overrideWithValue(preferences),
          systemNotificationPermissionServiceProvider.overrideWithValue(
            permission,
          ),
          pushNotificationPlatformServiceProvider.overrideWithValue(platform),
          pushNotificationRepositoryProvider.overrideWithValue(pushRepository),
        ],
      );
      addTearDown(container.dispose);

      await container
          .read(pushNotificationsControllerProvider.notifier)
          .start(_testRouter());

      final state = container.read(pushNotificationsControllerProvider);
      expect(permission.requestPermissionCount, 1);
      expect(state.supported, isTrue);
      expect(state.permissionGranted, isTrue);
      expect(state.isRegistered, isFalse);
      expect(state.lastError, 'Firebase is not configured.');
      expect(pushRepository.guestRegistrations, 0);
    },
  );
}

GoRouter _testRouter() {
  return GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SizedBox.shrink()),
    ],
  );
}

class _FakePushNotificationPlatformService
    implements PushNotificationPlatformService {
  _FakePushNotificationPlatformService({
    this.supported = true,
    this.setupError,
  });

  final bool supported;
  final String? setupError;

  @override
  bool get isReady => supported;

  @override
  Future<PushNotificationPlatformStartResult> start({
    required PushNotificationRouteHandler onRoute,
    required PushNotificationTokenRefreshHandler onTokenRefresh,
  }) async {
    return PushNotificationPlatformStartResult(
      supported: supported,
      setupError: setupError,
    );
  }

  @override
  Future<String?> resolvePushToken(String? pushTokenOverride) async {
    return pushTokenOverride ?? 'test-push-token';
  }

  @override
  Future<String> installationId() async => 'test-installation';

  @override
  String platformValue() => 'android';

  @override
  Future<void> dispose() async {}
}

class _FakeSystemNotificationPermissionService
    implements SystemNotificationPermissionService {
  _FakeSystemNotificationPermissionService({
    this.permissionStatus = 'not_determined',
  });

  String permissionStatus;
  @override
  bool get isSupported => true;
  int requestPermissionCount = 0;
  int openSettingsCount = 0;

  @override
  Future<String> currentStatus() async => permissionStatus;

  @override
  Future<String> requestStatus() async {
    requestPermissionCount += 1;
    permissionStatus = 'authorized';
    return permissionStatus;
  }

  @override
  Future<void> openSettings() async {
    openSettingsCount += 1;
  }
}

class _FakePushNotificationRepository extends PushNotificationRepository {
  _FakePushNotificationRepository()
    : super(apiClient: ApiClient(config: _testAppConfig));

  int guestRegistrations = 0;
  String? lastPermissionStatus;

  @override
  Future<void> upsertGuestDevice({
    required PushDeviceRegistrationPayload payload,
  }) async {
    guestRegistrations += 1;
    lastPermissionStatus = payload.permissionStatus;
  }
}

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);
