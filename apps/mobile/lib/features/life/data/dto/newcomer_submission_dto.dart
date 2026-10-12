import '../../domain/newcomer_submission.dart';

const _newcomerStatuses = {
  'new',
  'assigned',
  'contacted',
  'visited',
  'invited_to_group',
  'invited_to_course',
  'in_discipleship',
  'converted_to_member',
  'paused',
  'closed',
};

class NewcomerSubmissionDto {
  const NewcomerSubmissionDto({
    required this.id,
    required this.displayName,
    required this.status,
    required this.createdAt,
  });

  factory NewcomerSubmissionDto.fromJson(Map<String, Object?> json) {
    return NewcomerSubmissionDto(
      id: _requiredString(json, 'id'),
      displayName: _requiredString(json, 'displayName'),
      status: _requiredEnum(json, 'status', _newcomerStatuses),
      createdAt: _requiredDateTime(json, 'createdAt'),
    );
  }

  final String id;
  final String displayName;
  final String status;
  final DateTime createdAt;

  NewcomerSubmission toDomain() {
    return NewcomerSubmission(
      id: id,
      displayName: displayName,
      status: status,
      createdAt: createdAt,
    );
  }
}

NewcomerSubmission readNewcomerSubmission(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Expected newcomer submission data object.');
  }
  return NewcomerSubmissionDto.fromJson(data).toDomain();
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('Expected non-empty string at $key.');
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

DateTime _requiredDateTime(Map<String, Object?> json, String key) {
  final value = _requiredString(json, key);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('Expected ISO date-time at $key.');
  }
  return parsed;
}
