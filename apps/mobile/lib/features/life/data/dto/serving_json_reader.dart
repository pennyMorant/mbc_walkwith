String readServingString(
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

String readServingEnum(
  Map<String, Object?> json,
  String key,
  Set<String> values,
) {
  final value = readServingString(json, key, allowEmpty: false);
  if (!values.contains(value)) {
    throw FormatException('$key has an unsupported value.');
  }
  return value;
}

DateTime readServingDateTime(Map<String, Object?> json, String key) {
  final value = readServingString(json, key, allowEmpty: false);
  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    throw FormatException('$key must be an ISO date-time.');
  }
  return parsed;
}

DateTime? readNullableServingDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  return readServingDateTime(json, key);
}

Map<String, Object?> readServingData(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Serving response data must be an object.');
  }
  return data;
}

List<Map<String, Object?>> readServingItems(Map<String, Object?> response) {
  final items = readServingData(response)['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException(
      'Serving response items must be an object list.',
    );
  }
  return items.cast<Map<String, Object?>>();
}
