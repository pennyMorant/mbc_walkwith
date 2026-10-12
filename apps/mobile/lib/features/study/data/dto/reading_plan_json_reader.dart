Map<String, Object?> readingPlanObject(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! Map<String, Object?>) {
    throw FormatException('$key must be an object.');
  }
  return value;
}

List<Map<String, Object?>> readingPlanObjectList(
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

String readingPlanString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = false,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('$key must be a valid string.');
  }
  return value;
}

String? readingPlanNullableString(Map<String, Object?> json, String key) {
  if (!json.containsKey(key)) {
    throw FormatException('$key is required.');
  }
  final value = json[key];
  if (value != null && value is! String) {
    throw FormatException('$key must be null or a string.');
  }
  return value as String?;
}

bool readingPlanBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! bool) {
    throw FormatException('$key must be a boolean.');
  }
  return value;
}

String readingPlanEnum(
  Map<String, Object?> json,
  String key,
  Set<String> supported,
) {
  final value = readingPlanString(json, key);
  if (!supported.contains(value)) {
    throw FormatException('$key is not supported.');
  }
  return value;
}

int readingPlanPositiveInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value <= 0) {
    throw FormatException('$key must be a positive integer.');
  }
  return value;
}

DateTime readingPlanDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw FormatException('$key must be an ISO date-time.');
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return parsed;
}

DateTime? readingPlanNullableDateTime(Map<String, Object?> json, String key) {
  if (!json.containsKey(key)) {
    throw FormatException('$key is required.');
  }
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return parsed;
}
