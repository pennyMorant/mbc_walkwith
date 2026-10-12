import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/ai/ai_locale.dart';
import 'package:mbc_walkwith/core/ai/ai_request_contract.dart';
import 'package:mbc_walkwith/core/ai/member_ai_study_response.dart';

void main() {
  test('parses the complete member AI response contract', () {
    final response = MemberAiStudyResponse.fromEnvelope(
      _validEnvelope,
      expectedTask: 'bible_study_help',
    );

    expect(response.task, 'bible_study_help');
    expect(response.markdown, '## Study help');
    expect(response.provider, 'openai');
    expect(response.usage.totalTokens, 12);
  });

  test('rejects mismatched tasks and malformed usage', () {
    expect(
      () => MemberAiStudyResponse.fromEnvelope(
        _validEnvelope,
        expectedTask: 'sermon_qa',
      ),
      throwsA(isA<FormatException>()),
    );
    expect(
      () => MemberAiStudyResponse.fromEnvelope({
        'data': {
          ..._validData,
          'usage': {'inputTokens': -1, 'outputTokens': 5, 'totalTokens': 12},
        },
      }, expectedTask: 'bible_study_help'),
      throwsA(isA<FormatException>()),
    );
  });

  test('maps supported app locales to the backend AI contract', () {
    expect(aiLocaleFor(const Locale('en', 'US')), 'en');
    expect(aiLocaleFor(const Locale('es', 'MX')), 'es');
    expect(
      aiLocaleFor(const Locale.fromSubtags(languageCode: 'zh')),
      'zh-Hans',
    );
    expect(
      aiLocaleFor(
        const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
      ),
      'zh-Hant',
    );
  });

  test('bounds provider text without splitting a surrogate pair', () {
    final value = List.filled(60, '😀').join();
    final bounded = boundedAiText(value, maxLength: 40);

    expect(bounded.length, lessThanOrEqualTo(40));
    expect(bounded, endsWith('[Context excerpt truncated]'));
    expect(bounded.runes, isNot(contains(0xFFFD)));
  });

  test('rejects empty and oversized AI questions', () {
    expect(() => validatedAiQuestion('   '), throwsFormatException);
    expect(
      () =>
          validatedAiQuestion(List.filled(aiQuestionMaxLength + 1, 'x').join()),
      throwsFormatException,
    );
  });

  test('validates locale and resource identity before transport', () {
    expect(validatedAiLocale('zh-Hant'), 'zh-Hant');
    expect(() => validatedAiLocale('fr'), throwsFormatException);
    expect(validatedAiResourceId(' sermon-1 '), 'sermon-1');
    expect(() => validatedAiResourceId(' '), throwsFormatException);
    expect(
      () => validatedAiResourceId(
        List.filled(aiResourceIdMaxLength + 1, 'x').join(),
      ),
      throwsFormatException,
    );
  });
}

const _validEnvelope = {'data': _validData};

const _validData = {
  'task': 'bible_study_help',
  'markdown': '## Study help',
  'provider': 'openai',
  'model': 'test-model',
  'safetyNotice': 'Study help does not replace pastoral care.',
  'usage': {'inputTokens': 7, 'outputTokens': 5, 'totalTokens': 12},
  'latencyMs': 42,
};
