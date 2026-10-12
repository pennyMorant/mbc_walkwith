import '../../member_auth/data/member_session_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_availability.dart';
import '../domain/serving_check_in.dart';

abstract class ServingRepository {
  Future<List<ServingAssignment>> getAssignments(MemberSession session);
  Future<List<ServingAvailability>> getAvailability(MemberSession session);
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session);
  Future<ServingAssignment> confirm(String assignmentId, MemberSession session);
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  );
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  );
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  });
}
