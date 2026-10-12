import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/study/data/reading_plan_repository.dart';

void main() {
  test('fetches published reading plans with identity headers', () async {
    final dio = _ReadingPlanDio();
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final plans = await repository.listPublishedPlans(_identity);

    expect(plans.single.id, 'plan_1');
    expect(plans.single.durationDays, 7);
    expect(
      dio.requests.single.path,
      '/reading-plans?limit=20&status=published',
    );
    expect(dio.requests.single.authorization, 'Bearer member-token');
    expect(dio.requests.single.externalUserId, 'ext_test_user');
  });

  test('fetches plan days as scripture references only', () async {
    final dio = _ReadingPlanDio();
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final days = await repository.listPlanDays('plan_1', _identity);

    expect(days.single.references.single.bookId, 'jhn');
    expect(days.single.references.single.displayLabel, 'John 1:1-18');
    expect(dio.requests.single.path, '/reading-plans/plan_1/days');
  });

  test('self assigns and updates day progress through backend', () async {
    final dio = _ReadingPlanDio();
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final assignment = await repository.selfAssign('plan_1', _identity);
    final progress = await repository.updateDayProgress(
      assignmentId: assignment.id,
      dayId: 'day_1',
      status: 'completed',
      identity: _identity,
    );

    expect(assignment.id, 'assignment_1');
    expect(progress.isCompleted, isTrue);
    expect(dio.requests.map((request) => request.path), [
      '/reading-plans/plan_1/assignments',
      '/reading-plans/assignments/assignment_1/days/day_1',
    ]);
    expect(dio.requests.last.data, containsPair('status', 'completed'));
    expect(
      dio.requests.last.data,
      isNot(containsPair('completedAt', anything)),
    );
  });

  test('reads scoped assignment history and detail snapshots', () async {
    final dio = _ReadingPlanDio();
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final page = await repository.listMyAssignments(
      _identity,
      scope: 'history',
      limit: 10,
    );
    final detail = await repository.getAssignmentDetail(
      'assignment_1',
      _identity,
    );

    expect(page.items.single.planTitle, 'Gospel of John');
    expect(page.items.single.attemptNumber, 1);
    expect(page.nextCursor, isNull);
    expect(detail.days.single.id, 'day_1');
    expect(detail.canRestart, isTrue);
    expect(dio.requests.map((request) => request.path), [
      '/me/reading-plans?scope=history&limit=10',
      '/me/reading-plans/assignment_1',
    ]);
  });

  test('updates assignment lifecycle through backend', () async {
    final dio = _ReadingPlanDio();
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final assignment = await repository.updateAssignmentStatus(
      assignmentId: 'assignment_1',
      status: 'paused',
      identity: _identity,
    );

    expect(assignment.id, 'assignment_1');
    expect(
      dio.requests.single.path,
      '/reading-plans/assignments/assignment_1/status',
    );
    expect(dio.requests.single.data, {'status': 'paused'});
  });

  test('passes the history cursor when loading the next page', () async {
    final dio = _ReadingPlanDio(
      responseFor: (path) => {
        'data': {
          'items': [
            if (path.contains('cursor=20'))
              {..._assignmentJson, 'id': 'assignment_2', 'attemptNumber': 2}
            else
              _assignmentJson,
          ],
          'nextCursor': path.contains('cursor=20') ? null : '20',
        },
      },
    );
    final repository = ApiReadingPlanRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final firstPage = await repository.listMyAssignments(
      _identity,
      scope: 'history',
      limit: 20,
    );
    final secondPage = await repository.listMyAssignments(
      _identity,
      scope: 'history',
      limit: 20,
      cursor: firstPage.nextCursor,
    );

    expect(firstPage.nextCursor, '20');
    expect(secondPage.items.single.id, 'assignment_2');
    expect(dio.requests.last.path, contains('cursor=20'));
  });

  test('rejects a malformed reading plan collection envelope', () async {
    final repository = _repositoryWithResponse(
      (_) => const {'data': <Object?>[]},
    );

    await expectLater(
      repository.listPublishedPlans(_identity),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects malformed plan fields instead of applying defaults', () async {
    final repository = _repositoryWithResponse(
      (_) => {
        'data': {
          'items': [
            {..._planJson, 'durationDays': '7'},
          ],
          'nextCursor': null,
        },
      },
    );

    await expectLater(
      repository.listPublishedPlans(_identity),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects malformed nested references without dropping them', () async {
    final repository = _repositoryWithResponse(
      (_) => {
        'data': {
          'items': [
            {
              ..._dayJson,
              'references': <Object?>['invalid-reference'],
            },
          ],
          'nextCursor': null,
        },
      },
    );

    await expectLater(
      repository.listPlanDays('plan_1', _identity),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects malformed assignment progress without hiding it', () async {
    final repository = _repositoryWithResponse(
      (_) => {
        'data': {
          'items': [
            {
              ..._assignmentJson,
              'progress': <Object?>[42],
            },
          ],
        },
      },
    );

    await expectLater(
      repository.listMyAssignments(_identity),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects a malformed mutation envelope', () async {
    final repository = _repositoryWithResponse((_) => const {'data': null});

    await expectLater(
      repository.selfAssign('plan_1', _identity),
      throwsA(isA<FormatException>()),
    );
  });
}

ApiReadingPlanRepository _repositoryWithResponse(
  Object? Function(String path) responseFor,
) {
  final dio = _ReadingPlanDio(responseFor: responseFor);
  return ApiReadingPlanRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
  );
}

class _ReadingPlanDio {
  _ReadingPlanDio({this.responseFor}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedReadingPlanRequest(
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
              data:
                  responseFor?.call(options.path) ?? _responseFor(options.path),
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedReadingPlanRequest> requests = [];
  final Object? Function(String path)? responseFor;

  Map<String, Object?> _responseFor(String path) {
    if (path.startsWith('/reading-plans?')) {
      return const {
        'data': {
          'items': [_planJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/reading-plans/plan_1/days') {
      return const {
        'data': {
          'items': [_dayJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/reading-plans/plan_1/assignments') {
      return const {'data': _assignmentJson, 'meta': <String, Object?>{}};
    }
    if (path == '/reading-plans/assignments/assignment_1/days/day_1') {
      return const {'data': _progressJson, 'meta': <String, Object?>{}};
    }
    if (path == '/me/reading-plans/assignment_1') {
      return const {
        'data': {
          'assignment': _assignmentJson,
          'days': [_dayJson],
          'canRestart': true,
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/reading-plans/assignments/assignment_1/status') {
      return const {'data': _assignmentJson, 'meta': <String, Object?>{}};
    }
    return const {
      'data': {
        'items': [_assignmentJson],
        'nextCursor': null,
      },
      'meta': <String, Object?>{},
    };
  }
}

class _RecordedReadingPlanRequest {
  const _RecordedReadingPlanRequest({
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

const _planJson = {
  'id': 'plan_1',
  'title': 'Gospel of John',
  'description': 'A weekly plan.',
  'status': 'published',
  'visibility': 'public',
  'locale': 'en',
  'durationDays': 7,
  'createdAt': '2026-06-01T00:00:00.000Z',
  'updatedAt': '2026-06-01T00:00:00.000Z',
};

const _dayJson = {
  'id': 'day_1',
  'planId': 'plan_1',
  'dayNumber': 1,
  'title': 'The Word became flesh',
  'description': 'Opening passage.',
  'references': [
    {
      'bookId': 'jhn',
      'chapter': 1,
      'startVerse': 1,
      'endVerse': 18,
      'referenceLabel': 'John 1:1-18',
    },
  ],
  'createdAt': '2026-06-01T00:00:00.000Z',
  'updatedAt': '2026-06-01T00:00:00.000Z',
};

const _assignmentJson = {
  'id': 'assignment_1',
  'planId': 'plan_1',
  'planTitle': 'Gospel of John',
  'planDurationDays': 7,
  'attemptNumber': 1,
  'userType': 'member',
  'userId': 'member-1',
  'sourceType': 'self',
  'sourceId': null,
  'status': 'active',
  'startedAt': '2026-06-02T00:00:00.000Z',
  'completedAt': null,
  'endedAt': null,
  'progress': <Object?>[],
  'createdAt': '2026-06-02T00:00:00.000Z',
  'updatedAt': '2026-06-02T00:00:00.000Z',
};

const _progressJson = {
  'id': 'progress_1',
  'assignmentId': 'assignment_1',
  'dayId': 'day_1',
  'status': 'completed',
  'note': '',
  'completedAt': '2026-06-02T12:00:00.000Z',
  'updatedAt': '2026-06-02T12:00:00.000Z',
};

const _identity = ReadingPlanIdentity(
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
