import '../../domain/group_material_assignment.dart';

class GroupMaterialAssignmentDto {
  const GroupMaterialAssignmentDto({
    required this.id,
    required this.groupId,
    required this.materialType,
    required this.materialId,
    required this.title,
    required this.status,
    required this.dueAt,
  });

  factory GroupMaterialAssignmentDto.fromJson(Map<String, Object?> json) {
    String value(String key) {
      final result = json[key];
      if (result is! String || result.trim().isEmpty) {
        throw FormatException('$key must be a non-empty string.');
      }
      return result;
    }

    final type = value('materialType');
    if (!const {
      'reading_plan',
      'sermon_discussion_guide',
      'course',
      'manual',
    }.contains(type)) {
      throw const FormatException('Unsupported group material type.');
    }
    final dueValue = json['dueAt'];
    final dueAt = dueValue == null ? null : DateTime.tryParse('$dueValue');
    if (dueValue != null && dueAt == null) {
      throw const FormatException('dueAt must be an ISO date-time or null.');
    }
    final status = value('status');
    if (!const {
      'assigned',
      'in_progress',
      'completed',
      'needs_follow_up',
    }.contains(status)) {
      throw const FormatException('Unsupported group material status.');
    }
    return GroupMaterialAssignmentDto(
      id: value('id'),
      groupId: value('groupId'),
      materialType: type,
      materialId: value('materialId'),
      title: value('title'),
      status: status,
      dueAt: dueAt,
    );
  }

  final String id;
  final String groupId;
  final String materialType;
  final String materialId;
  final String title;
  final String status;
  final DateTime? dueAt;

  GroupMaterialAssignment toDomain() => GroupMaterialAssignment(
    id: id,
    groupId: groupId,
    materialType: materialType,
    materialId: materialId,
    title: title,
    status: status,
    dueAt: dueAt,
  );
}
