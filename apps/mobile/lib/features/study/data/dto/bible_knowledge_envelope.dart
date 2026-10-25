List<Map<String, Object?>> readBibleKnowledgeItems(
  Map<String, Object?> envelope, {
  required String expectedType,
  required String translationId,
}) {
  final data = envelope['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Bible knowledge data is malformed.');
  }
  final items = data['items'];
  if (items is! List<Object?>) {
    throw const FormatException('Bible knowledge items are malformed.');
  }

  return items
      .map((item) {
        if (item is! Map<String, Object?>) {
          throw const FormatException('Bible knowledge item is malformed.');
        }
        _requireString(item, 'id');
        if (_requireString(item, 'type') != expectedType ||
            _requireString(item, 'translationId') != translationId ||
            _requireString(item, 'status') != 'published') {
          throw const FormatException('Bible knowledge item scope is invalid.');
        }
        _requireString(item, 'locale');
        _requireString(item, 'name');
        _requireString(item, 'category');
        _requireString(item, 'summary', allowEmpty: true);
        _requireString(item, 'description', allowEmpty: true);
        _requireStringList(item, 'aliases');
        _requireSections(item['sections']);
        _requireVerseAliases(item['verseAliases']);
        return item;
      })
      .toList(growable: false);
}

String _requireString(
  Map<String, Object?> json,
  String key, {
  bool allowEmpty = false,
}) {
  final value = json[key];
  if (value is! String || (!allowEmpty && value.trim().isEmpty)) {
    throw FormatException('Bible knowledge $key is invalid.');
  }
  return value;
}

void _requireStringList(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! List<Object?> || value.any((item) => item is! String)) {
    throw FormatException('Bible knowledge $key is invalid.');
  }
}

void _requireSections(Object? value) {
  if (value is! List<Object?>) {
    throw const FormatException('Bible knowledge sections are invalid.');
  }
  for (final section in value) {
    if (section is! Map<String, Object?>) {
      throw const FormatException('Bible knowledge section is invalid.');
    }
    _requireString(section, 'type');
    _requireString(section, 'title', allowEmpty: true);
    _requireString(section, 'body', allowEmpty: true);
  }
}

void _requireVerseAliases(Object? value) {
  if (value is! Map<String, Object?>) {
    throw const FormatException('Bible knowledge verse aliases are invalid.');
  }
  for (final entry in value.entries) {
    final aliases = entry.value;
    if (entry.key.trim().isEmpty ||
        aliases is! List<Object?> ||
        aliases.any((alias) => alias is! String)) {
      throw const FormatException('Bible knowledge verse aliases are invalid.');
    }
  }
}
