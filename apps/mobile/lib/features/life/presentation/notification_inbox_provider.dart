import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_error.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/push_notification_inbox_repository.dart';
import '../data/push_notification_repository.dart';

final notificationInboxProvider =
    NotifierProvider<NotificationInboxNotifier, NotificationInboxState>(
      NotificationInboxNotifier.new,
    );

class NotificationInboxState {
  const NotificationInboxState({
    required this.items,
    required this.unreadCount,
    required this.isSyncing,
    required this.isRemote,
    this.lastError,
  });

  factory NotificationInboxState.local(List<PushNotificationInboxItem> items) {
    return NotificationInboxState(
      items: items,
      unreadCount: items.where((item) => !item.isRead).length,
      isSyncing: false,
      isRemote: false,
    );
  }

  final List<PushNotificationInboxItem> items;
  final int unreadCount;
  final bool isSyncing;
  final bool isRemote;
  final String? lastError;

  NotificationInboxState copyWith({
    List<PushNotificationInboxItem>? items,
    int? unreadCount,
    bool? isSyncing,
    bool? isRemote,
    String? lastError,
    bool clearError = false,
  }) {
    final nextItems = items ?? this.items;
    return NotificationInboxState(
      items: nextItems,
      unreadCount:
          unreadCount ?? nextItems.where((item) => !item.isRead).length,
      isSyncing: isSyncing ?? this.isSyncing,
      isRemote: isRemote ?? this.isRemote,
      lastError: clearError ? null : lastError ?? this.lastError,
    );
  }
}

class NotificationInboxNotifier extends Notifier<NotificationInboxState> {
  PushNotificationInboxRepository get _localRepository =>
      ref.read(pushNotificationInboxRepositoryProvider);

  PushNotificationRepository get _remoteRepository =>
      ref.read(pushNotificationRepositoryProvider);

  @override
  NotificationInboxState build() {
    final localState = NotificationInboxState.local(
      _localRepository.listItems(),
    );
    ref.listen(memberSessionProvider, (previous, next) {
      next.whenData((session) {
        unawaited(
          Future<void>.microtask(() async {
            if (session == null) {
              state = NotificationInboxState.local(
                _localRepository.listItems(),
              );
              return;
            }
            await refresh();
          }),
        );
      });
    }, fireImmediately: true);
    return localState;
  }

  Future<void> refresh() async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final session = await _currentSession();
      if (session == null) {
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _syncRemote(session);
    } catch (error) {
      _handleFailure(error);
    }
  }

  Future<void> markRead(String itemId) async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final session = await _currentSession();
      if (session == null || !state.isRemote) {
        await _localRepository.markRead(itemId);
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      final updated = await _remoteRepository.markInboxItemRead(
        session: session,
        notificationId: itemId,
      );
      if (updated == null) {
        await _syncRemote(session);
        return;
      }
      state = state.copyWith(
        items: state.items
            .map((item) => item.id == updated.id ? updated : item)
            .toList(growable: false),
        isSyncing: false,
        isRemote: true,
        clearError: true,
      );
    } catch (error) {
      _handleFailure(error);
    }
  }

  Future<void> markAllRead() async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final session = await _currentSession();
      if (session == null || !state.isRemote) {
        await _localRepository.markAllRead();
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _remoteRepository.markAllInboxRead(session: session);
      final now = DateTime.now().toUtc();
      state = state.copyWith(
        items: state.items
            .map((item) => item.isRead ? item : item.copyWith(readAt: now))
            .toList(growable: false),
        unreadCount: 0,
        isSyncing: false,
        isRemote: true,
        clearError: true,
      );
    } catch (error) {
      _handleFailure(error);
    }
  }

  Future<void> clear() async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final session = await _currentSession();
      if (session == null) {
        await _localRepository.clear();
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _remoteRepository.archiveAllInbox(session: session);
      try {
        await _localRepository.clear();
      } catch (_) {
        // The backend archive remains authoritative for signed-in members.
      }
      state = const NotificationInboxState(
        items: [],
        unreadCount: 0,
        isSyncing: false,
        isRemote: true,
      );
    } catch (error) {
      _handleFailure(error);
    }
  }

  Future<MemberSession?> _currentSession() =>
      ref.read(memberSessionProvider.future);

  Future<void> _syncRemote(MemberSession session) async {
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final result = await _remoteRepository.listInbox(session: session);
      state = NotificationInboxState(
        items: result.items,
        unreadCount: result.unreadCount,
        isSyncing: false,
        isRemote: true,
      );
    } catch (error) {
      if (state.isRemote) {
        _preserveRemoteFailure(error);
      } else {
        state = NotificationInboxState.local(
          _localRepository.listItems(),
        ).copyWith(lastError: formatApiErrorMessage(error));
      }
    }
  }

  void _preserveRemoteFailure(Object error) {
    state = state.copyWith(
      isSyncing: false,
      isRemote: true,
      lastError: formatApiErrorMessage(error),
    );
  }

  void _handleFailure(Object error) {
    if (state.isRemote) {
      _preserveRemoteFailure(error);
      return;
    }
    state = NotificationInboxState.local(
      _localRepository.listItems(),
    ).copyWith(lastError: formatApiErrorMessage(error));
  }
}
