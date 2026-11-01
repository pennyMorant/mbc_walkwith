import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../member_auth/data/member_session_repository.dart';
import 'push_notification_inbox_repository.dart';

final pushNotificationRepositoryProvider = Provider<PushNotificationRepository>(
  (ref) => PushNotificationRepository(apiClient: ref.watch(apiClientProvider)),
);

class PushNotificationRepository {
  const PushNotificationRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<void> revokeCurrentDevice({
    required MemberSession session,
    required String installationId,
  }) async {
    await apiClient.postJsonMapWithBearer('/member/devices/push-token/revoke', {
      'installationId': installationId,
    }, session.accessToken);
  }

  Future<void> revokeGuestDevice({required String installationId}) async {
    await apiClient.postJsonMap('/app/devices/push-token/revoke', {
      'installationId': installationId,
    });
  }

  Future<void> upsertCurrentDevice({
    required MemberSession session,
    required PushDeviceRegistrationPayload payload,
  }) async {
    await apiClient.putJsonMapWithBearer(
      '/member/devices/push-token',
      payload.toJson(),
      session.accessToken,
    );
  }

  Future<void> upsertGuestDevice({
    required PushDeviceRegistrationPayload payload,
  }) async {
    await apiClient.putJsonMap('/app/devices/push-token', payload.toJson());
  }

  Future<MemberNotificationInboxResult> listInbox({
    required MemberSession session,
    int limit = 50,
  }) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/member/notifications?limit=$limit',
      session.accessToken,
    );
    final data = _readData(response);
    final items = _readObjectList(data, 'items')
        .map(PushNotificationInboxItem.fromMemberNotificationJson)
        .toList(growable: false);
    return MemberNotificationInboxResult(
      items: items,
      unreadCount: _readNonNegativeInt(data, 'unreadCount'),
    );
  }

  Future<PushNotificationInboxItem?> markInboxItemRead({
    required MemberSession session,
    required String notificationId,
  }) async {
    final encodedNotificationId = Uri.encodeComponent(notificationId);
    final response = await apiClient.patchJsonMapWithBearer(
      '/member/notifications/$encodedNotificationId/read',
      const {},
      session.accessToken,
    );
    return _itemFromEnvelope(response);
  }

  Future<int> markAllInboxRead({required MemberSession session}) async {
    final response = await apiClient.patchJsonMapWithBearer(
      '/member/notifications/read-all',
      const {},
      session.accessToken,
    );
    return _readNonNegativeInt(_readData(response), 'updatedCount');
  }

  Future<PushNotificationInboxItem?> archiveInboxItem({
    required MemberSession session,
    required String notificationId,
  }) async {
    final encodedNotificationId = Uri.encodeComponent(notificationId);
    final response = await apiClient.patchJsonMapWithBearer(
      '/member/notifications/$encodedNotificationId/archive',
      const {},
      session.accessToken,
    );
    return _itemFromEnvelope(response);
  }

  Future<int> archiveAllInbox({required MemberSession session}) async {
    final response = await apiClient.patchJsonMapWithBearer(
      '/member/notifications/archive-all',
      const {},
      session.accessToken,
    );
    return _readNonNegativeInt(_readData(response), 'updatedCount');
  }

  PushNotificationInboxItem? _itemFromEnvelope(Map<String, Object?> response) {
    final data = _readData(response);
    final item = data['item'];
    if (item == null) return null;
    if (item is Map<String, Object?>) {
      return PushNotificationInboxItem.fromMemberNotificationJson(item);
    }
    throw const FormatException(
      'Member notification item must be null or an object.',
    );
  }
}

Map<String, Object?> _readData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException(
      'Member notification response data must be an object.',
    );
  }
  return data;
}

List<Map<String, Object?>> _readObjectList(
  Map<String, Object?> data,
  String key,
) {
  final value = data[key];
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw FormatException('$key must be a member notification object list.');
  }
  return value.cast<Map<String, Object?>>();
}

int _readNonNegativeInt(Map<String, Object?> data, String key) {
  final value = data[key];
  if (value is! int || value < 0) {
    throw FormatException('$key must be a non-negative integer.');
  }
  return value;
}

class MemberNotificationInboxResult {
  const MemberNotificationInboxResult({
    required this.items,
    required this.unreadCount,
  });

  final List<PushNotificationInboxItem> items;
  final int unreadCount;
}

class PushDeviceRegistrationPayload {
  const PushDeviceRegistrationPayload({
    required this.installationId,
    required this.platform,
    required this.provider,
    required this.pushToken,
    required this.permissionStatus,
    required this.locale,
  });

  final String installationId;
  final String platform;
  final String provider;
  final String pushToken;
  final String permissionStatus;
  final String locale;

  Map<String, Object?> toJson() {
    return {
      'installationId': installationId,
      'platform': platform,
      'provider': provider,
      'pushToken': pushToken,
      'permissionStatus': permissionStatus,
      'locale': locale,
    };
  }
}
