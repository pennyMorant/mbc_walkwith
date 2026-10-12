Map<String, Object?> readGivingData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Giving response data must be an object.');
  }
  return data;
}

List<Map<String, Object?>> readGivingObjectList(
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

String readGivingString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = true,
  String? defaultValue,
}) {
  final value = json[key] ?? defaultValue;
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('$key must be a valid string.');
  }
  return value;
}

String readGivingEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = readGivingString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

int readGivingInt(Map<String, Object?> json, String key, {int? defaultValue}) {
  final value = json[key] ?? defaultValue;
  if (value is! int) {
    throw FormatException('$key must be an integer.');
  }
  return value;
}

int readGivingNonNegativeInt(
  Map<String, Object?> json,
  String key, {
  int? defaultValue,
}) {
  final value = readGivingInt(json, key, defaultValue: defaultValue);
  if (value < 0) {
    throw FormatException('$key must be a non-negative integer.');
  }
  return value;
}

int? readNullableGivingNonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int || value < 0) {
    throw FormatException('$key must be null or a non-negative integer.');
  }
  return value;
}

DateTime readGivingDateTime(Map<String, Object?> json, String key) {
  final value = readGivingString(json, key, allowEmpty: false);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return parsed;
}

DateTime? readNullableGivingDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return parsed;
}
