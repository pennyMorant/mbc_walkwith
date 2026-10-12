import '../../domain/ministry_group.dart';

const _groupStatuses = {'draft', 'active', 'paused', 'archived'};
const _groupVisibilities = {'public', 'members', 'group', 'private'};
const _applicationStatuses = {'submitted', 'approved', 'declined', 'withdrawn'};
const _membershipStatuses = {'active', 'inactive', 'leader'};

class MinistryGroupDto {
  const MinistryGroupDto({
    required this.id,
    required this.name,
    required this.description,
    required this.meetingTime,
    required this.location,
    required this.leaderName,
    required this.visibility,
    required this.status,
    required this.capacity,
    required this.memberCount,
    required this.myApplicationId,
    required this.myApplicationStatus,
    required this.myMembershipStatus,
  });

  final String id;
  final String name;
  final String description;
  final String meetingTime;
  final String location;
  final String leaderName;
  final String visibility;
  final String status;
  final int? capacity;
  final int memberCount;
  final String? myApplicationId;
  final String? myApplicationStatus;
  final String? myMembershipStatus;

  factory MinistryGroupDto.fromJson(Map<String, Object?> json) {
    _readDateTime(json, 'createdAt');
    _readDateTime(json, 'updatedAt');
    final capacity = _readNullablePositiveInt(json, 'capacity');
    final memberCount = _readNonNegativeInt(json, 'memberCount');
    final applicationId = _readNullableString(json, 'myApplicationId');
    final applicationStatus = _readNullableEnum(
      json,
      'myApplicationStatus',
      _applicationStatuses,
    );
    final membershipStatus = _readNullableEnum(
      json,
      'myMembershipStatus',
      _membershipStatuses,
    );
    if (capacity != null && memberCount > capacity) {
      throw const FormatException('memberCount must not exceed capacity.');
    }
    if ((applicationId == null) != (applicationStatus == null)) {
      throw const FormatException(
        'myApplicationId and myApplicationStatus must be present together.',
      );
    }
    return MinistryGroupDto(
      id: _readString(json, 'id', allowEmpty: false),
      name: _readString(json, 'name', allowEmpty: false),
      description: _readString(json, 'description'),
      meetingTime: _readString(json, 'meetingTime'),
      location: _readString(json, 'location'),
      leaderName: _readString(json, 'leaderName'),
      visibility: _readEnum(json, 'visibility', _groupVisibilities),
      status: _readEnum(json, 'status', _groupStatuses),
      capacity: capacity,
      memberCount: memberCount,
      myApplicationId: applicationId,
      myApplicationStatus: applicationStatus,
      myMembershipStatus: membershipStatus,
    );
  }

  MinistryGroup toDomain() {
    return MinistryGroup(
      id: id,
      name: name,
      description: description,
      meetingTime: meetingTime,
      location: location,
      leaderName: leaderName,
      visibility: visibility,
      status: status,
      capacity: capacity,
      memberCount: memberCount,
      myApplicationId: myApplicationId,
      myApplicationStatus: myApplicationStatus,
      myMembershipStatus: myMembershipStatus,
    );
  }
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
  if (value == null) {
    return null;
  }
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('$key must be a non-empty string or null.');
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

String? _readNullableEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = _readNullableString(json, key);
  if (value != null && !values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

int _readNonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('$key must be a non-negative integer.');
  }
  return value;
}

int? _readNullablePositiveInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int || value <= 0) {
    throw FormatException('$key must be a positive integer or null.');
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
