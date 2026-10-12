import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_discussion_guide_repository.dart';

void main() {
  test('fetches published sermon discussion guide', () async {
    final dio = _DiscussionGuideDio();
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final guide = await repository.getGuideForSermon('sermon/1');

    expect(guide?.id, 'guide_1');
    expect(guide?.questions.single.type, 'application');
    expect(guide?.actionSteps.single.title, 'Serve someone this week');
    expect(dio.requests.single.path, '/sermons/sermon%2F1/discussion-guide');
  });

  test('submits private response with member and external identity', () async {
    final dio = _DiscussionGuideDio();
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final response = await repository.createResponse(
      guideId: 'guide/1',
      identity: _identity,
      content: 'I will pray with my group this week.',
    );

    expect(response.status, 'private');
    expect(
      dio.requests.single.path,
      '/sermon-discussion-guides/guide%2F1/responses',
    );
    expect(dio.requests.single.authorization, 'Bearer member-token');
    expect(dio.requests.single.externalUserId, 'ext_test_user');
    expect(dio.requests.single.data, containsPair('status', 'private'));
  });

  test('rejects a missing discussion guide data envelope', () async {
    final dio = _DiscussionGuideDio(
      guideEnvelope: const {'meta': <String, Object?>{}},
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.getGuideForSermon('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects malformed nested discussion guide data', () async {
    final malformedGuide = Map<String, Object?>.from(_guideJson)
      ..['questions'] = const [
        {'id': 7},
      ];
    final dio = _DiscussionGuideDio(
      guideEnvelope: {
        'data': malformedGuide,
        'meta': const <String, Object?>{},
      },
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.getGuideForSermon('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects a non-public discussion guide projection', () async {
    final nonPublicGuide = Map<String, Object?>.from(_guideJson)
      ..['audienceType'] = 'group'
      ..['audienceId'] = 'group-1';
    final dio = _DiscussionGuideDio(
      guideEnvelope: {
        'data': nonPublicGuide,
        'meta': const <String, Object?>{},
      },
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.getGuideForSermon('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects duplicate discussion question ids', () async {
    final question = Map<String, Object?>.from(
      (_guideJson['questions']! as List<Object?>).single
          as Map<String, Object?>,
    );
    final duplicateQuestionsGuide = Map<String, Object?>.from(_guideJson)
      ..['questions'] = [question, Map<String, Object?>.from(question)];
    final dio = _DiscussionGuideDio(
      guideEnvelope: {
        'data': duplicateQuestionsGuide,
        'meta': const <String, Object?>{},
      },
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.getGuideForSermon('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects oversized discussion guide collections', () async {
    final oversizedGuide = Map<String, Object?>.from(_guideJson)
      ..['prayerPrompts'] = List<String>.generate(
        51,
        (index) => 'Prayer $index',
      );
    final dio = _DiscussionGuideDio(
      guideEnvelope: {
        'data': oversizedGuide,
        'meta': const <String, Object?>{},
      },
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.getGuideForSermon('sermon-1'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects a malformed discussion response envelope', () async {
    final dio = _DiscussionGuideDio(
      responseEnvelope: const {'data': <String, Object?>{}},
    );
    final repository = ApiSermonDiscussionGuideRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    await expectLater(
      repository.createResponse(
        guideId: 'guide-1',
        identity: _identity,
        content: 'A private response.',
      ),
      throwsA(isA<FormatException>()),
    );
  });
}

class _DiscussionGuideDio {
  _DiscussionGuideDio({this.guideEnvelope, this.responseEnvelope}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedDiscussionGuideRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              externalUserId: options.headers['x-external-user-id'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: _responseFor(options.path),
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedDiscussionGuideRequest> requests = [];
  final Map<String, Object?>? guideEnvelope;
  final Map<String, Object?>? responseEnvelope;

  Map<String, Object?> _responseFor(String path) {
    if (path.startsWith('/sermons/') && path.endsWith('/discussion-guide')) {
      return guideEnvelope ??
          const {'data': _guideJson, 'meta': <String, Object?>{}};
    }
    return responseEnvelope ??
        const {'data': _responseJson, 'meta': <String, Object?>{}};
  }
}

class _RecordedDiscussionGuideRequest {
  const _RecordedDiscussionGuideRequest({
    required this.path,
    required this.authorization,
    required this.externalUserId,
    required this.data,
  });

  final String path;
  final String? authorization;
  final String? externalUserId;
  final Object? data;
}

const _guideJson = {
  'id': 'guide_1',
  'sermonId': 'sermon_1',
  'title': 'Living the Word',
  'summary': 'Discuss the sermon in small groups.',
  'status': 'published',
  'audienceType': 'public',
  'audienceId': null,
  'questions': [
    {
      'id': 'q1',
      'type': 'application',
      'prompt': 'What step of obedience is clear this week?',
      'sortOrder': 1,
      'startSeconds': null,
    },
  ],
  'actionSteps': [
    {
      'id': 'a1',
      'title': 'Serve someone this week',
      'description': 'Choose one person and follow through.',
      'sortOrder': 1,
    },
  ],
  'prayerPrompts': ['Pray for courage to obey.'],
  'publishedAt': '2026-06-01T00:00:00.000Z',
  'createdAt': '2026-06-01T00:00:00.000Z',
  'updatedAt': '2026-06-01T00:00:00.000Z',
};

const _responseJson = {
  'id': 'response_1',
  'guideId': 'guide_1',
  'questionId': null,
  'userType': 'member',
  'userId': 'member-1',
  'status': 'private',
  'content': 'I will pray with my group this week.',
  'createdAt': '2026-06-02T00:00:00.000Z',
  'updatedAt': '2026-06-02T00:00:00.000Z',
};

const _identity = SermonDiscussionIdentity(
  externalUserId: 'ext_test_user',
  session: _memberSession,
);

const _memberSession = MemberSession(
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

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);
