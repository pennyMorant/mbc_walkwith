import '../../member_auth/data/member_session_repository.dart';
import '../domain/reading_plan.dart';

abstract class ReadingPlanRepository {
  Future<List<ReadingPlan>> listPublishedPlans(ReadingPlanIdentity identity);
  Future<List<ReadingPlanDay>> listPlanDays(
    String planId,
    ReadingPlanIdentity identity,
  );
  Future<ReadingPlanAssignment> selfAssign(
    String planId,
    ReadingPlanIdentity identity,
  );
  Future<ReadingPlanAssignmentPage> listMyAssignments(
    ReadingPlanIdentity identity, {
    String scope = 'all',
    int limit = 20,
    String? cursor,
  });
  Future<ReadingPlanAssignmentDetail> getAssignmentDetail(
    String assignmentId,
    ReadingPlanIdentity identity,
  );
  Future<ReadingPlanAssignment> updateAssignmentStatus({
    required String assignmentId,
    required String status,
    required ReadingPlanIdentity identity,
  });
  Future<ReadingPlanDayProgress> updateDayProgress({
    required String assignmentId,
    required String dayId,
    required String status,
    required ReadingPlanIdentity identity,
    String note = '',
  });
}

class ReadingPlanIdentity {
  const ReadingPlanIdentity({required this.externalUserId, this.session});

  final String externalUserId;
  final MemberSession? session;

  String? get accessToken => session?.accessToken;
}
