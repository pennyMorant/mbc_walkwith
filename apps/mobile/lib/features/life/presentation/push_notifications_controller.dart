import 'dart:async';
import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_error.dart';
import '../../../core/storage/shared_preferences_provider.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/push_notification_platform_service.dart';
import '../data/push_notification_repository.dart';
import '../data/system_notification_permission_service.dart';

final pushNotificationsControllerProvider =
    NotifierProvider<PushNotificationsController, PushNotificationsState>(
      PushNotificationsController.new,
    );

class PushNotificationsState {
  const PushNotificationsState({
    required this.supported,
    required this.permissionStatus,
    required this.isRegistered,
    required this.isLoading,
    this.lastError,
  });

  static const initial = PushNotificationsState(
    supported: true,
    permissionStatus: 'not_determined',
    isRegistered: false,
    isLoading: false,
  );

  final bool supported;
  final String permissionStatus;
  final bool isRegistered;
  final bool isLoading;
  final String? lastError;

  bool get permissionGranted =>
      permissionStatus == 'authorized' || permissionStatus == 'provisional';

  PushNotificationsState copyWith({
    bool? supported,
    String? permissionStatus,
    bool? isRegistered,
    bool? isLoading,
    String? lastError,
    bool clearError = false,
  }) {
    return PushNotificationsState(
      supported: supported ?? this.supported,
      permissionStatus: permissionStatus ?? this.permissionStatus,
      isRegistered: isRegistered ?? this.isRegistered,
      isLoading: isLoading ?? this.isLoading,
      lastError: clearError ? null : lastError ?? this.lastError,
    );
  }
}

class PushNotificationsController extends Notifier<PushNotificationsState> {
  static const _firstPermissionRequestKey =
      'push_notification_permission_requested_once';

  bool _started = false;
  bool _pushReady = false;
  PushNotificationPlatformService? _platformServiceInstance;

  MemberSessionRepository get _memberSessionRepository =>
      ref.read(memberSessionRepositoryProvider);

  PushNotificationRepository get _pushNotificationRepository =>
      ref.read(pushNotificationRepositoryProvider);

  PushNotificationPlatformService get _platformService {
    final existing = _platformServiceInstance;
    if (existing != null) {
      return existing;
    }
    final created = ref.read(pushNotificationPlatformServiceProvider);
    _platformServiceInstance = created;
    return created;
  }

  SystemNotificationPermissionService get _permissionService =>
      ref.read(systemNotificationPermissionServiceProvider);

  @override
  PushNotificationsState build() {
    ref.onDispose(() {
      final platformService = _platformServiceInstance;
      if (platformService != null) {
        unawaited(platformService.dispose());
      }
    });
    return PushNotificationsState.initial;
  }

  Future<void> start(GoRouter router) async {
    if (_started) {
      return;
    }
    _started = true;

    final permissionService = _permissionService;
    state = state.copyWith(supported: permissionService.isSupported);
    if (permissionService.isSupported) {
      try {
        final permissionStatus = await permissionService.currentStatus();
        state = state.copyWith(permissionStatus: permissionStatus);
        await _requestInitialPermissionIfNeeded();
      } catch (error) {
        state = state.copyWith(lastError: formatApiErrorMessage(error));
      }
    }

    try {
      final startResult = await _platformService.start(
        onRoute: router.go,
        onTokenRefresh: (token) =>
            _syncCurrentSession(pushTokenOverride: token),
      );
      _pushReady = startResult.supported && _platformService.isReady;
      if (!startResult.supported) {
        state = state.copyWith(
          lastError: startResult.setupError,
          isRegistered: false,
        );
        return;
      }
      await _syncCurrentSession();
    } catch (error) {
      state = state.copyWith(
        lastError: formatApiErrorMessage(error),
        isRegistered: false,
      );
    }
  }

  Future<void> requestPermissionAndSync() async {
    if (!_permissionService.isSupported) {
      return;
    }
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await ref
          .read(sharedPreferencesProvider)
          .setBool(_firstPermissionRequestKey, true);
      final permissionStatus = await _permissionService.requestStatus();
      state = state.copyWith(permissionStatus: permissionStatus);
      await _syncCurrentSession();
    } catch (error) {
      state = state.copyWith(lastError: formatApiErrorMessage(error));
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> openSystemNotificationSettingsAndRefresh() async {
    if (!_permissionService.isSupported) {
      return;
    }
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _permissionService.openSettings();
      await refreshPermissionAndSync();
    } catch (error) {
      state = state.copyWith(lastError: formatApiErrorMessage(error));
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> refreshPermissionAndSync() async {
    if (!_permissionService.isSupported) {
      return;
    }
    try {
      final permissionStatus = await _permissionService.currentStatus();
      state = state.copyWith(
        permissionStatus: permissionStatus,
        clearError: true,
      );
      await _syncCurrentSession();
    } catch (error) {
      state = state.copyWith(lastError: formatApiErrorMessage(error));
    }
  }

  Future<void> syncCurrentSession() async {
    await _syncCurrentSession();
  }

  Future<void> revokeCurrentDevice(MemberSession session) async {
    if (!_pushReady) {
      return;
    }
    try {
      await _pushNotificationRepository.revokeCurrentDevice(
        session: session,
        installationId: await _platformService.installationId(),
      );
      state = state.copyWith(isRegistered: false);
    } catch (_) {
      // Local logout should continue even if token revocation fails.
    }
  }

  Future<void> _requestInitialPermissionIfNeeded() async {
    if (!_permissionService.isSupported) {
      return;
    }
    final preferences = ref.read(sharedPreferencesProvider);
    if (preferences.getBool(_firstPermissionRequestKey) == true) {
      return;
    }
    await preferences.setBool(_firstPermissionRequestKey, true);

    final currentStatus = await _permissionService.currentStatus();
    state = state.copyWith(permissionStatus: currentStatus);
    if (_allowsNotifications(currentStatus)) {
      return;
    }

    final requestedStatus = await _permissionService.requestStatus();
    state = state.copyWith(permissionStatus: requestedStatus);
  }

  Future<void> _syncCurrentSession({String? pushTokenOverride}) async {
    if (!_pushReady) {
      return;
    }
    final permissionStatus = await _permissionService.currentStatus();
    state = state.copyWith(permissionStatus: permissionStatus);
    if (!_allowsNotifications(permissionStatus)) {
      state = state.copyWith(isRegistered: false);
      return;
    }

    final pushToken = await _platformService.resolvePushToken(
      pushTokenOverride,
    );
    if (pushToken == null || pushToken.isEmpty) {
      state = state.copyWith(isRegistered: false);
      return;
    }

    final payload = PushDeviceRegistrationPayload(
      installationId: await _platformService.installationId(),
      platform: _platformService.platformValue(),
      provider: 'fcm',
      pushToken: pushToken,
      permissionStatus: permissionStatus,
      locale: PlatformDispatcher.instance.locale.toLanguageTag(),
    );
    final session = await _restoreSessionOrNull();
    if (session == null) {
      await _pushNotificationRepository.upsertGuestDevice(payload: payload);
      state = state.copyWith(isRegistered: true, clearError: true);
      return;
    }

    await _pushNotificationRepository.upsertCurrentDevice(
      session: session,
      payload: payload,
    );
    state = state.copyWith(isRegistered: true, clearError: true);
  }

  bool _allowsNotifications(String permissionStatus) {
    return permissionStatus == 'authorized' ||
        permissionStatus == 'provisional';
  }

  Future<MemberSession?> _restoreSessionOrNull() async {
    try {
      return await _memberSessionRepository.restoreSession();
    } catch (_) {
      return null;
    }
  }
}
