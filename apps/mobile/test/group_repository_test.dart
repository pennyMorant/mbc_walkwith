import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('anonymous group catalog uses the public API contract', () async {
    final dio = _GroupDio(responseData: _groupEnvelope);

    final groups = await _repository(dio).getGroups(null);

    expect(groups.single.name, 'Public Fellowship');
    expect(dio.requests.single.path, '/groups?limit=20');
    expect(dio.requests.single.authorization, isNull);
  });

  test('member group catalog sends the member bearer token', () async {
    final dio = _GroupDio(responseData: _groupEnvelope);

    final groups = await _repository(dio).getGroups(_memberSession);

    expect(groups.single.myApplicationId, 'application-1');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('group detail and Mine use their canonical contracts', () async {
    final detailDio = _GroupDio(
      responseData: const {'data': _groupJson, 'meta': <String, Object?>{}},
    );
    final group = await _repository(
      detailDio,
    ).getGroup('public fellowship', _memberSession);

    expect(group.id, 'public-fellowship');
    expect(detailDio.requests.single.path, '/groups/public%20fellowship');

    final mineDio = _GroupDio(responseData: _groupEnvelope);
    final mine = await _repository(mineDio).getMyGroups(_memberSession);

    expect(mine.single.myApplicationStatus, 'submitted');
    expect(mineDio.requests.single.path, '/me/groups');
  });

  test('application actions use group-owned intent routes', () async {
    final applyDio = _GroupDio(
      responseData: const {'data': <String, Object?>{}},
    );
    await _repository(applyDio).applyToGroup(
      'public fellowship',
      _memberSession,
      note: '  Please include me.  ',
    );

    expect(applyDio.requests.single.method, 'POST');
    expect(
      applyDio.requests.single.path,
      '/groups/public%20fellowship/applications',
    );
    expect(applyDio.requests.single.data, {'note': 'Please include me.'});

    final withdrawDio = _GroupDio(
      responseData: const {'data': <String, Object?>{}},
    );
    final group = await _repository(
      _GroupDio(
        responseData: const {'data': _groupJson, 'meta': <String, Object?>{}},
      ),
    ).getGroup('public-fellowship', _memberSession);
    await _repository(withdrawDio).withdrawApplication(group, _memberSession);

    expect(withdrawDio.requests.single.method, 'PATCH');
    expect(
      withdrawDio.requests.single.path,
      '/groups/public-fellowship/applications/application-1',
    );
    expect(withdrawDio.requests.single.data, {'status': 'withdrawn'});
  });

  test(
    'group catalog rejects malformed envelopes and impossible state',
    () async {
      final malformedEnvelope = _GroupDio(
        responseData: const {'data': <String, Object?>{}},
      );
      await expectLater(
        _repository(malformedEnvelope).getGroups(null),
        throwsA(isA<FormatException>()),
      );

      final invalidGroup = Map<String, Object?>.from(_groupJson)
        ..['memberCount'] = 25;
      final malformedState = _GroupDio(
        responseData: {
          'data': {
            'items': [invalidGroup],
          },
        },
      );
      await expectLater(
        _repository(malformedState).getGroups(null),
        throwsA(isA<FormatException>()),
      );
    },
  );

  test(
    'group catalog accepts an approved application after deactivation',
    () async {
      final inactiveMemberGroup = Map<String, Object?>.from(_groupJson)
        ..['myApplicationStatus'] = 'approved'
        ..['myMembershipStatus'] = 'inactive';
      final dio = _GroupDio(
        responseData: {
          'data': {
            'items': [inactiveMemberGroup],
          },
        },
      );

      final group = (await _repository(dio).getGroups(_memberSession)).single;

      expect(group.myApplicationStatus, 'approved');
      expect(group.myMembershipStatus, 'inactive');
      expect(group.isMember, isFalse);
    },
  );
}

ApiGroupRepository _repository(_GroupDio dio) {
  return ApiGroupRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
  );
}

class _GroupDio {
  _GroupDio({required this.responseData}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _GroupRequest(
              method: options.method,
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
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
  }

  final Object? responseData;
  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_GroupRequest> requests = [];
}

class _GroupRequest {
  const _GroupRequest({
    required this.method,
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String method;
  final String path;
  final String? authorization;
  final Object? data;
}

const _groupEnvelope = {
  'data': {
    'items': [_groupJson],
  },
  'meta': <String, Object?>{},
};

const _groupJson = <String, Object?>{
  'id': 'public-fellowship',
  'name': 'Public Fellowship',
  'description': 'A weekly Bible fellowship.',
  'meetingTime': 'Friday 7 PM',
  'location': 'Room 201',
  'leaderName': 'Leader Lee',
  'visibility': 'public',
  'status': 'active',
  'capacity': 20,
  'memberCount': 8,
  'myApplicationId': 'application-1',
  'myApplicationStatus': 'submitted',
  'myMembershipStatus': null,
  'createdAt': '2026-07-01T12:00:00.000Z',
  'updatedAt': '2026-07-02T12:00:00.000Z',
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
