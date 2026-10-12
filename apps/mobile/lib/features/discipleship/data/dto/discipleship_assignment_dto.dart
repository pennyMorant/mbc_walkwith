import '../../domain/discipleship_assignment.dart';

const _assignmentStatuses = {
  'not_started',
  'in_progress',
  'blocked',
  'completed',
  'paused',
  'cancelled',
};
const _taskStatuses = {
  'locked',
  'available',
  'in_progress',
  'completed',
  'skipped',
  'needs_review',
};

class DiscipleshipAssignmentDto {
  const DiscipleshipAssignmentDto({
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

  factory DiscipleshipAssignmentDto.fromJson(Map<String, Object?> json) {
    final id = _requiredString(json, 'id');
    final progress = _progressItems(json, id);
    final taskTotalCount = _nonNegativeInt(json, 'taskTotalCount');
    final completedTaskCount = _nonNegativeInt(json, 'completedTaskCount');
    if (completedTaskCount > taskTotalCount ||
        progress.where((item) => item.status == 'completed').length !=
            completedTaskCount) {
      throw const FormatException('Invalid discipleship progress summary.');
    }
    return DiscipleshipAssignmentDto(
      id: id,
      journeyId: _requiredString(json, 'journeyId'),
      assigneeName: _requiredString(json, 'assigneeName', allowEmpty: true),
      status: _requiredEnum(json, 'status', _assignmentStatuses),
      startedAt: _nullableDateTime(json, 'startedAt'),
      completedAt: _nullableDateTime(json, 'completedAt'),
      taskTotalCount: taskTotalCount,
      completedTaskCount: completedTaskCount,
      progress: progress,
      createdAt: _requiredDateTime(json, 'createdAt'),
      updatedAt: _requiredDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String journeyId;
  final String assigneeName;
  final String status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int taskTotalCount;
  final int completedTaskCount;
  final List<DiscipleshipTaskProgressDto> progress;
  final DateTime createdAt;
  final DateTime updatedAt;

  DiscipleshipAssignment toDomain() => DiscipleshipAssignment(
    id: id,
    journeyId: journeyId,
    assigneeName: assigneeName,
    status: status,
    startedAt: startedAt,
    completedAt: completedAt,
    taskTotalCount: taskTotalCount,
    completedTaskCount: completedTaskCount,
    progress: progress.map((item) => item.toDomain()).toList(growable: false),
    createdAt: createdAt,
    updatedAt: updatedAt,
  );
}

class DiscipleshipTaskProgressDto {
  const DiscipleshipTaskProgressDto({
    required this.id,
    required this.assignmentId,
    required this.taskId,
    required this.status,
    required this.completedAt,
    required this.updatedAt,
  });

  factory DiscipleshipTaskProgressDto.fromJson(Map<String, Object?> json) {
    return DiscipleshipTaskProgressDto(
      id: _requiredString(json, 'id'),
      assignmentId: _requiredString(json, 'assignmentId'),
      taskId: _requiredString(json, 'taskId'),
      status: _requiredEnum(json, 'status', _taskStatuses),
      completedAt: _nullableDateTime(json, 'completedAt'),
      updatedAt: _requiredDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String assignmentId;
  final String taskId;
  final String status;
  final DateTime? completedAt;
  final DateTime updatedAt;

  DiscipleshipTaskProgress toDomain() => DiscipleshipTaskProgress(
    id: id,
    assignmentId: assignmentId,
    taskId: taskId,
    status: status,
    completedAt: completedAt,
    updatedAt: updatedAt,
  );
}

List<DiscipleshipAssignment> readDiscipleshipAssignments(
  Map<String, Object?> envelope,
) {
  final data = envelope['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Expected discipleship data object.');
  }
  final items = data['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException('Expected discipleship assignment list.');
  }
  return items
      .cast<Map<String, Object?>>()
      .map(DiscipleshipAssignmentDto.fromJson)
      .map((item) => item.toDomain())
      .toList(growable: false);
}

List<DiscipleshipTaskProgressDto> _progressItems(
  Map<String, Object?> json,
  String assignmentId,
) {
  final value = json['progress'];
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException('Expected discipleship progress list.');
  }
  final items = value
      .cast<Map<String, Object?>>()
      .map(DiscipleshipTaskProgressDto.fromJson)
      .toList(growable: false);
  if (items.any((item) => item.assignmentId != assignmentId)) {
    throw const FormatException('Progress belongs to another assignment.');
  }
  return items;
}

String _requiredString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = false,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('Expected string at $key.');
  }
  return value;
}

String _requiredEnum(
  Map<String, Object?> json,
  String key,
  Set<String> allowed,
) {
  final value = _requiredString(json, key);
  if (!allowed.contains(value)) {
    throw FormatException('Unexpected value at $key.');
  }
  return value;
}

int _nonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('Expected non-negative integer at $key.');
  }
  return value;
}

DateTime _requiredDateTime(Map<String, Object?> json, String key) {
  final value = _requiredString(json, key);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) throw FormatException('Expected date-time at $key.');
  return parsed;
}

DateTime? _nullableDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! String) throw FormatException('Expected date-time at $key.');
  final parsed = DateTime.tryParse(value);
  if (parsed == null) throw FormatException('Expected date-time at $key.');
  return parsed;
}
