import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../../core/identity/external_user_identity_repository.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/newcomer_submission.dart';
import 'dto/newcomer_submission_dto.dart';

final newcomerRepositoryProvider = Provider<NewcomerRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockNewcomerRepository();
  }
  return ApiNewcomerRepository(apiClient: ref.watch(apiClientProvider));
});

final newcomerIdentityProvider = FutureProvider<NewcomerIdentity>((ref) async {
  final externalUserId = await ref.watch(externalUserIdProvider.future);
  final session = await ref.watch(memberSessionProvider.future);
  return NewcomerIdentity(externalUserId: externalUserId, session: session);
});

class NewcomerIdentity {
  const NewcomerIdentity({required this.externalUserId, required this.session});

  final String externalUserId;
  final MemberSession? session;
}

abstract class NewcomerRepository {
  Future<NewcomerSubmission> submitNewcomer({
    required NewcomerIdentity identity,
    required String displayName,
    required String preferredLanguage,
    String? email,
    String? phone,
    String? interest,
  });
}

class ApiNewcomerRepository implements NewcomerRepository {
  const ApiNewcomerRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<NewcomerSubmission> submitNewcomer({
    required NewcomerIdentity identity,
    required String displayName,
    required String preferredLanguage,
    String? email,
    String? phone,
    String? interest,
  }) async {
    final payload = {
      'externalUserId': identity.externalUserId,
      'displayName': displayName.trim(),
      'preferredLanguage': preferredLanguage.trim(),
      'source': 'app',
      if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
      if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      if (interest != null && interest.trim().isNotEmpty)
        'interest': interest.trim(),
    };
    final response = await apiClient.postJsonMapWithIdentity(
      '/newcomers',
      payload,
      accessToken: identity.session?.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readNewcomerSubmission(response);
  }
}

class MockNewcomerRepository implements NewcomerRepository {
  const MockNewcomerRepository();

  @override
  Future<NewcomerSubmission> submitNewcomer({
    required NewcomerIdentity identity,
    required String displayName,
    required String preferredLanguage,
    String? email,
    String? phone,
    String? interest,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final now = DateTime.now();
    return NewcomerSubmission(
      id: 'mock_newcomer_${now.microsecondsSinceEpoch}',
      displayName: displayName,
      status: 'new',
      createdAt: now,
    );
  }
}
