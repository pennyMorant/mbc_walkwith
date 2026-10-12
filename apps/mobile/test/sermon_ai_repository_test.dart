import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/ai/ai_request_contract.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_ai_repository.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon.dart';

void main() {
  test('calls backend member AI study API for sermon questions', () async {
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
                  'task': 'sermon_qa',
                  'markdown': 'Sermon answer',
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

    final repository = ApiSermonAiRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio),
    );
    final response = await repository.askSermonQuestion(
      session: _testSession,
      sermon: _sermon,
      question: 'What is the main pastoral point?',
      locale: 'en',
    );

    expect(response.markdown, 'Sermon answer');
    expect(response.provider, 'openai');
    expect(requests, hasLength(1));

    final request = requests.single;
    expect(request.path, '/member/ai/study');
    expect(request.headers['authorization'], 'Bearer member-token');

    final body = request.data as Map<String, Object?>;
    expect(body['task'], 'sermon_qa');
    expect(body['locale'], 'en');
    expect(body['resource'], {
      'resourceType': 'sermon',
      'resourceId': 'sermon-1',
    });

    final input = body['input'] as Map<String, Object?>;
    expect(input['title'], 'God With Us');
    expect(input['reference'], 'Matthew 1:23');
    expect(input['body'], 'God comes near to his people.');
    expect(input['question'], 'What is the main pastoral point?');

    final context = input['context'] as List<Object?>;
    expect(
      context.any(
        (item) =>
            item is Map &&
            item['label'] == 'Speaker' &&
            item['value'] == 'Pastor Lee',
      ),
      isTrue,
    );
    expect(
      context.any(
        (item) =>
            item is Map &&
            item['label'] == 'Primary reference' &&
            item['value'] == 'Matthew 1:23',
      ),
      isTrue,
    );
    final transcriptContext =
        context.singleWhere(
              (item) => item is Map && item['label'] == 'Transcript excerpt',
            )
            as Map;
    expect(transcriptContext['value'], 'Full transcript text.');
  });

  test('bounds a realistic long sermon before sending it to the API', () async {
    final body = await _requestBodyFor(_longTranscriptSermon);
    final input = body['input'] as Map<String, Object?>;
    final sermonBody = input['body'] as String;

    expect(sermonBody.length, lessThanOrEqualTo(aiBodyMaxLength));
    expect(sermonBody, endsWith('[Context excerpt truncated]'));
    final context = input['context'] as List<Object?>;
    for (final item in context.whereType<Map>()) {
      expect(
        (item['value'] as String).length,
        lessThanOrEqualTo(aiContextValueMaxLength),
      );
    }
  });
}

Future<Map<String, Object?>> _requestBodyFor(Sermon sermon) async {
  RequestOptions? request;
  final dio = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        request = options;
        handler.resolve(
          Response<Object?>(
            requestOptions: options,
            statusCode: 200,
            data: const {'data': _validSermonAiData},
          ),
        );
      },
    ),
  );
  final repository = ApiSermonAiRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio),
  );
  await repository.askSermonQuestion(
    session: _testSession,
    sermon: sermon,
    question: 'What is the main pastoral point?',
    locale: 'en',
  );
  return request!.data as Map<String, Object?>;
}

const _validSermonAiData = {
  'task': 'sermon_qa',
  'markdown': 'Sermon answer',
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

const _sermon = Sermon(
  id: 'sermon-1',
  title: 'God With Us',
  speaker: 'Pastor Lee',
  date: '2026-06-21',
  series: 'Advent',
  primaryReference: 'Matthew 1:23',
  duration: Duration(minutes: 35),
  summary: 'God comes near to his people.',
  outline: [
    SermonOutlineItem(
      title: 'Promise',
      startTime: Duration.zero,
      summary: 'God promises his presence.',
    ),
  ],
  references: [
    SermonReference(
      reference: 'Matthew 1:23',
      verseId: 'mat.1.23',
      note: 'Main text',
    ),
  ],
  transcript: SermonTranscript(text: 'Full transcript text.'),
  audioUrl: 'https://example.com/sermon.mp3',
);

final _longTranscriptSermon = Sermon(
  id: 'sermon-long',
  title: 'A Long Sermon',
  speaker: 'Pastor Lee',
  date: '2026-06-28',
  series: '',
  primaryReference: 'John 15:1-17',
  duration: const Duration(minutes: 35),
  summary: '',
  outline: const [],
  references: const [],
  transcript: SermonTranscript(text: List.filled(15000, '讲').join()),
  audioUrl: 'https://example.com/long-sermon.mp3',
);
