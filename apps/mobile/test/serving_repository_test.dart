import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/domain/serving_availability.dart';
import 'package:mbc_walkwith/features/life/domain/serving_check_in.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('serving repository reads member-owned canonical collections', () async {
    final dio = _ServingDio({
      '/me/serving-assignments': _listEnvelope(_assignmentJson),
      '/me/serving-availability': _listEnvelope(_availabilityJson),
      '/me/serving-check-ins': _listEnvelope(_checkInJson),
    });
    final repository = _repository(dio);

    final assignments = await repository.getAssignments(_memberSession);
    final availability = await repository.getAvailability(_memberSession);
    final checkIns = await repository.getCheckIns(_memberSession);

    expect(assignments.single.status, 'scheduled');
    expect(availability.single.status, 'preferred');
    expect(checkIns.single.assignmentId, 'assignment-1');
    expect(dio.requests.map((request) => request.path), [
      '/me/serving-assignments',
      '/me/serving-availability',
      '/me/serving-check-ins',
    ]);
    expect(
      dio.requests.every(
        (request) => request.authorization == 'Bearer member-token',
      ),
      isTrue,
    );
  });

  test(
    'serving repository submits typed intents and maps canonical state',
    () async {
      final confirmed = {..._assignmentJson, 'status': 'confirmed'};
      final declined = {..._assignmentJson, 'status': 'declined'};
      final dio = _ServingDio({
        '/serving-assignments/assignment%2Fone/confirm': _dataEnvelope(
          confirmed,
        ),
        '/serving-assignments/assignment%2Fone/leave-request': _dataEnvelope(
          declined,
        ),
        '/me/serving-availability': _dataEnvelope(_availabilityJson),
        '/serving-assignments/assignment%2Fone/check-in': _dataEnvelope(
          _checkInJson,
        ),
      });
      final repository = _repository(dio);

      expect(
        (await repository.confirm('assignment/one', _memberSession)).status,
        'confirmed',
      );
      expect(
        (await repository.requestLeave(
          'assignment/one',
          _memberSession,
        )).status,
        'declined',
      );
      await repository.createAvailability(
        ServingAvailabilityDraft(
          startsAt: DateTime.parse('2026-07-12T09:00:00-07:00'),
          endsAt: DateTime.parse('2026-07-12T11:00:00-07:00'),
          status: 'preferred',
          note: '  Morning preferred.  ',
        ),
        _memberSession,
      );
      await repository.checkIn(
        'assignment/one',
        _memberSession,
        note: '  At the sanctuary.  ',
      );

      expect(dio.requests[2].data, {
        'startsAt': '2026-07-12T16:00:00.000Z',
        'endsAt': '2026-07-12T18:00:00.000Z',
        'status': 'preferred',
        'note': 'Morning preferred.',
      });
      expect(dio.requests[3].data, {
        'status': 'checked_in',
        'note': 'At the sanctuary.',
      });
    },
  );

  test('serving repository rejects malformed or impossible state', () async {
    await expectLater(
      _repository(
        _ServingDio({
          '/me/serving-assignments': const {'data': <String, Object?>{}},
        }),
      ).getAssignments(_memberSession),
      throwsA(isA<FormatException>()),
    );

    await expectLater(
      _repository(
        _ServingDio({
          '/me/serving-assignments': _listEnvelope({
            ..._assignmentJson,
            'status': 'unknown',
          }),
        }),
      ).getAssignments(_memberSession),
      throwsA(isA<FormatException>()),
    );

    await expectLater(
      _repository(
        _ServingDio({
          '/me/serving-availability': _listEnvelope({
            ..._availabilityJson,
            'endsAt': '2026-07-12T14:00:00.000Z',
          }),
        }),
      ).getAvailability(_memberSession),
      throwsA(isA<FormatException>()),
    );

    await expectLater(
      _repository(
        _ServingDio({
          '/me/serving-check-ins': _listEnvelope({
            ..._checkInJson,
            'checkedInAt': null,
          }),
        }),
      ).getCheckIns(_memberSession),
      throwsA(isA<FormatException>()),
    );
  });

  test('serving domain exposes member action eligibility', () {
    final scheduled = _assignment(status: 'scheduled');
    final confirmed = _assignment(status: 'confirmed');
    final cancelled = _assignment(status: 'cancelled');

    expect(scheduled.canConfirm, isTrue);
    expect(scheduled.canRequestLeave, isTrue);
    expect(scheduled.canCheckIn, isTrue);
    expect(confirmed.canCheckIn, isTrue);
    expect(cancelled.canCheckIn, isFalse);
    expect(_checkIn(status: 'pending').canMemberCheckIn, isTrue);
    expect(_checkIn(status: 'missed').canMemberCheckIn, isFalse);
  });
}

ServingAssignment _assignment({required String status}) {
  return ServingAssignment(
    id: 'assignment-1',
    teamName: 'Hospitality',
    roleName: 'Usher',
    title: 'Sunday usher',
    startsAt: DateTime.utc(2026, 7, 12, 16),
    endsAt: DateTime.utc(2026, 7, 12, 18),
    location: 'Sanctuary',
    status: status,
    note: '',
    responseNote: '',
  );
}

ServingCheckIn _checkIn({required String status}) {
  return ServingCheckIn(
    id: 'check-in-1',
    assignmentId: 'assignment-1',
    status: status,
    checkedInAt: status == 'checked_in'
        ? DateTime.utc(2026, 7, 12, 15, 55)
        : null,
    note: '',
  );
}

ApiServingRepository _repository(_ServingDio dio) {
  return ApiServingRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
  );
}

class _ServingDio {
  _ServingDio(this.responses) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _ServingRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: responses[options.path],
            ),
          );
        },
      ),
    );
  }

  final Map<String, Object?> responses;
  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_ServingRequest> requests = [];
}

class _ServingRequest {
  const _ServingRequest({
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String path;
  final String? authorization;
  final Object? data;
}

Map<String, Object?> _listEnvelope(Map<String, Object?> item) {
  return {
    'data': {
      'items': [item],
    },
    'meta': <String, Object?>{},
  };
}

Map<String, Object?> _dataEnvelope(Map<String, Object?> item) {
  return {'data': item, 'meta': <String, Object?>{}};
}

const _assignmentJson = <String, Object?>{
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

const _availabilityJson = <String, Object?>{
  'id': 'availability-1',
  'userId': 'member-1',
  'startsAt': '2026-07-12T15:00:00.000Z',
  'endsAt': '2026-07-12T19:00:00.000Z',
  'status': 'preferred',
  'note': 'Morning preferred.',
  'createdAt': '2026-07-01T12:00:00.000Z',
  'updatedAt': '2026-07-01T12:00:00.000Z',
};

const _checkInJson = <String, Object?>{
  'id': 'check-in-1',
  'assignmentId': 'assignment-1',
  'userId': 'member-1',
  'status': 'checked_in',
  'checkedInAt': '2026-07-12T15:55:00.000Z',
  'note': '',
  'createdAt': '2026-07-12T15:55:00.000Z',
  'updatedAt': '2026-07-12T15:55:00.000Z',
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
