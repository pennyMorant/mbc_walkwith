import '../domain/reading_plan.dart';
import 'reading_plan_repository_contract.dart';

class MockReadingPlanRepository implements ReadingPlanRepository {
  final Map<String, ReadingPlanAssignment> _assignments = {};
  final Map<String, List<ReadingPlanDayProgress>> _progress = {};

  @override
  Future<List<ReadingPlan>> listPublishedPlans(
    ReadingPlanIdentity identity,
  ) async {
    return _mockPlans;
  }

  @override
  Future<List<ReadingPlanDay>> listPlanDays(
    String planId,
    ReadingPlanIdentity identity,
  ) async {
    return _mockDays.where((day) => day.planId == planId).toList();
  }

  @override
  Future<ReadingPlanAssignment> selfAssign(
    String planId,
    ReadingPlanIdentity identity,
  ) async {
    final open = _assignments.values.where(
      (assignment) => assignment.planId == planId && assignment.isOpen,
    );
    if (open.isNotEmpty) {
      return open.first;
    }
    final plan = _mockPlans.firstWhere((item) => item.id == planId);
    final attemptNumber =
        _assignments.values.where((item) => item.planId == planId).length + 1;
    final assignment = ReadingPlanAssignment(
      id: 'mock-assignment-$planId-$attemptNumber',
      planId: planId,
      planTitle: plan.title,
      planDurationDays: plan.durationDays,
      attemptNumber: attemptNumber,
      userType: identity.session == null ? 'external' : 'member',
      userId: identity.session?.member.id ?? identity.externalUserId,
      sourceType: 'self',
      sourceId: null,
      status: 'active',
      startedAt: DateTime.now().toUtc(),
      completedAt: null,
      endedAt: null,
      progress: const [],
      createdAt: DateTime.now().toUtc(),
      updatedAt: DateTime.now().toUtc(),
    );
    _assignments[assignment.id] = assignment;
    return assignment;
  }

  @override
  Future<ReadingPlanAssignmentPage> listMyAssignments(
    ReadingPlanIdentity identity, {
    String scope = 'all',
    int limit = 20,
    String? cursor,
  }) async {
    final assignments = _assignments.values
        .toList()
        .map((assignment) {
          final progress = _progress[assignment.id] ?? const [];
          final completed =
              progress.where((item) => item.isCompleted).length >=
              _daysFor(assignment.planId).length;
          final updated = ReadingPlanAssignment(
            id: assignment.id,
            planId: assignment.planId,
            planTitle: assignment.planTitle,
            planDurationDays: assignment.planDurationDays,
            attemptNumber: assignment.attemptNumber,
            userType: assignment.userType,
            userId: assignment.userId,
            sourceType: assignment.sourceType,
            sourceId: assignment.sourceId,
            status: completed ? 'completed' : assignment.status,
            startedAt: assignment.startedAt,
            completedAt: completed ? DateTime.now().toUtc() : null,
            endedAt: completed ? DateTime.now().toUtc() : assignment.endedAt,
            progress: progress,
            createdAt: assignment.createdAt,
            updatedAt: DateTime.now().toUtc(),
          );
          _assignments[updated.id] = updated;
          return updated;
        })
        .where((assignment) {
          if (scope == 'active') return !assignment.isHistory;
          if (scope == 'history') return assignment.isHistory;
          return true;
        })
        .toList();
    final offset = int.tryParse(cursor ?? '') ?? 0;
    final pageItems = assignments.skip(offset).take(limit).toList();
    final nextOffset = offset + pageItems.length;
    return ReadingPlanAssignmentPage(
      items: pageItems,
      nextCursor: nextOffset < assignments.length ? '$nextOffset' : null,
    );
  }

  @override
  Future<ReadingPlanAssignmentDetail> getAssignmentDetail(
    String assignmentId,
    ReadingPlanIdentity identity,
  ) async {
    final assignment = _assignments[assignmentId]!;
    return ReadingPlanAssignmentDetail(
      assignment: assignment,
      days: _daysFor(assignment.planId),
      canRestart:
          _mockPlans.any(
            (plan) =>
                plan.id == assignment.planId && plan.status == 'published',
          ) &&
          !_assignments.values.any(
            (item) => item.planId == assignment.planId && item.isOpen,
          ),
    );
  }

  @override
  Future<ReadingPlanAssignment> updateAssignmentStatus({
    required String assignmentId,
    required String status,
    required ReadingPlanIdentity identity,
  }) async {
    final assignment = _assignments[assignmentId]!;
    final now = DateTime.now().toUtc();
    final updated = ReadingPlanAssignment(
      id: assignment.id,
      planId: assignment.planId,
      planTitle: assignment.planTitle,
      planDurationDays: assignment.planDurationDays,
      attemptNumber: assignment.attemptNumber,
      userType: assignment.userType,
      userId: assignment.userId,
      sourceType: assignment.sourceType,
      sourceId: assignment.sourceId,
      status: status,
      startedAt: status == 'active'
          ? assignment.startedAt ?? now
          : assignment.startedAt,
      completedAt: assignment.completedAt,
      endedAt: status == 'abandoned' ? now : null,
      progress: assignment.progress,
      createdAt: assignment.createdAt,
      updatedAt: now,
    );
    _assignments[assignmentId] = updated;
    return updated;
  }

  @override
  Future<ReadingPlanDayProgress> updateDayProgress({
    required String assignmentId,
    required String dayId,
    required String status,
    required ReadingPlanIdentity identity,
    String note = '',
  }) async {
    final current = _progress.putIfAbsent(assignmentId, () => []);
    current.removeWhere((entry) => entry.dayId == dayId);
    final progress = ReadingPlanDayProgress(
      id: 'mock-progress-$assignmentId-$dayId',
      assignmentId: assignmentId,
      dayId: dayId,
      status: status,
      note: note,
      completedAt: status == 'completed' ? DateTime.now().toUtc() : null,
      updatedAt: DateTime.now().toUtc(),
    );
    current.add(progress);
    return progress;
  }
}

List<ReadingPlanDay> _daysFor(String planId) {
  return _mockDays.where((day) => day.planId == planId).toList();
}

final _mockPlans = [
  ReadingPlan(
    id: 'mock_gospel_plan',
    title: 'Gospel of John in One Week',
    description: 'A steady seven-day reading plan through selected passages.',
    status: 'published',
    visibility: 'public',
    locale: 'en',
    durationDays: 7,
    createdAt: DateTime.utc(2026, 6, 1),
    updatedAt: DateTime.utc(2026, 6, 1),
  ),
];

final _mockDays = [
  ReadingPlanDay(
    id: 'mock_gospel_plan_day_1',
    planId: 'mock_gospel_plan',
    dayNumber: 1,
    title: 'The Word became flesh',
    description: 'Begin with the opening witness of John.',
    references: const [
      ScriptureReference(
        bookId: 'jhn',
        chapter: 1,
        startVerse: 1,
        endVerse: 18,
        referenceLabel: 'John 1:1-18',
      ),
    ],
    createdAt: DateTime.utc(2026, 6, 1),
    updatedAt: DateTime.utc(2026, 6, 1),
  ),
  ReadingPlanDay(
    id: 'mock_gospel_plan_day_2',
    planId: 'mock_gospel_plan',
    dayNumber: 2,
    title: 'New birth',
    description: 'Read Jesus teaching Nicodemus about new life.',
    references: const [
      ScriptureReference(
        bookId: 'jhn',
        chapter: 3,
        startVerse: 1,
        endVerse: 21,
        referenceLabel: 'John 3:1-21',
      ),
    ],
    createdAt: DateTime.utc(2026, 6, 1),
    updatedAt: DateTime.utc(2026, 6, 1),
  ),
];
