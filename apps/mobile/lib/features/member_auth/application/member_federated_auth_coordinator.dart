import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../life/presentation/push_notifications_controller.dart';
import '../data/member_federated_auth_service.dart';
import '../data/member_session_repository.dart';

final memberFederatedAuthCoordinatorProvider =
    Provider<MemberFederatedAuthCoordinator>(
      (ref) => MemberFederatedAuthCoordinator(ref),
    );

class MemberFederatedAuthCoordinator {
  const MemberFederatedAuthCoordinator(this._ref);

  final Ref _ref;

  Future<MemberRegistrationResult> signIn(
    MemberFederatedProvider provider,
  ) async {
    final idToken = await _ref
        .read(memberFederatedAuthServiceProvider)
        .obtainIdToken(provider);
    final result = await _ref
        .read(memberSessionRepositoryProvider)
        .signInWithFirebase(idToken: idToken);
    if (result.session != null) {
      _ref.invalidate(memberSessionProvider);
      try {
        await _ref
            .read(pushNotificationsControllerProvider.notifier)
            .syncCurrentSession();
      } catch (_) {
        // Authentication succeeds even when push registration is unavailable.
      }
    }
    return result;
  }
}
