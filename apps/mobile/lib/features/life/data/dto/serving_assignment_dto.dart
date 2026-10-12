import '../../domain/serving_assignment.dart';
import 'serving_json_reader.dart';

const _assignmentStatuses = {
  'scheduled',
  'confirmed',
  'declined',
  'swap_requested',
  'covered',
  'cancelled',
};

class ServingAssignmentDto {
  const ServingAssignmentDto({
    required this.id,
    required this.teamName,
    required this.roleName,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.status,
    required this.note,
    required this.responseNote,
  });

  factory ServingAssignmentDto.fromJson(Map<String, Object?> json) {
    readServingString(json, 'teamId', allowEmpty: false);
    readServingString(json, 'roleId', allowEmpty: false);
    readServingString(json, 'userId', allowEmpty: false);
    readServingString(json, 'memberDisplayName', allowEmpty: false);
    readServingString(json, 'memberEmail', allowEmpty: false);
    readServingDateTime(json, 'createdAt');
    readServingDateTime(json, 'updatedAt');
    final startsAt = readServingDateTime(json, 'startsAt');
    final endsAt = readNullableServingDateTime(json, 'endsAt');
    if (endsAt != null && !endsAt.isAfter(startsAt)) {
      throw const FormatException('endsAt must be later than startsAt.');
    }
    return ServingAssignmentDto(
      id: readServingString(json, 'id', allowEmpty: false),
      teamName: readServingString(json, 'teamName', allowEmpty: false),
      roleName: readServingString(json, 'roleName', allowEmpty: false),
      title: readServingString(json, 'title', allowEmpty: false),
      startsAt: startsAt,
      endsAt: endsAt,
      location: readServingString(json, 'location'),
      status: readServingEnum(json, 'status', _assignmentStatuses),
      note: readServingString(json, 'note'),
      responseNote: readServingString(json, 'responseNote'),
    );
  }

  final String id;
  final String teamName;
  final String roleName;
  final String title;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String location;
  final String status;
  final String note;
  final String responseNote;

  ServingAssignment toDomain() {
    return ServingAssignment(
      id: id,
      teamName: teamName,
      roleName: roleName,
      title: title,
      startsAt: startsAt,
      endsAt: endsAt,
      location: location,
      status: status,
      note: note,
      responseNote: responseNote,
    );
  }
}
