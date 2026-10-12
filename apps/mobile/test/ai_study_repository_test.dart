import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/study/data/ai_study_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/domain/bible_translation.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';

void main() {
  test('calls backend member AI study API with bearer auth', () async {
    final requests = <RequestOptions>[];
    final dio = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(options);
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: const {
                'data': {
                  'task': 'bible_study_help',
                  'markdown': 'Study answer',
                  'provider': 'openai',
                  'model': 'gpt-test',
                  'safetyNotice': 'Review with church leaders.',
                  'usage': {
                    'inputTokens': null,
                    'outputTokens': null,
                    'totalTokens': null,
                  },
                  'latencyMs': 42,
                },
              },
            ),
          );
        },
      ),
    );

    final repository = ApiAiStudyRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio),
    );
    final response = await repository.createBibleStudyHelp(
      session: _testSession,
      book: _romans,
      chapter: 8,
      verse: const BibleVerse(id: 'rom.8.28', number: 28, text: 'And we know'),
      translation: BibleTranslation.web,
      locale: 'en',
      question: 'Explain this verse.',
    );

    expect(response.markdown, 'Study answer');
    expect(response.provider, 'openai');
    expect(requests, hasLength(1));

    final request = requests.single;
    expect(request.path, '/member/ai/study');
    expect(request.headers['authorization'], 'Bearer member-token');

    final body = request.data as Map<String, Object?>;
    expect(body['task'], 'bible_study_help');
    expect(body['locale'], 'en');
    expect(body['resource'], {
      'resourceType': 'bible_passage',
      'resourceId': 'rom.8.28',
    });
    final input = body['input'] as Map<String, Object?>;
    expect(input['reference'], 'Romans 8:28');
    expect(input['body'], 'And we know');
    expect(input['question'], 'Explain this verse.');
  });

  test(
    'rejects malformed member AI responses instead of showing empty text',
    () async {
      final repository = _repositoryForResponse({
        'data': {..._validAiData, 'markdown': ''},
      });

      await expectLater(
        repository.createBibleStudyHelp(
          session: _testSession,
          book: _romans,
          chapter: 8,
          verse: const BibleVerse(
            id: 'rom.8.28',
            number: 28,
            text: 'And we know',
          ),
          translation: BibleTranslation.web,
          locale: 'en',
          question: 'Explain this verse.',
        ),
        throwsA(isA<FormatException>()),
      );
    },
  );
}

ApiAiStudyRepository _repositoryForResponse(Object? responseData) {
  final dio = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        handler.resolve(
          Response<Object?>(
            requestOptions: options,
            statusCode: 200,
            data: responseData,
          ),
        );
      },
    ),
  );
  return ApiAiStudyRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio),
  );
}

const _validAiData = {
  'task': 'bible_study_help',
  'markdown': 'Study answer',
  'provider': 'openai',
  'model': 'gpt-test',
  'safetyNotice': 'Review with church leaders.',
  'usage': {'inputTokens': null, 'outputTokens': null, 'totalTokens': null},
  'latencyMs': 42,
};

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);

const _romans = BibleBook(
  id: 'rom',
  testament: BibleTestament.newTestament,
  category: BibleBookCategory.paulineLetters,
  nameZh: '罗马书',
  nameEn: 'Romans',
  abbreviationZh: '罗',
  abbreviationEn: 'Rom',
  chapterCount: 16,
  sortOrder: 45,
);

const _testSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
