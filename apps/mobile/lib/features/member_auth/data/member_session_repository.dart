import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_error.dart';
import '../../../core/config/app_config.dart';
import '../../../core/storage/session_store.dart';
import 'member_session_models.dart';
import 'member_session_response_parser.dart';

export 'member_session_models.dart';

final memberSessionRepositoryProvider = Provider<MemberSessionRepository>((
  ref,
) {
  return MemberSessionRepository(
    apiClient: ref.watch(apiClientProvider),
    sessionStore: ref.watch(sessionStoreProvider),
  );
});

final memberSessionProvider = FutureProvider<MemberSession?>((ref) {
  return ref.watch(memberSessionRepositoryProvider).restoreSession();
});

class MemberSessionRepository {
  const MemberSessionRepository({
    required this.apiClient,
    required this.sessionStore,
  });

  final ApiClient apiClient;
  final SessionStore sessionStore;
  static const _responseParser = MemberSessionResponseParser();

  Future<MemberSession> login({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/login', {
      'email': email,
      'password': password,
    });
    final session = _responseParser.sessionFromEnvelope(response);
    await _saveSession(session);
    return session;
  }

  Future<MemberRegistrationResult> signInWithFirebase({
    required String idToken,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/firebase', {
      'idToken': idToken,
    });
    final result = _responseParser.firebaseSignInFromEnvelope(response);
    if (result.session case final session?) {
      await _saveSession(session);
    }
    return result;
  }

  Future<MemberCodeRequestResult> requestPasswordReset({
    required String email,
  }) async {
    final response = await apiClient.postJsonMap(
      '/member/auth/password-reset/request',
      {'email': email},
    );
    return _responseParser.codeRequestFromEnvelope(response);
  }

  Future<void> confirmPasswordReset({
    required String challengeId,
    required String code,
    required String password,
  }) async {
    await apiClient.postJsonMap('/member/auth/password-reset/confirm', {
      'challengeId': challengeId,
      'code': code,
      'password': password,
    });
  }

  Future<MemberRegistrationResult> register({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/register', {
      'email': email,
      'password': password,
    });
    final result = _responseParser.registrationFromEnvelope(response);
    if (result.session case final session?) {
      await _saveSession(session);
    }
    return result;
  }

  Future<MemberRegistrationResult> verifyCode({
    required String challengeId,
    required String code,
    String? displayName,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/verify-code', {
      'challengeId': challengeId,
      'code': code,
      if (displayName != null && displayName.trim().isNotEmpty)
        'displayName': displayName.trim(),
    });
    final result = _responseParser.verificationFromEnvelope(response);
    if (result.session case final session?) {
      await _saveSession(session);
    }
    return result;
  }

  Future<MemberSession?> restoreSession() async {
    final debugSession = _debugMemberSession(apiClient.config);
    if (debugSession != null) {
      return debugSession;
    }

    final accessToken = await sessionStore.readAccessToken();
    final rawProfile = await sessionStore.readMemberProfileJson();
    if (accessToken == null) {
      if (rawProfile != null) {
        await sessionStore.clearMemberProfileJson();
      }
      return null;
    }

    MemberProfile? cachedProfile;
    if (rawProfile != null) {
      try {
        final decoded = jsonDecode(rawProfile);
        if (decoded is! Map<String, Object?>) {
          throw const FormatException('Member profile cache is not an object.');
        }
        cachedProfile = MemberProfile.fromJson(decoded);
      } catch (_) {
        await sessionStore.clearMemberProfileJson();
      }
    }
    try {
      final response = await apiClient.getJsonMapWithBearer(
        '/member/auth/me',
        accessToken,
      );
      final data = response['data'] as Map<String, Object?>? ?? const {};
      final freshProfile = MemberProfile.fromJson(
        data['member'] as Map<String, Object?>,
      );
      final session = MemberSession(
        accessToken: accessToken,
        member: freshProfile,
      );
      await _saveSession(session);
      return session;
    } on ApiError catch (error) {
      if (_isTerminalSessionError(error)) {
        await sessionStore.clearSession();
        return null;
      }
      return cachedProfile == null
          ? null
          : MemberSession(accessToken: accessToken, member: cachedProfile);
    }
  }

  Future<void> logout(MemberSession session) async {
    if (_isDebugMemberSession(session, apiClient.config)) {
      await sessionStore.clearSession();
      return;
    }

    try {
      await apiClient.postJsonMapWithBearer(
        '/member/auth/logout',
        const {},
        session.accessToken,
      );
    } catch (_) {
      // Local sign-out should still work if the session already expired.
    }
    await sessionStore.clearSession();
  }

  Future<void> clearLocalSession() {
    return sessionStore.clearSession();
  }

  Future<void> persistSession(MemberSession session) {
    return _saveSession(session);
  }

  Future<MemberSession> updateProfile(
    MemberSession session, {
    required String displayName,
    String? phone,
    String? address,
    int? faithStartYear,
    int? baptizedYear,
    String? joinedChurchAt,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) async {
    final response = await apiClient.patchJsonMapWithBearer('/member/profile', {
      'displayName': displayName.trim(),
      'phone': _nullableText(phone),
      'address': _nullableText(address),
      'faithStartYear': faithStartYear,
      'baptizedYear': baptizedYear,
      'joinedChurchAt': _nullableText(joinedChurchAt),
      'emergencyContactName': _nullableText(emergencyContactName),
      'emergencyContactPhone': _nullableText(emergencyContactPhone),
    }, session.accessToken);
    final data = response['data'] as Map<String, Object?>? ?? const {};
    final updated = MemberSession(
      accessToken: session.accessToken,
      member: MemberProfile.fromJson(data['member'] as Map<String, Object?>),
    );
    await _saveSession(updated);
    return updated;
  }

  Future<void> _saveSession(MemberSession session) async {
    await sessionStore.writeAccessToken(session.accessToken);
    await sessionStore.writeMemberProfileJson(
      jsonEncode(session.member.toJson()),
    );
  }
}

MemberSession? _debugMemberSession(AppConfig config) {
  if (!config.debugMemberAuthBypass) {
    return null;
  }
  return MemberSession(
    accessToken: config.debugMemberAccessToken,
    member: const MemberProfile(
      id: 'debug-member',
      email: 'debug.member@mbc.local',
      displayName: 'Debug Member',
      phone: null,
      address: null,
      faithStartYear: null,
      baptizedYear: null,
      joinedChurchAt: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      status: 'active',
      roles: ['member'],
      appLocale: 'en',
      fellowshipGroupId: 'friday-fellowship',
      notificationSettings: MemberNotificationSettings.defaults,
    ),
  );
}

bool _isDebugMemberSession(MemberSession session, AppConfig config) {
  return config.debugMemberAuthBypass &&
      session.accessToken == config.debugMemberAccessToken &&
      session.member.id == 'debug-member';
}

String? _nullableText(String? value) {
  final clean = value?.trim();
  return clean == null || clean.isEmpty ? null : clean;
}

bool _isTerminalSessionError(ApiError error) {
  return error.isAuthenticationRequired ||
      error.isPermissionDenied ||
      error.hasCode(const {
        'member_session_invalid',
        'member_account_inactive',
        'member_auth_required',
      });
}
