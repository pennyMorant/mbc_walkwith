import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/discipleship_assignment.dart';
import 'dto/discipleship_assignment_dto.dart';

final discipleshipRepositoryProvider = Provider<DiscipleshipRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockDiscipleshipRepository();
  }
  return ApiDiscipleshipRepository(apiClient: ref.watch(apiClientProvider));
});

final myDiscipleshipAssignmentsProvider =
    FutureProvider<List<DiscipleshipAssignment>>((ref) async {
      final session = await ref.watch(memberSessionProvider.future);
      if (session == null) {
        return const [];
      }
      return ref
          .watch(discipleshipRepositoryProvider)
          .listMyAssignments(session);
    });

abstract class DiscipleshipRepository {
  Future<List<DiscipleshipAssignment>> listMyAssignments(MemberSession session);
}

class ApiDiscipleshipRepository implements DiscipleshipRepository {
  const ApiDiscipleshipRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<DiscipleshipAssignment>> listMyAssignments(
    MemberSession session,
  ) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/discipleship',
      session.accessToken,
    );
    return readDiscipleshipAssignments(response);
  }
}

class MockDiscipleshipRepository implements DiscipleshipRepository {
  const MockDiscipleshipRepository();

  @override
  Future<List<DiscipleshipAssignment>> listMyAssignments(
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final now = DateTime.now();
    return [
      DiscipleshipAssignment(
        id: 'mock_discipleship_assignment',
        journeyId: 'mock_foundations',
        assigneeName: 'Pastoral Team',
        status: 'in_progress',
        startedAt: now.subtract(const Duration(days: 7)),
        completedAt: null,
        taskTotalCount: 2,
        completedTaskCount: 1,
        progress: [
          DiscipleshipTaskProgress(
            id: 'mock_discipleship_progress_1',
            assignmentId: 'mock_discipleship_assignment',
            taskId: 'read_romans_8',
            status: 'completed',
            completedAt: now.subtract(const Duration(days: 2)),
            updatedAt: now.subtract(const Duration(days: 2)),
          ),
          DiscipleshipTaskProgress(
            id: 'mock_discipleship_progress_2',
            assignmentId: 'mock_discipleship_assignment',
            taskId: 'join_group_intro',
            status: 'available',
            completedAt: null,
            updatedAt: now,
          ),
        ],
        createdAt: now.subtract(const Duration(days: 7)),
        updatedAt: now,
      ),
    ];
  }
}
