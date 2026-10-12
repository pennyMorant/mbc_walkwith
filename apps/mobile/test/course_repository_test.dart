import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('anonymous course catalog uses the public API contract', () async {
    final dio = _CourseDio(responseData: _courseEnvelope);
    final courses = await _repository(dio).getCourses(null);

    expect(courses.single.title, 'Public Foundations');
    expect(courses.single.lessons.single.title, 'Gospel and Grace');
    expect(dio.requests.single.path, '/courses?limit=20');
    expect(dio.requests.single.authorization, isNull);
  });

  test('member course catalog sends the member bearer token', () async {
    final dio = _CourseDio(responseData: _courseEnvelope);
    final courses = await _repository(dio).getCourses(_memberSession);

    expect(courses.single.myEnrollmentStatus, 'enrolled');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('anonymous course detail uses the public detail contract', () async {
    final dio = _CourseDio(
      responseData: const {'data': _courseJson, 'meta': <String, Object?>{}},
    );

    final course = await _repository(dio).getCourse('public-foundations', null);

    expect(course.id, 'public-foundations');
    expect(dio.requests.single.path, '/courses/public-foundations');
    expect(dio.requests.single.authorization, isNull);
  });

  test('member course detail sends the member bearer token', () async {
    final dio = _CourseDio(
      responseData: const {'data': _courseJson, 'meta': <String, Object?>{}},
    );

    final course = await _repository(
      dio,
    ).getCourse('public-foundations', _memberSession);

    expect(course.myEnrollmentStatus, 'enrolled');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('my courses uses the canonical member enrollment contract', () async {
    final dio = _CourseDio(responseData: _courseEnvelope);

    final courses = await _repository(dio).getMyCourses(_memberSession);

    expect(courses.single.id, 'public-foundations');
    expect(dio.requests.single.path, '/me/courses');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('course catalog rejects a malformed response envelope', () async {
    final dio = _CourseDio(
      responseData: const {
        'data': <String, Object?>{},
        'meta': <String, Object?>{},
      },
    );

    await expectLater(
      _repository(dio).getCourses(null),
      throwsA(isA<FormatException>()),
    );
  });

  test('course catalog rejects malformed course state', () async {
    final malformed = Map<String, Object?>.from(_courseJson)
      ..['lessonCount'] = 2;
    final dio = _CourseDio(
      responseData: {
        'data': {
          'items': [malformed],
        },
        'meta': <String, Object?>{},
      },
    );

    await expectLater(
      _repository(dio).getCourses(null),
      throwsA(isA<FormatException>()),
    );
  });

  test('course catalog rejects progress on a cancelled enrollment', () async {
    final malformed = Map<String, Object?>.from(_courseJson)
      ..['myEnrollmentStatus'] = 'cancelled'
      ..['myCompletedLessonCount'] = 1;
    final dio = _CourseDio(
      responseData: {
        'data': {
          'items': [malformed],
        },
        'meta': <String, Object?>{},
      },
    );

    await expectLater(
      _repository(dio).getCourses(_memberSession),
      throwsA(isA<FormatException>()),
    );
  });

  test('course catalog rejects a negative lesson sort order', () async {
    final malformedLesson = Map<String, Object?>.from(
      (_courseJson['lessons']! as List<Object?>).single!
          as Map<String, Object?>,
    )..['sortOrder'] = -1;
    final malformed = Map<String, Object?>.from(_courseJson)
      ..['lessons'] = [malformedLesson];
    final dio = _CourseDio(
      responseData: {
        'data': {
          'items': [malformed],
        },
        'meta': <String, Object?>{},
      },
    );

    await expectLater(
      _repository(dio).getCourses(null),
      throwsA(isA<FormatException>()),
    );
  });

  test('course detail rejects a malformed response envelope', () async {
    final dio = _CourseDio(
      responseData: const {
        'data': <String, Object?>{},
        'meta': <String, Object?>{},
      },
    );

    await expectLater(
      _repository(dio).getCourse('public-foundations', null),
      throwsA(isA<FormatException>()),
    );
  });
}

ApiCourseRepository _repository(_CourseDio dio) {
  return ApiCourseRepository(
    apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
  );
}

class _CourseDio {
  _CourseDio({required this.responseData}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _CourseRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
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
  final List<_CourseRequest> requests = [];
}

class _CourseRequest {
  const _CourseRequest({required this.path, required this.authorization});

  final String path;
  final String? authorization;
}

const _courseEnvelope = {
  'data': {
    'items': [_courseJson],
  },
  'meta': <String, Object?>{},
};

const _courseJson = <String, Object?>{
  'id': 'public-foundations',
  'title': 'Public Foundations',
  'description': 'An introduction to Christian faith.',
  'teacherName': 'Pastor Lee',
  'location': 'Room 201',
  'scheduleText': 'Sundays 10 AM',
  'visibility': 'public',
  'status': 'open',
  'capacity': 20,
  'enrolledCount': 1,
  'lessonCount': 1,
  'myEnrollmentStatus': 'enrolled',
  'myCompletedLessonCount': 0,
  'createdAt': '2026-07-01T12:00:00.000Z',
  'updatedAt': '2026-07-02T12:00:00.000Z',
  'lessons': [
    {
      'id': 'lesson-1',
      'courseId': 'public-foundations',
      'title': 'Gospel and Grace',
      'description': 'The heart of the Christian faith.',
      'startsAt': '2026-07-05T17:00:00.000Z',
      'status': 'published',
      'sortOrder': 1,
      'createdAt': '2026-07-01T12:00:00.000Z',
      'updatedAt': '2026-07-02T12:00:00.000Z',
    },
  ],
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
