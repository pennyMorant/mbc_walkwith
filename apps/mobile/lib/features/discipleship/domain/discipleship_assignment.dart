class DiscipleshipAssignment {
  const DiscipleshipAssignment({
    required this.id,
    required this.journeyId,
    required this.assigneeName,
    required this.status,
    required this.startedAt,
    required this.completedAt,
    required this.taskTotalCount,
    required this.completedTaskCount,
    required this.progress,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String journeyId;
  final String assigneeName;
  final String status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int taskTotalCount;
  final int completedTaskCount;
  final List<DiscipleshipTaskProgress> progress;
  final DateTime createdAt;
  final DateTime updatedAt;
}

class DiscipleshipTaskProgress {
  const DiscipleshipTaskProgress({
    required this.id,
    required this.assignmentId,
    required this.taskId,
    required this.status,
    required this.completedAt,
    required this.updatedAt,
  });

  final String id;
  final String assignmentId;
  final String taskId;
  final String status;
  final DateTime? completedAt;
  final DateTime updatedAt;
}
