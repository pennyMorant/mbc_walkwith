import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('member support action repositories encode path ids', () async {
    final dio = _RecordingDio();
    final apiClient = ApiClient(config: _testAppConfig, dio: dio.instance);

    await ApiGroupRepository(
      apiClient: apiClient,
    ).applyToGroup('group/alpha one', _memberSession, note: '  hello  ');
    await ApiCourseRepository(
      apiClient: apiClient,
    ).enroll('course/beta one', _memberSession);
    await ApiServingRepository(
      apiClient: apiClient,
    ).confirm('assignment/gamma one', _memberSession);
    await ApiServingRepository(
      apiClient: apiClient,
    ).requestLeave('assignment/gamma one', _memberSession);

    expect(dio.requests.map((request) => request.path), [
      '/groups/group%2Falpha%20one/applications',
      '/courses/course%2Fbeta%20one/enrollments',
      '/serving-assignments/assignment%2Fgamma%20one/confirm',
      '/serving-assignments/assignment%2Fgamma%20one/leave-request',
    ]);
    expect(
      dio.requests.every(
        (request) => request.authorization == 'Bearer member-token',
      ),
      isTrue,
    );
    expect(dio.requests.first.data, {'note': 'hello'});
  });
}

class _RecordingDio {
  _RecordingDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: options.path.startsWith('/serving-assignments/')
                  ? const {'data': _servingAssignmentJson, 'meta': {}}
                  : const {'data': <String, Object?>{}, 'meta': {}},
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedRequest> requests = [];
}

class _RecordedRequest {
  const _RecordedRequest({
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String path;
  final String? authorization;
  final Object? data;
}

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

const _servingAssignmentJson = <String, Object?>{
  'id': 'assignment-1',
  'teamId': 'team-1',
  'teamName': 'Hospitality',
  'roleId': 'role-1',
  'roleName': 'Usher',
  'userId': 'member-1',
  'memberDisplayName': 'Member',
  'memberEmail': 'member@example.com',
  'title': 'Sunday usher',
  'startsAt': '2026-07-12T16:00:00.000Z',
  'endsAt': '2026-07-12T18:00:00.000Z',
  'location': 'Sanctuary',
  'status': 'scheduled',
  'note': '',
  'responseNote': '',
  'createdAt': '2026-07-01T12:00:00.000Z',
  'updatedAt': '2026-07-01T12:00:00.000Z',
};
