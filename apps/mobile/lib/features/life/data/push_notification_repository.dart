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
    final data = response['data'] as Map<String, Object?>? ?? const {};
    final items = ((data['items'] as List<Object?>?) ?? const [])
        .whereType<Map<String, Object?>>()
        .map(PushNotificationInboxItem.fromMemberNotificationJson)
        .where((item) => item.id.isNotEmpty)
        .toList(growable: false);
    return MemberNotificationInboxResult(
      items: items,
      unreadCount: data['unreadCount'] as int? ?? 0,
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
    final data = response['data'] as Map<String, Object?>? ?? const {};
    return data['updatedCount'] as int? ?? 0;
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
    final data = response['data'] as Map<String, Object?>? ?? const {};
    return data['updatedCount'] as int? ?? 0;
  }

  PushNotificationInboxItem? _itemFromEnvelope(Map<String, Object?> response) {
    final data = response['data'] as Map<String, Object?>? ?? const {};
    final item = data['item'];
    if (item is Map<String, Object?>) {
      return PushNotificationInboxItem.fromMemberNotificationJson(item);
    }
    return null;
  }
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
