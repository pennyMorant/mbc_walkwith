import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ai/ai_request_contract.dart';
import '../../../core/ai/member_ai_study_response.dart';
import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/sermon.dart';

final sermonAiRepositoryProvider = Provider<SermonAiRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockSermonAiRepository();
  }
  return ApiSermonAiRepository(apiClient: ref.watch(apiClientProvider));
});

abstract class SermonAiRepository {
  Future<MemberAiStudyResponse> askSermonQuestion({
    required MemberSession session,
    required Sermon sermon,
    required String question,
    required String locale,
  });
}

class ApiSermonAiRepository implements SermonAiRepository {
  const ApiSermonAiRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<MemberAiStudyResponse> askSermonQuestion({
    required MemberSession session,
    required Sermon sermon,
    required String question,
    required String locale,
  }) async {
    final body = _sermonBody(sermon);
    final response = await apiClient.postJsonMapWithBearer('/member/ai/study', {
      'task': 'sermon_qa',
      'locale': validatedAiLocale(locale),
      'input': {
        'title': boundedAiText(sermon.title, maxLength: aiTitleMaxLength),
        'reference': boundedAiText(
          sermon.primaryReference,
          maxLength: aiReferenceMaxLength,
        ),
        if (body.isNotEmpty) 'body': body,
        'question': validatedAiQuestion(question),
        'context': _sermonContext(sermon),
      },
      'resource': {
        'resourceType': 'sermon',
        'resourceId': validatedAiResourceId(sermon.id),
      },
    }, session.accessToken);
    return MemberAiStudyResponse.fromEnvelope(
      response,
      expectedTask: 'sermon_qa',
    );
  }
}

class MockSermonAiRepository implements SermonAiRepository {
  const MockSermonAiRepository();

  @override
  Future<MemberAiStudyResponse> askSermonQuestion({
    required MemberSession session,
    required Sermon sermon,
    required String question,
    required String locale,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return MemberAiStudyResponse(
      task: 'sermon_qa',
      markdown:
          '### ${sermon.title}\n\n'
          '这是开发模式下的讲道问答示例。正式模式会通过后端 '
          '`/member/ai/study` 的 `sermon_qa` 任务回答。\n\n'
          '- 回答只基于讲道摘要、文稿、大纲和经文引用。\n'
          '- 如果上下文不足，AI 应提示需要补充信息。\n'
          '- 重要牧养问题仍应咨询教会牧者。',
      provider: 'disabled',
      model: 'mock',
      safetyNotice: 'AI sermon help is for reflection only.',
      usage: const AiTokenUsage(
        inputTokens: null,
        outputTokens: null,
        totalTokens: null,
      ),
      latencyMs: 180,
    );
  }
}

String _sermonBody(Sermon sermon) {
  final summary = sermon.summary.trim();
  if (summary.isNotEmpty) {
    return boundedAiText(summary, maxLength: aiBodyMaxLength);
  }
  final transcript = sermon.transcript?.text.trim();
  if (transcript != null && transcript.isNotEmpty) {
    return boundedAiText(transcript, maxLength: aiBodyMaxLength);
  }
  return boundedAiText(
    sermon.outline.map((item) => '${item.title}: ${item.summary}').join('\n'),
    maxLength: aiBodyMaxLength,
  );
}

List<Map<String, String>> _sermonContext(Sermon sermon) {
  final transcript = sermon.transcript?.text.trim() ?? '';
  final hasSummary = sermon.summary.trim().isNotEmpty;
  return <Map<String, String>?>[
    _contextItem('Speaker', sermon.speaker),
    _contextItem('Date', sermon.date),
    _contextItem('Series', sermon.series),
    _contextItem('Primary reference', sermon.primaryReference),
    if (sermon.references.isNotEmpty)
      _contextItem(
        'Scripture references',
        sermon.references
            .map((reference) => '${reference.reference}: ${reference.note}')
            .join('\n'),
      ),
    if (sermon.outline.isNotEmpty)
      _contextItem(
        'Outline',
        sermon.outline
            .map((item) => '${item.title}: ${item.summary}')
            .join('\n'),
      ),
    if (hasSummary && transcript.isNotEmpty)
      _contextItem('Transcript excerpt', transcript),
  ].whereType<Map<String, String>>().toList(growable: false);
}

Map<String, String>? _contextItem(String label, String value) {
  final clean = value.trim();
  if (clean.isEmpty) {
    return null;
  }
  return {
    'label': label,
    'value': boundedAiText(clean, maxLength: aiContextValueMaxLength),
  };
}
