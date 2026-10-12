import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_availability.dart';
import '../domain/serving_check_in.dart';
import 'api_serving_repository.dart';
import 'mock_serving_repository.dart';
import 'serving_repository_contract.dart';

export 'serving_repository_contract.dart';
export 'api_serving_repository.dart';
export 'mock_serving_repository.dart';

final servingRepositoryProvider = Provider<ServingRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockServingRepository();
  }
  return ApiServingRepository(apiClient: ref.watch(apiClientProvider));
});

final servingAssignmentsProvider = FutureProvider<List<ServingAssignment>>((
  ref,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  if (session == null) {
    return const [];
  }
  return ref.watch(servingRepositoryProvider).getAssignments(session);
});

final servingAssignmentByIdProvider =
    FutureProvider.family<ServingAssignment, String>((ref, assignmentId) async {
      final assignments = await ref.watch(servingAssignmentsProvider.future);
      return assignments.firstWhere(
        (assignment) => assignment.id == assignmentId,
        orElse: () => throw StateError('Serving assignment not found.'),
      );
    });

final servingAvailabilityProvider = FutureProvider<List<ServingAvailability>>((
  ref,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  if (session == null) {
    return const [];
  }
  return ref.watch(servingRepositoryProvider).getAvailability(session);
});

final servingCheckInsProvider = FutureProvider<List<ServingCheckIn>>((
  ref,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  if (session == null) {
    return const [];
  }
  return ref.watch(servingRepositoryProvider).getCheckIns(session);
});
