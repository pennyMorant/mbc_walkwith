const aiQuestionMaxLength = 1000;
const aiTitleMaxLength = 200;
const aiReferenceMaxLength = 200;
const aiBodyMaxLength = 12000;
const aiContextValueMaxLength = 3000;
const aiResourceIdMaxLength = 120;

const _supportedAiLocales = {'zh-Hans', 'zh-Hant', 'en', 'es'};

String validatedAiLocale(String value) {
  if (!_supportedAiLocales.contains(value)) {
    throw FormatException('Unsupported AI locale: $value.');
  }
  return value;
}

String validatedAiQuestion(String value) {
  final question = value.trim();
  if (question.isEmpty) {
    throw const FormatException('AI question must not be empty.');
  }
  if (question.length > aiQuestionMaxLength) {
    throw const FormatException('AI question exceeds the request contract.');
  }
  return question;
}

String validatedAiResourceId(String value) {
  final resourceId = value.trim();
  if (resourceId.isEmpty) {
    throw const FormatException('AI resource ID must not be empty.');
  }
  if (resourceId.length > aiResourceIdMaxLength) {
    throw const FormatException('AI resource ID exceeds the request contract.');
  }
  return resourceId;
}

String boundedAiText(String value, {required int maxLength}) {
  if (maxLength < 1) {
    throw ArgumentError.value(maxLength, 'maxLength', 'must be positive');
  }
  final clean = value.trim();
  if (clean.length <= maxLength) {
    return clean;
  }

  const suffix = '\n\n[Context excerpt truncated]';
  final budget = maxLength - suffix.length;
  if (budget <= 0) {
    return suffix.substring(0, maxLength);
  }
  var end = budget;
  if (end < clean.length &&
      end > 0 &&
      _isHighSurrogate(clean.codeUnitAt(end - 1)) &&
      _isLowSurrogate(clean.codeUnitAt(end))) {
    end -= 1;
  }
  return '${clean.substring(0, end).trimRight()}$suffix';
}

bool _isHighSurrogate(int value) => value >= 0xD800 && value <= 0xDBFF;

bool _isLowSurrogate(int value) => value >= 0xDC00 && value <= 0xDFFF;
