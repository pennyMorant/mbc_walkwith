import '../../member_auth/data/member_session_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_availability.dart';
import '../domain/serving_check_in.dart';
import 'serving_repository_contract.dart';

class MockServingRepository implements ServingRepository {
  String _status = 'scheduled';
  final List<ServingAvailability> _availability = [];
  final Map<String, ServingCheckIn> _checkIns = {};

  @override
  Future<List<ServingAssignment>> getAssignments(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return [_assignment()];
  }

  @override
  Future<List<ServingAvailability>> getAvailability(
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return List.unmodifiable(_availability);
  }

  @override
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return List.unmodifiable(_checkIns.values);
  }

  @override
  Future<ServingAssignment> confirm(
    String assignmentId,
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _status = 'confirmed';
    return _assignment();
  }

  @override
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _status = 'declined';
    return _assignment();
  }

  @override
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final record = ServingAvailability(
      id: 'mock-availability-${_availability.length + 1}',
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      status: draft.status,
      note: draft.note.trim(),
    );
    _availability.add(record);
    return record;
  }

  @override
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final record = ServingCheckIn(
      id: _checkIns[assignmentId]?.id ?? 'mock-check-in-$assignmentId',
      assignmentId: assignmentId,
      status: 'checked_in',
      checkedInAt: _checkIns[assignmentId]?.checkedInAt ?? DateTime.now(),
      note: note.trim(),
    );
    _checkIns[assignmentId] = record;
    return record;
  }

  ServingAssignment _assignment() {
    return ServingAssignment(
      id: 'usher-assignment',
      teamName: 'Hospitality',
      roleName: 'Usher',
      title: 'Sunday worship usher',
      startsAt: DateTime(2026, 6, 28, 9, 30),
      endsAt: DateTime(2026, 6, 28, 11, 30),
      location: 'Main Sanctuary',
      status: _status,
      note: '',
      responseNote: '',
    );
  }
}
