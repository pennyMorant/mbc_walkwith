import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/course_learning.dart';
import 'dto/course_learning_dto.dart';

final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockCourseRepository();
  }
  return ApiCourseRepository(apiClient: ref.watch(apiClientProvider));
});

final coursesProvider = FutureProvider<List<CourseLearning>>((ref) async {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  return ref.watch(courseRepositoryProvider).getCourses(session);
});

final courseByIdProvider = FutureProvider.family<CourseLearning, String>((
  ref,
  courseId,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  return ref.watch(courseRepositoryProvider).getCourse(courseId, session);
});

final myCoursesProvider = FutureProvider<List<CourseLearning>>((ref) async {
  final session = await ref.watch(memberSessionProvider.future);
  if (session == null) {
    return const [];
  }
  return ref.watch(courseRepositoryProvider).getMyCourses(session);
});

abstract class CourseRepository {
  Future<List<CourseLearning>> getCourses(MemberSession? session);
  Future<CourseLearning> getCourse(String courseId, MemberSession? session);
  Future<List<CourseLearning>> getMyCourses(MemberSession session);
  Future<void> enroll(String courseId, MemberSession session, {String? note});
}

class ApiCourseRepository implements CourseRepository {
  const ApiCourseRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<CourseLearning>> getCourses(MemberSession? session) async {
    final response = session == null
        ? await apiClient.getJsonMap('/courses?limit=20')
        : await apiClient.getJsonMapWithBearer(
            '/courses?limit=20',
            session.accessToken,
          );
    return _courseListFromEnvelope(response);
  }

  @override
  Future<CourseLearning> getCourse(
    String courseId,
    MemberSession? session,
  ) async {
    final encodedCourseId = Uri.encodeComponent(courseId);
    final response = session == null
        ? await apiClient.getJsonMap('/courses/$encodedCourseId')
        : await apiClient.getJsonMapWithBearer(
            '/courses/$encodedCourseId',
            session.accessToken,
          );
    return _courseFromEnvelope(response);
  }

  @override
  Future<List<CourseLearning>> getMyCourses(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/courses',
      session.accessToken,
    );
    return _courseListFromEnvelope(response);
  }

  @override
  Future<void> enroll(
    String courseId,
    MemberSession session, {
    String? note,
  }) async {
    final encodedCourseId = Uri.encodeComponent(courseId);
    await apiClient.postJsonMapWithBearer(
      '/courses/$encodedCourseId/enrollments',
      {if (note != null && note.trim().isNotEmpty) 'note': note.trim()},
      session.accessToken,
    );
  }
}

class MockCourseRepository implements CourseRepository {
  final Set<String> _enrolledCourses = <String>{};

  @override
  Future<List<CourseLearning>> getCourses(MemberSession? session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return [_mockCourse()];
  }

  @override
  Future<CourseLearning> getCourse(
    String courseId,
    MemberSession? session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    if (courseId != 'foundations-course') {
      throw StateError('Course not found.');
    }
    return _mockCourse();
  }

  @override
  Future<List<CourseLearning>> getMyCourses(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return _enrolledCourses.contains('foundations-course')
        ? [_mockCourse()]
        : const [];
  }

  @override
  Future<void> enroll(
    String courseId,
    MemberSession session, {
    String? note,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _enrolledCourses.add(courseId);
  }

  CourseLearning _mockCourse() {
    final enrolled = _enrolledCourses.contains('foundations-course');
    return CourseLearning(
      id: 'foundations-course',
      title: 'Foundations of Faith',
      description: 'A four-week class for new believers and new members.',
      teacherName: 'Pastor Lee',
      location: 'Room 201',
      scheduleText: 'Sundays 10:00 AM',
      visibility: 'public',
      status: 'open',
      capacity: 24,
      enrolledCount: enrolled ? 1 : 0,
      lessonCount: 1,
      myEnrollmentStatus: enrolled ? 'enrolled' : null,
      myCompletedLessonCount: 0,
      lessons: const [
        CourseLesson(
          id: 'foundations-lesson-1',
          courseId: 'foundations-course',
          title: 'Gospel and Grace',
          description: 'The heart of the Christian faith.',
          startsAt: null,
          status: 'published',
          sortOrder: 1,
        ),
      ],
    );
  }
}

List<CourseLearning> _courseListFromEnvelope(Map<String, Object?> response) {
  final data = _courseDataFromEnvelope(response);
  final items = data['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException(
      'Course response items must be an object list.',
    );
  }
  return items
      .cast<Map<String, Object?>>()
      .map(CourseLearningDto.fromJson)
      .map((course) => course.toDomain())
      .toList(growable: false);
}

CourseLearning _courseFromEnvelope(Map<String, Object?> response) {
  return CourseLearningDto.fromJson(
    _courseDataFromEnvelope(response),
  ).toDomain();
}

Map<String, Object?> _courseDataFromEnvelope(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Course response data must be an object.');
  }
  return data;
}
