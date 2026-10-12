import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/discipleship/data/discipleship_repository.dart';
import 'package:mbc_walkwith/features/discipleship/data/dto/discipleship_assignment_dto.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('fetches member discipleship assignments with progress', () async {
    final dio = _DiscipleshipDio();
    final repository = ApiDiscipleshipRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final assignments = await repository.listMyAssignments(_memberSession);

    expect(assignments, hasLength(1));
    expect(assignments.single.journeyId, 'journey_1');
    expect(assignments.single.taskTotalCount, 2);
    expect(assignments.single.completedTaskCount, 1);
    expect(dio.requests.single.path, '/me/discipleship');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('rejects malformed assignments instead of applying fallbacks', () {
    expect(
      () => DiscipleshipAssignmentDto.fromJson(const {
        'id': 'assignment_1',
        'journeyId': 'journey_1',
        'assigneeName': '',
        'status': 'in_progress',
        'startedAt': null,
        'completedAt': null,
        'taskTotalCount': 1,
        'completedTaskCount': 0,
        'progress': [
          {
            'id': 'progress_1',
            'assignmentId': 'another_assignment',
            'taskId': 'task_1',
            'status': 'available',
            'completedAt': null,
            'updatedAt': '2026-06-02T00:00:00.000Z',
          },
        ],
        'createdAt': '2026-06-01T00:00:00.000Z',
        'updatedAt': '2026-06-02T00:00:00.000Z',
      }),
      throwsA(isA<FormatException>()),
    );
  });
}

class _DiscipleshipDio {
  _DiscipleshipDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedDiscipleshipRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: const {
                'data': {
                  'items': [_assignmentJson],
                },
                'meta': <String, Object?>{},
              },
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedDiscipleshipRequest> requests = [];
}

class _RecordedDiscipleshipRequest {
  const _RecordedDiscipleshipRequest({
    required this.path,
    required this.authorization,
  });

  final String path;
  final String? authorization;
}

const _assignmentJson = {
  'id': 'assignment_1',
  'journeyId': 'journey_1',
  'assigneeName': 'Pastoral Team',
  'status': 'in_progress',
  'startedAt': '2026-06-01T00:00:00.000Z',
  'completedAt': null,
  'taskTotalCount': 2,
  'completedTaskCount': 1,
  'progress': [
    {
      'id': 'progress_1',
      'assignmentId': 'assignment_1',
      'taskId': 'task_1',
      'status': 'completed',
      'completedAt': '2026-06-02T00:00:00.000Z',
      'updatedAt': '2026-06-02T00:00:00.000Z',
    },
    {
      'id': 'progress_2',
      'assignmentId': 'assignment_1',
      'taskId': 'task_2',
      'status': 'available',
      'completedAt': null,
      'updatedAt': '2026-06-03T00:00:00.000Z',
    },
  ],
  'createdAt': '2026-06-01T00:00:00.000Z',
  'updatedAt': '2026-06-03T00:00:00.000Z',
};

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
