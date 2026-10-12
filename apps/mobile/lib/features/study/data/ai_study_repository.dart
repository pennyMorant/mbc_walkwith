import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ai/ai_request_contract.dart';
import '../../../core/ai/member_ai_study_response.dart';
import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/bible_book.dart';
import '../domain/bible_translation.dart';
import '../domain/bible_verse.dart';

final aiStudyRepositoryProvider = Provider<AiStudyRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockAiStudyRepository();
  }
  return ApiAiStudyRepository(apiClient: ref.watch(apiClientProvider));
});

abstract class AiStudyRepository {
  Future<MemberAiStudyResponse> createBibleStudyHelp({
    required MemberSession session,
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
    required String locale,
    required String question,
  });
}

class ApiAiStudyRepository implements AiStudyRepository {
  const ApiAiStudyRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<MemberAiStudyResponse> createBibleStudyHelp({
    required MemberSession session,
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
    required String locale,
    required String question,
  }) async {
    final reference = boundedAiText(
      _referenceFor(book, chapter, verse, translation),
      maxLength: aiReferenceMaxLength,
    );
    final response = await apiClient.postJsonMapWithBearer('/member/ai/study', {
      'task': 'bible_study_help',
      'locale': validatedAiLocale(locale),
      'input': {
        'reference': reference,
        'body': boundedAiText(verse.text, maxLength: aiBodyMaxLength),
        'question': validatedAiQuestion(question),
        'context': [
          {
            'label': 'Bible translation',
            'value': boundedAiText(
              translation.name,
              maxLength: aiContextValueMaxLength,
            ),
          },
        ],
      },
      'resource': {
        'resourceType': 'bible_passage',
        'resourceId': validatedAiResourceId(verse.id),
      },
    }, session.accessToken);
    return MemberAiStudyResponse.fromEnvelope(
      response,
      expectedTask: 'bible_study_help',
    );
  }
}

class MockAiStudyRepository implements AiStudyRepository {
  const MockAiStudyRepository();

  @override
  Future<MemberAiStudyResponse> createBibleStudyHelp({
    required MemberSession session,
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
    required String locale,
    required String question,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return const MemberAiStudyResponse(
      task: 'bible_study_help',
      markdown:
          '### 开发模式查经辅助\n\n'
          '这是一段开发模式下的 AI 查经辅助示例。正式模式会通过后端 '
          '`/member/ai/study` 调用已配置的 AI provider。\n\n'
          '- 先观察经文本身的关键词。\n'
          '- 再结合上下文理解作者的重点。\n'
          '- 重要神学或牧养问题仍应和教会牧者确认。',
      provider: 'disabled',
      model: 'mock',
      safetyNotice: 'AI study help is for reflection only.',
      usage: AiTokenUsage(
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      ),
      latencyMs: 180,
    );
  }
}

String _referenceFor(
  BibleBook book,
  int chapter,
  BibleVerse verse,
  BibleTranslation translation,
) {
  final bookName = translation.usesEnglishNames ? book.nameEn : book.nameZh;
  return '$bookName $chapter:${verse.number}';
}
