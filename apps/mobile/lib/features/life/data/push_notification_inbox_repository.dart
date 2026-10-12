import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/storage/shared_preferences_provider.dart';

final pushNotificationInboxRepositoryProvider =
    Provider<PushNotificationInboxRepository>(
      (ref) => PushNotificationInboxRepository(
        preferences: ref.watch(sharedPreferencesProvider),
      ),
    );

class PushNotificationInboxRepository {
  const PushNotificationInboxRepository({required this.preferences});

  static const _storageKey = 'push_notification_inbox_items_v1';
  static const _maxItems = 50;

  final SharedPreferences preferences;

  List<PushNotificationInboxItem> listItems() {
    final rawItems = preferences.getStringList(_storageKey) ?? const [];
    final items =
        rawItems
            .map(_decodeItem)
            .whereType<PushNotificationInboxItem>()
            .toList()
          ..sort((left, right) => right.receivedAt.compareTo(left.receivedAt));
    return items;
  }

  Future<PushNotificationInboxItem?> recordRemoteMessage(
    RemoteMessage message, {
    bool markRead = false,
  }) async {
    final item = PushNotificationInboxItem.fromRemoteMessage(
      message,
      markRead: markRead,
    );
    if (item == null) {
      return null;
    }
    final existing = listItems();
    final next = [
      item,
      ...existing.where((candidate) => candidate.id != item.id),
    ].take(_maxItems).toList();
    await _writeItems(next);
    return item;
  }

  Future<void> markRead(String itemId) async {
    final now = DateTime.now().toUtc();
    final next = listItems()
        .map(
          (item) => item.id == itemId && item.readAt == null
              ? item.copyWith(readAt: now)
              : item,
        )
        .toList();
    await _writeItems(next);
  }

  Future<void> markAllRead() async {
    final now = DateTime.now().toUtc();
    final next = listItems()
        .map((item) => item.readAt == null ? item.copyWith(readAt: now) : item)
        .toList();
    await _writeItems(next);
  }

  Future<void> clear() async {
    await preferences.remove(_storageKey);
  }

  Future<void> _writeItems(List<PushNotificationInboxItem> items) async {
    await preferences.setStringList(
      _storageKey,
      items.map((item) => jsonEncode(item.toJson())).toList(),
    );
  }
}

class PushNotificationInboxItem {
  const PushNotificationInboxItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.receivedAt,
    required this.data,
    this.route,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String? route;
  final DateTime receivedAt;
  final DateTime? readAt;
  final Map<String, String> data;

  bool get isRead => readAt != null;

  PushNotificationInboxItem copyWith({DateTime? readAt}) {
    return PushNotificationInboxItem(
      id: id,
      type: type,
      title: title,
      body: body,
      route: route,
      receivedAt: receivedAt,
      readAt: readAt ?? this.readAt,
      data: data,
    );
  }

  factory PushNotificationInboxItem.fromJson(Map<String, Object?> json) {
    return PushNotificationInboxItem(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'church_update',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      route: json['route'] as String?,
      receivedAt:
          DateTime.tryParse(json['receivedAt'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      readAt: DateTime.tryParse(json['readAt'] as String? ?? ''),
      data: _stringMap(json['data']),
    );
  }

  factory PushNotificationInboxItem.fromMemberNotificationJson(
    Map<String, Object?> json,
  ) {
    return PushNotificationInboxItem(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'church_update',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      route: json['route'] as String?,
      receivedAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      readAt: DateTime.tryParse(json['readAt'] as String? ?? ''),
      data: _stringMap(json['data']),
    );
  }

  static PushNotificationInboxItem? fromRemoteMessage(
    RemoteMessage message, {
    required bool markRead,
  }) {
    final data = message.data.map(
      (key, value) => MapEntry(key, value.toString()),
    );
    final title = message.notification?.title ?? data['title'];
    final body = message.notification?.body ?? data['body'];
    if (title == null ||
        title.trim().isEmpty ||
        body == null ||
        body.trim().isEmpty) {
      return null;
    }
    final now = DateTime.now().toUtc();
    final id =
        message.messageId ??
        data['messageId'] ??
        '${data['type'] ?? 'church_update'}:${data['targetId'] ?? data['lifePostId'] ?? data['sermonId'] ?? now.toIso8601String()}';
    return PushNotificationInboxItem(
      id: id,
      type: data['type'] ?? 'church_update',
      title: title.trim(),
      body: body.trim(),
      route: routeFromPushData(data),
      receivedAt: message.sentTime?.toUtc() ?? now,
      readAt: markRead ? now : null,
      data: data,
    );
  }

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'body': body,
      'route': route,
      'receivedAt': receivedAt.toIso8601String(),
      'readAt': readAt?.toIso8601String(),
      'data': data,
    };
  }
}

PushNotificationInboxItem? _decodeItem(String raw) {
  try {
    final decoded = jsonDecode(raw);
    if (decoded is Map) {
      final item = PushNotificationInboxItem.fromJson(
        decoded.map((key, value) => MapEntry(key.toString(), value)),
      );
      if (item.id.isNotEmpty && item.title.isNotEmpty && item.body.isNotEmpty) {
        return item;
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

Map<String, String> _stringMap(Object? value) {
  if (value is Map<String, Object?>) {
    return value.map((key, value) => MapEntry(key, value?.toString() ?? ''));
  }
  if (value is Map) {
    return value.map(
      (key, value) => MapEntry(key.toString(), value?.toString() ?? ''),
    );
  }
  return const {};
}

String? routeFromPushData(Map<String, String> data) {
  final route = data['route'];
  if (route != null && route.trim().startsWith('/')) {
    return route.trim();
  }
  if (data['type'] == 'life_post_published') {
    final postId = data['lifePostId'] ?? data['targetId'];
    if (postId != null && postId.trim().isNotEmpty) {
      return '/life/posts/${_routePathSegment(postId)}';
    }
  }
  if (data['type'] == 'weekly_bulletin_published') {
    final postId = data['lifePostId'] ?? data['targetId'];
    if (postId != null && postId.trim().isNotEmpty) {
      return '/life/posts/${_routePathSegment(postId)}';
    }
    return '/life';
  }
  if (data['type'] == 'prayer_update_published') {
    return '/life';
  }
  if (data['type'] == 'sermon_published') {
    final sermonId = data['sermonId'];
    if (sermonId != null && sermonId.trim().isNotEmpty) {
      return '/sermons/${_routePathSegment(sermonId)}';
    }
    return '/sermons';
  }
  return null;
}

String _routePathSegment(String value) {
  return Uri.encodeComponent(value.trim());
}
