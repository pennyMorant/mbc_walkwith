import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_error.dart';
import '../../../core/config/app_config.dart';
import '../../../core/storage/session_store.dart';
import 'member_session_models.dart';

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

  Future<MemberSession> login({
    required String email,
    required String password,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/login', {
      'email': email,
      'password': password,
    });
    final session = _sessionFromEnvelope(response);
    await _saveSession(session);
    return session;
  }

  Future<MemberRegistrationResult> signInWithFirebase({
    required String idToken,
  }) async {
    final response = await apiClient.postJsonMap('/member/auth/firebase', {
      'idToken': idToken,
    });
    final data = response['data'] as Map<String, Object?>? ?? const {};
    switch (_requiredString(data, 'status')) {
      case 'signed_in':
        final session = _sessionFromData(_requiredMap(data, 'session'));
        await _saveSession(session);
        return MemberRegistrationResult.signedIn(session);
      case 'pending_approval':
        return MemberRegistrationResult.pendingApproval(
          MemberProfile.fromJson(_requiredMap(data, 'member')),
        );
      default:
        throw const FormatException(
          'Unknown member Firebase authentication status.',
        );
    }
  }

  Future<MemberCodeRequestResult> requestPasswordReset({
    required String email,
  }) async {
    final response = await apiClient.postJsonMap(
      '/member/auth/password-reset/request',
      {'email': email},
    );
    final data = response['data'] as Map<String, Object?>? ?? const {};
    return MemberCodeRequestResult(
      challengeId: _requiredString(data, 'challengeId'),
      expiresInSeconds: _requiredInt(data, 'expiresInSeconds'),
      maskedEmail: data['maskedEmail'] as String?,
      resendAfterSeconds: _requiredInt(data, 'resendAfterSeconds'),
      devCode: data['devCode'] as String?,
    );
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
    final data = response['data'] as Map<String, Object?>? ?? const {};
    final status = _requiredString(data, 'status');
    switch (status) {
      case 'signed_in':
        final session = _sessionFromData(_requiredMap(data, 'session'));
        await _saveSession(session);
        return MemberRegistrationResult.signedIn(session);
      case 'pending_approval':
        return MemberRegistrationResult.pendingApproval(
          MemberProfile.fromJson(_requiredMap(data, 'member')),
        );
      case 'pending_email_verification':
        final codeRequest = _requiredMap(data, 'codeRequest');
        final challengeId = _requiredString(codeRequest, 'challengeId');
        return MemberRegistrationResult.pendingEmailVerification(
          MemberCodeRequestResult(
            challengeId: challengeId,
            expiresInSeconds: _requiredInt(codeRequest, 'expiresInSeconds'),
            maskedEmail: codeRequest['maskedEmail'] as String?,
            resendAfterSeconds: _requiredInt(codeRequest, 'resendAfterSeconds'),
            devCode: codeRequest['devCode'] as String?,
          ),
        );
      default:
        throw FormatException('Unknown member registration status: $status');
    }
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
    final data = response['data'] as Map<String, Object?>? ?? const {};
    if (data['status'] == 'pending_approval') {
      return MemberRegistrationResult.pendingApproval(
        MemberProfile.fromJson(_requiredMap(data, 'member')),
      );
    }
    final session = _sessionFromEnvelope(response);
    await _saveSession(session);
    return MemberRegistrationResult.signedIn(session);
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

  MemberSession _sessionFromEnvelope(Map<String, Object?> response) {
    final data = response['data'] as Map<String, Object?>? ?? const {};
    return _sessionFromData(data);
  }

  MemberSession _sessionFromData(Map<String, Object?> data) {
    return MemberSession(
      accessToken: _requiredString(data, 'accessToken'),
      member: MemberProfile.fromJson(_requiredMap(data, 'member')),
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

Map<String, Object?> _requiredMap(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is Map<String, Object?>) {
    return value;
  }
  throw FormatException('Missing member response object: $key');
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing member response text: $key');
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is int && value >= 0) {
    return value;
  }
  throw FormatException('Missing member response number: $key');
}
