import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../../core/identity/external_user_identity_repository.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/reading_plan.dart';
import 'dto/reading_plan_assignment_dto.dart';
import 'dto/reading_plan_dto.dart';
import 'dto/reading_plan_envelope.dart';
import 'dto/reading_plan_json_reader.dart';
import 'mock_reading_plan_repository.dart';
import 'reading_plan_repository_contract.dart';

export 'reading_plan_repository_contract.dart';

final readingPlanRepositoryProvider = Provider<ReadingPlanRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockReadingPlanRepository();
  }
  return ApiReadingPlanRepository(apiClient: ref.watch(apiClientProvider));
});

final publishedReadingPlansProvider = FutureProvider<List<ReadingPlan>>((
  ref,
) async {
  final identity = await readReadingPlanIdentity(ref);
  return ref.watch(readingPlanRepositoryProvider).listPublishedPlans(identity);
});

final myReadingPlanAssignmentsProvider =
    FutureProvider<List<ReadingPlanAssignment>>((ref) async {
      final identity = await readReadingPlanIdentity(ref);
      final page = await ref
          .watch(readingPlanRepositoryProvider)
          .listMyAssignments(identity);
      return page.items;
    });

final activeReadingPlanAssignmentsProvider =
    FutureProvider<List<ReadingPlanAssignment>>((ref) async {
      final identity = await readReadingPlanIdentity(ref);
      final page = await ref
          .watch(readingPlanRepositoryProvider)
          .listMyAssignments(identity, scope: 'active', limit: 100);
      return page.items;
    });

final readingPlanHistoryProvider = FutureProvider<ReadingPlanAssignmentPage>((
  ref,
) async {
  final identity = await readReadingPlanIdentity(ref);
  return ref
      .watch(readingPlanRepositoryProvider)
      .listMyAssignments(identity, scope: 'history', limit: 20);
});

final readingPlanAssignmentDetailProvider =
    FutureProvider.family<ReadingPlanAssignmentDetail, String>((
      ref,
      assignmentId,
    ) async {
      final identity = await readReadingPlanIdentity(ref);
      return ref
          .watch(readingPlanRepositoryProvider)
          .getAssignmentDetail(assignmentId, identity);
    });

final readingPlanDaysProvider =
    FutureProvider.family<List<ReadingPlanDay>, String>((ref, planId) async {
      final identity = await readReadingPlanIdentity(ref);
      return ref
          .watch(readingPlanRepositoryProvider)
          .listPlanDays(planId, identity);
    });

class ApiReadingPlanRepository implements ReadingPlanRepository {
  const ApiReadingPlanRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<ReadingPlan>> listPublishedPlans(
    ReadingPlanIdentity identity,
  ) async {
    final response = await apiClient.getJsonMapWithIdentity(
      _pathWithQuery('/reading-plans', {'limit': '20', 'status': 'published'}),
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readingPlanEnvelopeItems(response)
        .map(ReadingPlanDto.fromJson)
        .map((dto) {
          return dto.toDomain();
        })
        .toList();
  }

  @override
  Future<List<ReadingPlanDay>> listPlanDays(
    String planId,
    ReadingPlanIdentity identity,
  ) async {
    final response = await apiClient.getJsonMapWithIdentity(
      '/reading-plans/$planId/days',
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readingPlanEnvelopeItems(response)
        .map(ReadingPlanDayDto.fromJson)
        .map((dto) {
          return dto.toDomain();
        })
        .toList();
  }

  @override
  Future<ReadingPlanAssignment> selfAssign(
    String planId,
    ReadingPlanIdentity identity,
  ) async {
    final response = await apiClient.postJsonMapWithIdentity(
      '/reading-plans/$planId/assignments',
      const {},
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return ReadingPlanAssignmentDto.fromJson(readingPlanEnvelopeData(response))
        .toDomain();
  }

  @override
  Future<ReadingPlanAssignmentPage> listMyAssignments(
    ReadingPlanIdentity identity, {
    String scope = 'all',
    int limit = 20,
    String? cursor,
  }) async {
    final response = await apiClient.getJsonMapWithIdentity(
      _pathWithQuery('/me/reading-plans', {
        'scope': scope,
        'limit': '$limit',
        'cursor': cursor,
      }),
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    final page = readingPlanEnvelopeData(response);
    return ReadingPlanAssignmentPage(
      items: readingPlanObjectList(page, 'items')
          .map(ReadingPlanAssignmentDto.fromJson)
          .map((dto) => dto.toDomain())
          .toList(),
      nextCursor: readingPlanNullableString(page, 'nextCursor'),
    );
  }

  @override
  Future<ReadingPlanAssignmentDetail> getAssignmentDetail(
    String assignmentId,
    ReadingPlanIdentity identity,
  ) async {
    final response = await apiClient.getJsonMapWithIdentity(
      '/me/reading-plans/$assignmentId',
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    final detail = readingPlanEnvelopeData(response);
    return ReadingPlanAssignmentDetail(
      assignment: ReadingPlanAssignmentDto.fromJson(
        readingPlanObject(detail, 'assignment'),
      ).toDomain(),
      days: readingPlanObjectList(
        detail,
        'days',
      ).map(ReadingPlanDayDto.fromJson).map((dto) => dto.toDomain()).toList(),
      canRestart: readingPlanBool(detail, 'canRestart'),
    );
  }

  @override
  Future<ReadingPlanAssignment> updateAssignmentStatus({
    required String assignmentId,
    required String status,
    required ReadingPlanIdentity identity,
  }) async {
    final response = await apiClient.patchJsonMapWithIdentity(
      '/reading-plans/assignments/$assignmentId/status',
      {'status': status},
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return ReadingPlanAssignmentDto.fromJson(readingPlanEnvelopeData(response))
        .toDomain();
  }

  @override
  Future<ReadingPlanDayProgress> updateDayProgress({
    required String assignmentId,
    required String dayId,
    required String status,
    required ReadingPlanIdentity identity,
    String note = '',
  }) async {
    final response = await apiClient.patchJsonMapWithIdentity(
      '/reading-plans/assignments/$assignmentId/days/$dayId',
      {'status': status, 'note': note},
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return ReadingPlanDayProgressDto.fromJson(readingPlanEnvelopeData(response))
        .toDomain();
  }
}

Future<ReadingPlanIdentity> readReadingPlanIdentity(Ref ref) async {
  final session = await ref.watch(memberSessionProvider.future);
  final externalUserId = await ref.watch(externalUserIdProvider.future);
  return ReadingPlanIdentity(session: session, externalUserId: externalUserId);
}

Future<ReadingPlanIdentity> readReadingPlanIdentityForAction(
  WidgetRef ref,
) async {
  final session = await ref.read(memberSessionProvider.future);
  final externalUserId = await ref.read(externalUserIdProvider.future);
  return ReadingPlanIdentity(session: session, externalUserId: externalUserId);
}

void invalidateReadingPlanAssignmentProviders(WidgetRef ref) {
  ref.invalidate(myReadingPlanAssignmentsProvider);
  ref.invalidate(activeReadingPlanAssignmentsProvider);
  ref.invalidate(readingPlanHistoryProvider);
}

ReadingPlanAssignment? assignmentForPlan(
  List<ReadingPlanAssignment> assignments,
  String planId,
) {
  for (final assignment in assignments) {
    if (assignment.planId == planId) {
      return assignment;
    }
  }
  return null;
}

String _pathWithQuery(String path, Map<String, String?> query) {
  final cleanQuery = Map.fromEntries(
    query.entries.where((entry) => entry.value != null),
  );
  if (cleanQuery.isEmpty) {
    return path;
  }
  return '$path?${Uri(queryParameters: cleanQuery).query}';
}
