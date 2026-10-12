typedef PushNotificationRouteHandler = void Function(String route);
typedef PushNotificationTokenRefreshHandler = Future<void> Function(
  String token,
);

class PushNotificationPlatformStartResult {
  const PushNotificationPlatformStartResult({
    required this.supported,
    this.setupError,
  });

  const PushNotificationPlatformStartResult.unsupported({String? setupError})
    : this(supported: false, setupError: setupError);

  final bool supported;
  final String? setupError;
}
