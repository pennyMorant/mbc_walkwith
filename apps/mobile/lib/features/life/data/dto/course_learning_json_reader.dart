List<Map<String, Object?>> readCourseObjectList(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw FormatException('$key must be an object list.');
  }
  return value.cast<Map<String, Object?>>();
}

String readCourseString(
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

String readCourseEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = readCourseString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('$key is not supported.');
  }
  return value;
}

String? readNullableCourseEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String || !values.contains(value)) {
    throw FormatException('$key must be null or a supported string.');
  }
  return value;
}

int readCourseNonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('$key must be a non-negative integer.');
  }
  return value;
}

int? readNullableCourseCapacity(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int || value <= 0) {
    throw FormatException('$key must be null or a positive integer.');
  }
  return value;
}

DateTime readCourseDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  final parsed = value is String ? DateTime.tryParse(value) : null;
  if (parsed == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return parsed;
}

DateTime? readNullableCourseDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  final parsed = value is String ? DateTime.tryParse(value) : null;
  if (parsed == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return parsed;
}
