import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'push_notification_inbox_repository.dart';
import 'push_notification_platform_types.dart';

class PushLocalNotificationPresenter {
  PushLocalNotificationPresenter({
    FlutterLocalNotificationsPlugin? localNotifications,
  }) : _localNotifications =
           localNotifications ?? FlutterLocalNotificationsPlugin();

  static const _channelId = 'church_updates';
  static const _channelName = 'Church Updates';

  final FlutterLocalNotificationsPlugin _localNotifications;
  PushNotificationRouteHandler? _onRoute;

  void bindRouteHandler(PushNotificationRouteHandler onRoute) {
    _onRoute = onRoute;
  }

  Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      settings: const InitializationSettings(
        android: androidSettings,
        iOS: darwinSettings,
      ),
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          _onRoute?.call(payload);
        }
      },
    );

    const channel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: 'Push notifications for church updates',
      importance: Importance.high,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);
  }

  Future<void> showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    final title = notification?.title;
    final body = notification?.body;
    if (title == null || body == null) {
      return;
    }

    final route = _routeFromData(message.data);
    await _localNotifications.show(
      id: message.hashCode,
      title: title,
      body: body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: route,
    );
  }

  void handleRemoteMessage(RemoteMessage message) {
    final route = _routeFromData(message.data);
    if (route != null) {
      _onRoute?.call(route);
    }
  }

  String? _routeFromData(Map<String, dynamic> data) {
    return routeFromPushData(
      data.map((key, value) => MapEntry(key, value.toString())),
    );
  }
}
