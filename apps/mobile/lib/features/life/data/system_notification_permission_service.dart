import 'package:app_settings/app_settings.dart' as device_settings;
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final systemNotificationPermissionServiceProvider =
    Provider<SystemNotificationPermissionService>(
      (ref) => LocalSystemNotificationPermissionService(),
    );

abstract class SystemNotificationPermissionService {
  bool get isSupported;

  Future<String> currentStatus();

  Future<String> requestStatus();

  Future<void> openSettings();
}

class LocalSystemNotificationPermissionService
    implements SystemNotificationPermissionService {
  LocalSystemNotificationPermissionService({
    FlutterLocalNotificationsPlugin? localNotifications,
  }) : _localNotifications =
           localNotifications ?? FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin _localNotifications;

  @override
  bool get isSupported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  Future<String> currentStatus() async {
    if (!isSupported) {
      return 'not_determined';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      final enabled = await _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.areNotificationsEnabled();
      return enabled == true ? 'authorized' : 'denied';
    }
    final options = await _localNotifications
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.checkPermissions();
    if (options?.isProvisionalEnabled == true) {
      return 'provisional';
    }
    return options?.isEnabled == true ? 'authorized' : 'denied';
  }

  @override
  Future<String> requestStatus() async {
    if (!isSupported) {
      return 'not_determined';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      final granted = await _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.requestNotificationsPermission();
      return granted == true ? 'authorized' : 'denied';
    }
    final granted = await _localNotifications
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);
    return granted == true ? 'authorized' : 'denied';
  }

  @override
  Future<void> openSettings() {
    return device_settings.AppSettings.openAppSettings(
      type: device_settings.AppSettingsType.notification,
    );
  }
}
