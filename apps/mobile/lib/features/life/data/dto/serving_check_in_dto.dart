import '../../domain/serving_check_in.dart';
import 'serving_json_reader.dart';

const _checkInStatuses = {'pending', 'checked_in', 'missed'};

class ServingCheckInDto {
  const ServingCheckInDto({
    required this.id,
    required this.assignmentId,
    required this.status,
    required this.checkedInAt,
    required this.note,
  });

  factory ServingCheckInDto.fromJson(Map<String, Object?> json) {
    readServingString(json, 'userId', allowEmpty: false);
    readServingDateTime(json, 'createdAt');
    readServingDateTime(json, 'updatedAt');
    final status = readServingEnum(json, 'status', _checkInStatuses);
    final checkedInAt = readNullableServingDateTime(json, 'checkedInAt');
    if ((status == 'checked_in') != (checkedInAt != null)) {
      throw const FormatException(
        'checkedInAt must only be present for checked_in status.',
      );
    }
    return ServingCheckInDto(
      id: readServingString(json, 'id', allowEmpty: false),
      assignmentId: readServingString(json, 'assignmentId', allowEmpty: false),
      status: status,
      checkedInAt: checkedInAt,
      note: readServingString(json, 'note'),
    );
  }

  final String id;
  final String assignmentId;
  final String status;
  final DateTime? checkedInAt;
  final String note;

  ServingCheckIn toDomain() {
    return ServingCheckIn(
      id: id,
      assignmentId: assignmentId,
      status: status,
      checkedInAt: checkedInAt,
      note: note,
    );
  }
}
