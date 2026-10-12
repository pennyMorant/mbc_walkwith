class SermonProgressIdentity {
  const SermonProgressIdentity({
    required this.externalUserId,
    this.accessToken,
  });

  final String externalUserId;
  final String? accessToken;
}

class SermonRemoteProgress {
  const SermonRemoteProgress({
    required this.sermonId,
    required this.position,
    required this.completed,
    required this.updatedAt,
    this.completedAt,
  });

  final String sermonId;
  final Duration position;
  final bool completed;
  final DateTime updatedAt;
  final DateTime? completedAt;

  factory SermonRemoteProgress.fromJson(Map<String, Object?> json) {
    return SermonRemoteProgress(
      sermonId: _requiredString(json, 'sermonId'),
      position: Duration(
        seconds: _requiredNonnegativeInt(json, 'positionSeconds'),
      ),
      completed: _requiredBool(json, 'completed'),
      completedAt: _optionalDateTime(json, 'completedAt'),
      updatedAt: _requiredDateTime(json, 'updatedAt'),
    );
  }
}

class SermonLocalProgress {
  const SermonLocalProgress({required this.position, this.updatedAt});

  final Duration position;
  final DateTime? updatedAt;
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String || value.isEmpty) {
    throw FormatException('Sermon progress $key is missing.');
  }
  return value;
}

int _requiredNonnegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('Sermon progress $key is invalid.');
  }
  return value;
}

bool _requiredBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! bool) {
    throw FormatException('Sermon progress $key is invalid.');
  }
  return value;
}

DateTime _requiredDateTime(Map<String, Object?> json, String key) {
  final value = _optionalDateTime(json, key);
  if (value == null) {
    throw FormatException('Sermon progress $key is invalid.');
  }
  return value;
}

DateTime? _optionalDateTime(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! String) {
    throw FormatException('Sermon progress $key is invalid.');
  }
  return DateTime.tryParse(value)?.toUtc();
}
