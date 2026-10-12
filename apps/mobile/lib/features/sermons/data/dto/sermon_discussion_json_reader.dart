Map<String, Object?> sermonDiscussionMap(Object? value, String field) {
  if (value is Map<String, Object?>) {
    return value;
  }
  throw FormatException('$field must be an object.');
}

List<Map<String, Object?>> sermonDiscussionMapList(
  Map<String, Object?> json,
  String key, {
  int? maxItems,
}) {
  final value = json[key];
  if (value is! List<Object?> ||
      value.any((item) => item is! Map<String, Object?>)) {
    throw FormatException('$key must be an object list.');
  }
  if (maxItems != null && value.length > maxItems) {
    throw FormatException('$key exceeds the maximum item count.');
  }
  return value.cast<Map<String, Object?>>();
}

List<T> sermonDiscussionMappedList<T>(
  Map<String, Object?> json,
  String key,
  T Function(Map<String, Object?> json) mapper, {
  int? maxItems,
  String Function(T item)? idOf,
}) {
  final items = sermonDiscussionMapList(
    json,
    key,
    maxItems: maxItems,
  ).map(mapper).toList();
  if (idOf != null) {
    sermonDiscussionRequireUniqueIds(items.map(idOf), key);
  }
  return items;
}

List<String> sermonDiscussionStringList(
  Map<String, Object?> json,
  String key, {
  bool requireNonEmptyItems = false,
  int? maxItems,
}) {
  final value = json[key];
  if (value is! List<Object?> || value.any((item) => item is! String)) {
    throw FormatException('$key must be a string list.');
  }
  if (maxItems != null && value.length > maxItems) {
    throw FormatException('$key exceeds the maximum item count.');
  }
  final strings = value.cast<String>();
  if (requireNonEmptyItems && strings.any((item) => item.trim().isEmpty)) {
    throw FormatException('$key must not contain empty strings.');
  }
  return strings;
}

void sermonDiscussionRequireUniqueIds(Iterable<String> ids, String field) {
  final values = ids.toList();
  if (values.toSet().length != values.length) {
    throw FormatException('$field must contain unique ids.');
  }
}

String sermonDiscussionString(
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

String sermonDiscussionEnum(
  Map<String, Object?> json,
  String key,
  Set<String> allowed,
) {
  final value = sermonDiscussionString(json, key);
  if (!allowed.contains(value)) {
    throw FormatException('$key is not supported.');
  }
  return value;
}

String? sermonDiscussionNullableString(Map<String, Object?> json, String key) {
  if (!json.containsKey(key)) {
    throw FormatException('$key is required.');
  }
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('$key must be null or a valid string.');
  }
  return value;
}

Null sermonDiscussionNull(Map<String, Object?> json, String key) {
  if (!json.containsKey(key) || json[key] != null) {
    throw FormatException('$key must be null.');
  }
  return null;
}

int sermonDiscussionInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw FormatException('$key must be an integer.');
  }
  return value;
}

int? sermonDiscussionNullableInt(
  Map<String, Object?> json,
  String key, {
  bool nonNegative = false,
}) {
  if (!json.containsKey(key)) {
    throw FormatException('$key is required.');
  }
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int || (nonNegative && value < 0)) {
    throw FormatException('$key must be null or a valid integer.');
  }
  return value;
}

DateTime sermonDiscussionDateTime(Map<String, Object?> json, String key) {
  final value = sermonDiscussionString(json, key);
  final date = DateTime.tryParse(value);
  if (date == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return date;
}

DateTime? sermonDiscussionNullableDateTime(
  Map<String, Object?> json,
  String key,
) {
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
  final date = DateTime.tryParse(value);
  if (date == null) {
    throw FormatException('$key must be null or an ISO date-time.');
  }
  return date;
}
