class AiTokenUsage {
  const AiTokenUsage({
    required this.inputTokens,
    required this.outputTokens,
    required this.totalTokens,
  });

  final int? inputTokens;
  final int? outputTokens;
  final int? totalTokens;
}

class MemberAiStudyResponse {
  const MemberAiStudyResponse({
    required this.task,
    required this.markdown,
    required this.provider,
    required this.model,
    required this.safetyNotice,
    required this.usage,
    required this.latencyMs,
  });

  static const supportedProviders = {
    'disabled',
    'openai',
    'gemini',
    'openai_compatible',
  };

  final String task;
  final String markdown;
  final String provider;
  final String model;
  final String safetyNotice;
  final AiTokenUsage usage;
  final int latencyMs;

  factory MemberAiStudyResponse.fromEnvelope(
    Map<String, Object?> envelope, {
    required String expectedTask,
  }) {
    final data = _requiredMap(envelope, 'data');
    final task = _requiredString(data, 'task');
    if (task != expectedTask) {
      throw FormatException(
        'AI response task $task does not match $expectedTask.',
      );
    }
    final provider = _requiredString(data, 'provider');
    if (!supportedProviders.contains(provider)) {
      throw FormatException('Unsupported AI provider: $provider.');
    }
    final usage = _requiredMap(data, 'usage');
    return MemberAiStudyResponse(
      task: task,
      markdown: _requiredString(data, 'markdown'),
      provider: provider,
      model: _requiredString(data, 'model'),
      safetyNotice: _requiredString(data, 'safetyNotice'),
      usage: AiTokenUsage(
        inputTokens: _nullableTokenCount(usage, 'inputTokens'),
        outputTokens: _nullableTokenCount(usage, 'outputTokens'),
        totalTokens: _nullableTokenCount(usage, 'totalTokens'),
      ),
      latencyMs: _nonNegativeInt(data, 'latencyMs'),
    );
  }
}

Map<String, Object?> _requiredMap(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! Map<String, Object?>) {
    throw FormatException('$key must be an object.');
  }
  return value;
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String || value.trim().isEmpty) {
    throw FormatException('$key must be a non-empty string.');
  }
  return value.trim();
}

int _nonNegativeInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int || value < 0) {
    throw FormatException('$key must be a non-negative integer.');
  }
  return value;
}

int? _nullableTokenCount(Map<String, Object?> json, String key) {
  if (!json.containsKey(key)) {
    throw FormatException('$key is required.');
  }
  final value = json[key];
  if (value == null) {
    return null;
  }
  if (value is! int || value < 0) {
    throw FormatException('$key must be null or a non-negative integer.');
  }
  return value;
}
