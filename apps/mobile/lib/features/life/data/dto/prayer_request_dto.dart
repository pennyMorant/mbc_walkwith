import '../../domain/prayer_request.dart';

const _visibilities = {'private', 'public', 'group', 'members'};
const _statuses = {'pending', 'approved', 'hidden', 'archived'};

class PrayerRequestDto {
  const PrayerRequestDto({
    required this.id,
    required this.title,
    required this.body,
    required this.visibility,
    required this.groupId,
    required this.status,
    required this.submitterName,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PrayerRequestDto.fromJson(Map<String, Object?> json) {
    final visibility = _readEnum(json, 'visibility', _visibilities);
    final groupId = _readNullableString(json, 'groupId');
    if (visibility == 'group' && groupId == null) {
      throw const FormatException('group prayer requests require groupId.');
    }
    if (visibility != 'group' && groupId != null) {
      throw const FormatException(
        'non-group prayer requests must not have groupId.',
      );
    }
    final createdAt = _readDateTime(json, 'createdAt');
    final updatedAt = _readDateTime(json, 'updatedAt');
    if (updatedAt.isBefore(createdAt)) {
      throw const FormatException('updatedAt must not precede createdAt.');
    }
    return PrayerRequestDto(
      id: _readString(json, 'id', allowEmpty: false),
      title: _readString(json, 'title', allowEmpty: false),
      body: _readString(json, 'body', allowEmpty: false),
      visibility: visibility,
      groupId: groupId,
      status: _readEnum(json, 'status', _statuses),
      submitterName: _readString(json, 'submitterName'),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  final String id;
  final String title;
  final String body;
  final String visibility;
  final String? groupId;
  final String status;
  final String submitterName;
  final DateTime createdAt;
  final DateTime updatedAt;

  PrayerRequest toDomain() {
    return PrayerRequest(
      id: id,
      title: title,
      body: body,
      visibility: visibility,
      groupId: groupId,
      status: status,
      submitterName: submitterName,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

PrayerRequest readPrayerResponse(Map<String, Object?> response) {
  return PrayerRequestDto.fromJson(_readData(response)).toDomain();
}

List<PrayerRequest> readPrayerItems(Map<String, Object?> response) {
  final items = _readData(response)['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException(
      'Prayer response items must be an object list.',
    );
  }
  return items
      .cast<Map<String, Object?>>()
      .map(PrayerRequestDto.fromJson)
      .map((dto) => dto.toDomain())
      .toList(growable: false);
}

Map<String, Object?> _readData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Prayer response data must be an object.');
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

String? _readNullableString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) return null;
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('$key must be null or a non-empty string.');
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
