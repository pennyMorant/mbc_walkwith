List<Map<String, Object?>> readLifePostObjectList(Object? value) {
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException('Life post data must be an object list.');
  }
  return value.cast<Map<String, Object?>>();
}

Map<String, Object?> readLifePostObject(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! Map<String, Object?>) {
    throw FormatException('$key must be an object.');
  }
  return value;
}

String readLifePostString(
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

String? readNullableLifePostString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw FormatException('$key must be null or a string.');
  }
  return value;
}

String readLifePostEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = readLifePostString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

String? readNullableLifePostEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = readNullableLifePostString(json, key);
  if (value != null && !values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

bool readLifePostBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! bool) {
    throw FormatException('$key must be a boolean.');
  }
  return value;
}

bool readOptionalLifePostBool(
  Map<String, Object?> json,
  String key, {
  required bool defaultValue,
}) {
  final value = json[key];
  if (value == null) {
    return defaultValue;
  }
  if (value is! bool) {
    throw FormatException('$key must be a boolean.');
  }
  return value;
}

int readLifePostInt(
  Map<String, Object?> json,
  String key, {
  int? minimum,
  int? maximum,
}) {
  final value = json[key];
  if (value is! int ||
      (minimum != null && value < minimum) ||
      (maximum != null && value > maximum)) {
    throw FormatException('$key must be a valid integer.');
  }
  return value;
}

int? readNullableLifePostInt(
  Map<String, Object?> json,
  String key, {
  int? minimum,
  int? maximum,
}) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int ||
      (minimum != null && value < minimum) ||
      (maximum != null && value > maximum)) {
    throw FormatException('$key must be null or a valid integer.');
  }
  return value;
}

String readLifePostIsoDateTime(Map<String, Object?> json, String key) {
  final value = readLifePostString(json, key, allowEmpty: false);
  if (DateTime.tryParse(value) == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return value;
}

String? readNullableLifePostIsoDateTime(Map<String, Object?> json, String key) {
  final value = readNullableLifePostString(json, key);
  if (value != null && DateTime.tryParse(value) == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return value;
}
