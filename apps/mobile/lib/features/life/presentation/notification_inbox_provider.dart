import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  final Object? lastError;

  NotificationInboxState copyWith({
    List<PushNotificationInboxItem>? items,
    int? unreadCount,
    bool? isSyncing,
    bool? isRemote,
    Object? lastError,
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
  int _sessionSerial = 0;

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
        final sessionSerial = ++_sessionSerial;
        unawaited(
          Future<void>.microtask(() async {
            if (session == null) {
              state = NotificationInboxState.local(
                _localRepository.listItems(),
              );
              return;
            }
            state = const NotificationInboxState(
              items: [],
              unreadCount: 0,
              isSyncing: true,
              isRemote: true,
            );
            await _syncRemote(session, sessionSerial);
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
    final sessionSerial = _sessionSerial;
    try {
      final session = await _currentSession();
      if (!_isCurrentSession(sessionSerial)) return;
      if (session == null) {
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _syncRemote(session, sessionSerial);
    } catch (error) {
      if (_isCurrentSession(sessionSerial)) _handleFailure(error);
    }
  }

  Future<void> markRead(String itemId) async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    final sessionSerial = _sessionSerial;
    try {
      final session = await _currentSession();
      if (!_isCurrentSession(sessionSerial)) return;
      if (session == null || !state.isRemote) {
        await _localRepository.markRead(itemId);
        if (!_isCurrentSession(sessionSerial)) return;
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      final updated = await _remoteRepository.markInboxItemRead(
        session: session,
        notificationId: itemId,
      );
      if (!_isCurrentSession(sessionSerial)) return;
      if (updated == null) {
        await _syncRemote(session, sessionSerial);
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
      if (_isCurrentSession(sessionSerial)) _handleFailure(error);
    }
  }

  Future<void> markAllRead() async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    final sessionSerial = _sessionSerial;
    try {
      final session = await _currentSession();
      if (!_isCurrentSession(sessionSerial)) return;
      if (session == null || !state.isRemote) {
        await _localRepository.markAllRead();
        if (!_isCurrentSession(sessionSerial)) return;
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _remoteRepository.markAllInboxRead(session: session);
      if (!_isCurrentSession(sessionSerial)) return;
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
      if (_isCurrentSession(sessionSerial)) _handleFailure(error);
    }
  }

  Future<void> clear() async {
    if (state.isSyncing) {
      return;
    }
    state = state.copyWith(isSyncing: true, clearError: true);
    final sessionSerial = _sessionSerial;
    try {
      final session = await _currentSession();
      if (!_isCurrentSession(sessionSerial)) return;
      if (session == null) {
        await _localRepository.clear();
        if (!_isCurrentSession(sessionSerial)) return;
        state = NotificationInboxState.local(_localRepository.listItems());
        return;
      }
      await _remoteRepository.archiveAllInbox(session: session);
      if (!_isCurrentSession(sessionSerial)) return;
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
      if (_isCurrentSession(sessionSerial)) _handleFailure(error);
    }
  }

  Future<MemberSession?> _currentSession() =>
      ref.read(memberSessionProvider.future);

  Future<void> _syncRemote(MemberSession session, int sessionSerial) async {
    if (!_isCurrentSession(sessionSerial)) return;
    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final result = await _remoteRepository.listInbox(session: session);
      if (!_isCurrentSession(sessionSerial)) return;
      state = NotificationInboxState(
        items: result.items,
        unreadCount: result.unreadCount,
        isSyncing: false,
        isRemote: true,
      );
    } catch (error) {
      if (!_isCurrentSession(sessionSerial)) return;
      if (state.isRemote) {
        _preserveRemoteFailure(error);
      } else {
        state = NotificationInboxState.local(_localRepository.listItems())
            .copyWith(lastError: error);
      }
    }
  }

  bool _isCurrentSession(int sessionSerial) {
    return sessionSerial == _sessionSerial;
  }

  void _preserveRemoteFailure(Object error) {
    state = state.copyWith(isSyncing: false, isRemote: true, lastError: error);
  }

  void _handleFailure(Object error) {
    if (state.isRemote) {
      _preserveRemoteFailure(error);
      return;
    }
    state = NotificationInboxState.local(_localRepository.listItems())
        .copyWith(lastError: error);
  }
}
