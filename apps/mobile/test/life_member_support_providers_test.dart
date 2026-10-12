import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/care_repository.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/domain/serving_availability.dart';
import 'package:mbc_walkwith/features/life/domain/serving_check_in.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('ministry group provider surfaces repository failures', () async {
    final container = ProviderContainer.test(
      overrides: [
        memberSessionProvider.overrideWith((ref) => _memberSession),
        groupRepositoryProvider.overrideWithValue(_FailingGroupRepository()),
      ],
    );

    await expectLater(
      container.read(ministryGroupsProvider.future),
      throwsA(isA<StateError>()),
    );
  });

  test('course provider surfaces repository failures', () async {
    final container = ProviderContainer.test(
      overrides: [
        memberSessionProvider.overrideWith((ref) => _memberSession),
        courseRepositoryProvider.overrideWithValue(_FailingCourseRepository()),
      ],
    );

    await expectLater(
      container.read(coursesProvider.future),
      throwsA(isA<StateError>()),
    );
  });

  test('serving provider surfaces repository failures', () async {
    final container = ProviderContainer.test(
      overrides: [
        memberSessionProvider.overrideWith((ref) => _memberSession),
        servingRepositoryProvider.overrideWithValue(
          _FailingServingRepository(),
        ),
      ],
    );

    await expectLater(
      container.read(servingAssignmentsProvider.future),
      throwsA(isA<StateError>()),
    );
  });

  test('care provider surfaces repository failures', () async {
    final container = ProviderContainer.test(
      overrides: [
        memberSessionProvider.overrideWith((ref) => _memberSession),
        careRepositoryProvider.overrideWithValue(_FailingCareRepository()),
      ],
    );

    await expectLater(
      container.read(careRequestsProvider.future),
      throwsA(isA<StateError>()),
    );
  });
}

class _FailingGroupRepository implements GroupRepository {
  @override
  Future<List<MinistryGroup>> getGroups(MemberSession? session) async {
    throw StateError('group list failed');
  }

  @override
  Future<MinistryGroup> getGroup(
    String groupId,
    MemberSession? session,
  ) async => throw StateError('group detail failed');

  @override
  Future<List<MinistryGroup>> getMyGroups(MemberSession session) async {
    throw StateError('my groups failed');
  }

  @override
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  }) async {}

  @override
  Future<void> withdrawApplication(
    MinistryGroup group,
    MemberSession session,
  ) async {}
}

class _FailingCourseRepository implements CourseRepository {
  @override
  Future<List<CourseLearning>> getCourses(MemberSession? session) async {
    throw StateError('course list failed');
  }

  @override
  Future<CourseLearning> getCourse(
    String courseId,
    MemberSession? session,
  ) async {
    throw StateError('course detail failed');
  }

  @override
  Future<List<CourseLearning>> getMyCourses(MemberSession session) async {
    throw StateError('my courses failed');
  }

  @override
  Future<void> enroll(
    String courseId,
    MemberSession session, {
    String? note,
  }) async {}
}

class _FailingServingRepository implements ServingRepository {
  @override
  Future<List<ServingAssignment>> getAssignments(MemberSession session) async {
    throw StateError('serving list failed');
  }

  @override
  Future<ServingAssignment> confirm(
    String assignmentId,
    MemberSession session,
  ) async => throw StateError('serving confirm failed');

  @override
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  ) async => throw StateError('serving leave failed');

  @override
  Future<List<ServingAvailability>> getAvailability(
    MemberSession session,
  ) async => throw StateError('serving availability failed');

  @override
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session) async =>
      throw StateError('serving check-ins failed');

  @override
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  ) async => throw StateError('serving availability create failed');

  @override
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  }) async => throw StateError('serving check-in failed');
}

class _FailingCareRepository implements CareRepository {
  @override
  Future<List<CareRequest>> fetchMine(MemberSession session) async {
    throw StateError('care list failed');
  }

  @override
  Future<CareRequest> submitRequest({
    required MemberSession session,
    required String title,
    required String body,
    required String privacyLevel,
  }) async {
    throw StateError('care submit failed');
  }
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
