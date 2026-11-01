import '../../domain/care_request.dart';

const _careRequestStatuses = {
  'submitted',
  'assigned',
  'in_progress',
  'resolved',
  'archived',
};
const _carePrivacyLevels = {
  'pastoral_only',
  'assigned_team',
  'admin_restricted',
};

class CareRequestDto {
  const CareRequestDto({
    required this.id,
    required this.userId,
    required this.memberDisplayName,
    required this.memberEmail,
    required this.title,
    required this.body,
    required this.status,
    required this.privacyLevel,
    required this.assigneeName,
    required this.nextFollowUpAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CareRequestDto.fromJson(Map<String, Object?> json) {
    final createdAt = _readDateTime(json, 'createdAt');
    final updatedAt = _readDateTime(json, 'updatedAt');
    if (updatedAt.isBefore(createdAt)) {
      throw const FormatException('updatedAt must not precede createdAt.');
    }
    return CareRequestDto(
      id: _readString(json, 'id', allowEmpty: false),
      userId: _readString(json, 'userId', allowEmpty: false),
      memberDisplayName: _readString(json, 'memberDisplayName'),
      memberEmail: _readString(json, 'memberEmail'),
      title: _readString(json, 'title', allowEmpty: false),
      body: _readString(json, 'body', allowEmpty: false),
      status: _readEnum(json, 'status', _careRequestStatuses),
      privacyLevel: _readEnum(json, 'privacyLevel', _carePrivacyLevels),
      assigneeName: _readString(json, 'assigneeName'),
      nextFollowUpAt: _readNullableDateTime(json, 'nextFollowUpAt'),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  final String id;
  final String userId;
  final String memberDisplayName;
  final String memberEmail;
  final String title;
  final String body;
  final String status;
  final String privacyLevel;
  final String assigneeName;
  final DateTime? nextFollowUpAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  CareRequest toDomain() {
    return CareRequest(
      id: id,
      userId: userId,
      memberDisplayName: memberDisplayName,
      memberEmail: memberEmail,
      title: title,
      body: body,
      status: status,
      privacyLevel: privacyLevel,
      assigneeName: assigneeName,
      nextFollowUpAt: nextFollowUpAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

CareRequest readCareRequest(Map<String, Object?> response) {
  return CareRequestDto.fromJson(_readData(response)).toDomain();
}

List<CareRequest> readCareRequestItems(Map<String, Object?> response) {
  final items = _readData(response)['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException('Care response items must be an object list.');
  }
  return items
      .cast<Map<String, Object?>>()
      .map(CareRequestDto.fromJson)
      .map((dto) => dto.toDomain())
      .toList(growable: false);
}

Map<String, Object?> _readData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Care response data must be an object.');
  }
  return data;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = true,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('$key must be a valid string.');
  }
  return value;
}

String _readEnum(Map<String, Object?> json, String key, Set<String> values) {
  final value = _readString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

DateTime _readDateTime(Map<String, Object?> json, String key) {
  final value = _readString(json, key, allowEmpty: false);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return parsed;
}

DateTime? _readNullableDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! String || value.isEmpty) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return parsed;
}
