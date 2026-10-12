import '../../domain/reading_plan.dart';
import 'reading_plan_json_reader.dart';

const _progressStatuses = {'available', 'completed', 'missed'};
const _userTypes = {'member', 'external'};
const _sourceTypes = {'self', 'admin', 'group', 'course', 'discipleship'};
const _assignmentStatuses = {
  'not_started',
  'active',
  'completed',
  'paused',
  'abandoned',
};

class ReadingPlanDayProgressDto {
  const ReadingPlanDayProgressDto({
    required this.id,
    required this.assignmentId,
    required this.dayId,
    required this.status,
    required this.note,
    required this.completedAt,
    required this.updatedAt,
  });

  factory ReadingPlanDayProgressDto.fromJson(Map<String, Object?> json) {
    return ReadingPlanDayProgressDto(
      id: readingPlanString(json, 'id'),
      assignmentId: readingPlanString(json, 'assignmentId'),
      dayId: readingPlanString(json, 'dayId'),
      status: readingPlanEnum(json, 'status', _progressStatuses),
      note: readingPlanString(json, 'note', allowEmpty: true),
      completedAt: readingPlanNullableDateTime(json, 'completedAt'),
      updatedAt: readingPlanDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String assignmentId;
  final String dayId;
  final String status;
  final String note;
  final DateTime? completedAt;
  final DateTime? updatedAt;

  ReadingPlanDayProgress toDomain() {
    return ReadingPlanDayProgress(
      id: id,
      assignmentId: assignmentId,
      dayId: dayId,
      status: status,
      note: note,
      completedAt: completedAt,
      updatedAt: updatedAt,
    );
  }
}

class ReadingPlanAssignmentDto {
  const ReadingPlanAssignmentDto({
    required this.id,
    required this.planId,
    required this.planTitle,
    required this.planDurationDays,
    required this.attemptNumber,
    required this.userType,
    required this.userId,
    required this.sourceType,
    required this.sourceId,
    required this.status,
    required this.startedAt,
    required this.completedAt,
    required this.endedAt,
    required this.progress,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReadingPlanAssignmentDto.fromJson(Map<String, Object?> json) {
    return ReadingPlanAssignmentDto(
      id: readingPlanString(json, 'id'),
      planId: readingPlanString(json, 'planId'),
      planTitle: readingPlanString(json, 'planTitle'),
      planDurationDays: readingPlanPositiveInt(json, 'planDurationDays'),
      attemptNumber: readingPlanPositiveInt(json, 'attemptNumber'),
      userType: readingPlanEnum(json, 'userType', _userTypes),
      userId: readingPlanString(json, 'userId'),
      sourceType: readingPlanEnum(json, 'sourceType', _sourceTypes),
      sourceId: readingPlanNullableString(json, 'sourceId'),
      status: readingPlanEnum(json, 'status', _assignmentStatuses),
      startedAt: readingPlanNullableDateTime(json, 'startedAt'),
      completedAt: readingPlanNullableDateTime(json, 'completedAt'),
      endedAt: readingPlanNullableDateTime(json, 'endedAt'),
      progress: readingPlanObjectList(
        json,
        'progress',
      ).map(ReadingPlanDayProgressDto.fromJson).toList(),
      createdAt: readingPlanDateTime(json, 'createdAt'),
      updatedAt: readingPlanDateTime(json, 'updatedAt'),
    );
  }

  final String id;
  final String planId;
  final String planTitle;
  final int planDurationDays;
  final int attemptNumber;
  final String userType;
  final String userId;
  final String sourceType;
  final String? sourceId;
  final String status;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? endedAt;
  final List<ReadingPlanDayProgressDto> progress;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ReadingPlanAssignment toDomain() {
    return ReadingPlanAssignment(
      id: id,
      planId: planId,
      planTitle: planTitle,
      planDurationDays: planDurationDays,
      attemptNumber: attemptNumber,
      userType: userType,
      userId: userId,
      sourceType: sourceType,
      sourceId: sourceId,
      status: status,
      startedAt: startedAt,
      completedAt: completedAt,
      endedAt: endedAt,
      progress: progress.map((entry) => entry.toDomain()).toList(),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
