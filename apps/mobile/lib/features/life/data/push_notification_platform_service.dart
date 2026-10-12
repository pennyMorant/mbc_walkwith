import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/firebase/firebase_app_initializer.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import 'firebase_push_device_registration.dart';
import 'push_notification_inbox_repository.dart';
import 'push_local_notification_presenter.dart';
import 'push_notification_platform_types.dart';

final pushNotificationPlatformServiceProvider =
    Provider<PushNotificationPlatformService>(
      (ref) => FirebasePushNotificationPlatformService(
        preferences: ref.watch(sharedPreferencesProvider),
        firebaseInitializer: ref.watch(firebaseAppInitializerProvider),
      ),
    );

abstract class PushNotificationPlatformService {
  bool get isReady;

  Future<PushNotificationPlatformStartResult> start({
    required PushNotificationRouteHandler onRoute,
    required PushNotificationTokenRefreshHandler onTokenRefresh,
  });

  Future<String?> resolvePushToken(String? pushTokenOverride);

  Future<String> installationId();

  String platformValue();

  Future<void> dispose();
}

class FirebasePushNotificationPlatformService
    implements PushNotificationPlatformService {
  FirebasePushNotificationPlatformService({
    required SharedPreferences preferences,
    required FirebaseAppInitializer firebaseInitializer,
    FirebaseMessaging? messaging,
    FlutterLocalNotificationsPlugin? localNotifications,
  }) : _preferences = preferences,
       _firebaseInitializer = firebaseInitializer,
       _messagingOverride = messaging,
       _localNotificationPresenter = PushLocalNotificationPresenter(
         localNotifications: localNotifications,
       );

  final SharedPreferences _preferences;
  final FirebaseAppInitializer _firebaseInitializer;
  final FirebaseMessaging? _messagingOverride;
  final PushLocalNotificationPresenter _localNotificationPresenter;

  FirebaseMessaging? _messagingInstance;
  FirebasePushDeviceRegistration? _deviceRegistrationInstance;
  PushNotificationInboxRepository? _inboxRepositoryInstance;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  StreamSubscription<RemoteMessage>? _openedMessageSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;
  bool _started = false;
  bool _ready = false;

  @override
  bool get isReady => _ready;

  FirebaseMessaging get _messaging =>
      _messagingOverride ?? (_messagingInstance ??= FirebaseMessaging.instance);

  FirebasePushDeviceRegistration get _deviceRegistration =>
      _deviceRegistrationInstance ??= FirebasePushDeviceRegistration(
        messaging: _messaging,
        preferences: _preferences,
      );

  PushNotificationInboxRepository get _inboxRepository =>
      _inboxRepositoryInstance ??= PushNotificationInboxRepository(
        preferences: _preferences,
      );

  @override
  Future<PushNotificationPlatformStartResult> start({
    required PushNotificationRouteHandler onRoute,
    required PushNotificationTokenRefreshHandler onTokenRefresh,
  }) async {
    _localNotificationPresenter.bindRouteHandler(onRoute);
    if (kIsWeb) {
      return const PushNotificationPlatformStartResult.unsupported();
    }
    if (_started) {
      return PushNotificationPlatformStartResult(supported: _ready);
    }
    _started = true;

    try {
      await _firebaseInitializer.ensureInitialized();
    } on FirebaseSetupException {
      return const PushNotificationPlatformStartResult.unsupported(
        setupError:
            'Firebase is not configured. Run "flutterfire configure" and '
            'replace lib/firebase_options.dart with generated values.',
      );
    }
    _ready = true;

    await _localNotificationPresenter.initialize();
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: true,
      sound: true,
    );

    _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen((
      message,
    ) {
      unawaited(_recordAndShowForegroundMessage(message));
    });
    _openedMessageSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
      _handleOpenedMessage,
    );
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((token) {
      unawaited(onTokenRefresh(token));
    });

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleOpenedMessage(initialMessage);
    }

    return const PushNotificationPlatformStartResult(supported: true);
  }

  @override
  Future<String?> resolvePushToken(String? pushTokenOverride) {
    return _deviceRegistration.resolvePushToken(pushTokenOverride);
  }

  @override
  Future<String> installationId() {
    return _deviceRegistration.installationId();
  }

  Future<void> _recordAndShowForegroundMessage(RemoteMessage message) async {
    await _inboxRepository.recordRemoteMessage(message);
    await _localNotificationPresenter.showForegroundNotification(message);
  }

  void _handleOpenedMessage(RemoteMessage message) {
    unawaited(_inboxRepository.recordRemoteMessage(message, markRead: true));
    _localNotificationPresenter.handleRemoteMessage(message);
  }

  @override
  String platformValue() {
    return FirebasePushDeviceRegistration.platformValue();
  }

  @override
  Future<void> dispose() async {
    await _foregroundMessageSubscription?.cancel();
    await _openedMessageSubscription?.cancel();
    await _tokenRefreshSubscription?.cancel();
    _foregroundMessageSubscription = null;
    _openedMessageSubscription = null;
    _tokenRefreshSubscription = null;
    _started = false;
    _ready = false;
  }
}
