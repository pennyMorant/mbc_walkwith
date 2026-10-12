import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/domain/prayer_request.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/domain/serving_availability.dart';
import 'package:mbc_walkwith/features/life/domain/serving_check_in.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/care_request_section.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/course_learning_section.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/ministry_group_section.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/prayer_request_section.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/serving_assignment_section.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('life member sections show explicit empty states', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: Column(
          children: const [
            MinistryGroupSection(
              groupsAsync: AsyncData<List<MinistryGroup>>([]),
              memberSession: _memberSession,
            ),
            CourseLearningSection(
              coursesAsync: AsyncData<List<CourseLearning>>([]),
              memberSession: _memberSession,
            ),
            ServingAssignmentSection(
              assignmentsAsync: AsyncData<List<ServingAssignment>>([]),
              memberSession: _memberSession,
            ),
          ],
        ),
      ),
    );

    expect(
      find.text('No groups or fellowships are available right now.'),
      findsOneWidget,
    );
    expect(find.text('No courses are open right now.'), findsOneWidget);
    expect(
      find.text('No serving assignments are scheduled right now.'),
      findsOneWidget,
    );
  });

  testWidgets('life member sections show retryable error states', (
    tester,
  ) async {
    final error = StateError('failed');

    await tester.pumpWidget(
      _localizedApp(
        child: Column(
          children: [
            MinistryGroupSection(
              groupsAsync: AsyncError<List<MinistryGroup>>(
                error,
                StackTrace.empty,
              ),
              memberSession: _memberSession,
            ),
            CourseLearningSection(
              coursesAsync: AsyncError<List<CourseLearning>>(
                error,
                StackTrace.empty,
              ),
              memberSession: _memberSession,
            ),
            ServingAssignmentSection(
              assignmentsAsync: AsyncError<List<ServingAssignment>>(
                error,
                StackTrace.empty,
              ),
              memberSession: _memberSession,
            ),
            PrayerRequestSection(
              publicPrayerRequestsAsync: AsyncError<List<PrayerRequest>>(
                error,
                StackTrace.empty,
              ),
              memberPrayerRequestsAsync: AsyncError<List<PrayerRequest>>(
                error,
                StackTrace.empty,
              ),
              memberSession: _memberSession,
            ),
            CareRequestSection(
              requestsAsync: AsyncError<List<CareRequest>>(
                error,
                StackTrace.empty,
              ),
            ),
          ],
        ),
      ),
    );

    expect(
      find.text('This section could not be loaded. Please try again.'),
      findsNWidgets(5),
    );
    expect(find.text('Retry'), findsNWidgets(5));
  });

  testWidgets('life member action errors use user-facing API messages', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          groupRepositoryProvider.overrideWithValue(_FailingGroupRepository()),
          courseRepositoryProvider.overrideWithValue(
            _FailingCourseRepository(),
          ),
          servingRepositoryProvider.overrideWithValue(
            _FailingServingRepository(),
          ),
        ],
        child: Column(
          children: [
            MinistryGroupSection(
              groupsAsync: const AsyncData<List<MinistryGroup>>([_openGroup]),
              memberSession: _memberSession,
            ),
            CourseLearningSection(
              coursesAsync: const AsyncData<List<CourseLearning>>([
                _openCourse,
              ]),
              memberSession: _memberSession,
            ),
            ServingAssignmentSection(
              assignmentsAsync: AsyncData<List<ServingAssignment>>([
                _scheduledAssignment,
              ]),
              memberSession: _memberSession,
            ),
          ],
        ),
      ),
    );

    await tester.tap(find.text('Apply to join'));
    await tester.pump();
    expect(find.text(_friendlyFailure), findsOneWidget);
    expect(find.textContaining('ApiError'), findsNothing);

    ScaffoldMessenger.of(
      tester.element(find.text(_friendlyFailure)),
    ).hideCurrentSnackBar();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Enroll'));
    await tester.pump();
    expect(find.text(_friendlyFailure), findsOneWidget);
    expect(find.textContaining('ApiError'), findsNothing);

    ScaffoldMessenger.of(
      tester.element(find.text(_friendlyFailure)),
    ).hideCurrentSnackBar();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Confirm'));
    await tester.pump();
    expect(find.text(_friendlyFailure), findsOneWidget);
    expect(find.textContaining('ApiError'), findsNothing);
  });
}

Widget _localizedApp({
  required Widget child,
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: Scaffold(body: SingleChildScrollView(child: child)),
    ),
  );
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

const _friendlyFailure = 'Friendly failure.';

const _apiFailure = ApiError(message: _friendlyFailure);

const _openGroup = MinistryGroup(
  id: 'group-1',
  name: 'Friday Fellowship',
  description: 'Weekly fellowship.',
  meetingTime: 'Friday 7 PM',
  location: 'Room 201',
  leaderName: 'Leader',
  visibility: 'members',
  status: 'active',
  capacity: null,
  memberCount: 8,
  myApplicationId: null,
  myApplicationStatus: null,
  myMembershipStatus: null,
);

const _openCourse = CourseLearning(
  id: 'course-1',
  title: 'Foundations',
  description: 'Member class.',
  teacherName: 'Pastor',
  location: 'Room 101',
  scheduleText: 'Sunday',
  visibility: 'members',
  status: 'open',
  capacity: null,
  enrolledCount: 5,
  lessonCount: 4,
  myEnrollmentStatus: null,
  myCompletedLessonCount: 0,
  lessons: [],
);

final _scheduledAssignment = ServingAssignment(
  id: 'serving-1',
  teamName: 'Hospitality',
  roleName: 'Usher',
  title: 'Sunday usher',
  startsAt: DateTime.utc(2026, 7, 5, 16),
  endsAt: null,
  location: 'Sanctuary',
  status: 'scheduled',
  note: '',
  responseNote: '',
);

class _FailingGroupRepository implements GroupRepository {
  @override
  Future<List<MinistryGroup>> getGroups(MemberSession? session) async {
    return const [_openGroup];
  }

  @override
  Future<MinistryGroup> getGroup(
    String groupId,
    MemberSession? session,
  ) async => _openGroup;

  @override
  Future<List<MinistryGroup>> getMyGroups(MemberSession session) async {
    return const [_openGroup];
  }

  @override
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  }) async {
    throw _apiFailure;
  }

  @override
  Future<void> withdrawApplication(
    MinistryGroup group,
    MemberSession session,
  ) async {
    throw _apiFailure;
  }
}

class _FailingCourseRepository implements CourseRepository {
  @override
  Future<List<CourseLearning>> getCourses(MemberSession? session) async {
    return const [_openCourse];
  }

  @override
  Future<CourseLearning> getCourse(
    String courseId,
    MemberSession? session,
  ) async {
    return _openCourse;
  }

  @override
  Future<List<CourseLearning>> getMyCourses(MemberSession session) async {
    return const [_openCourse];
  }

  @override
  Future<void> enroll(
    String courseId,
    MemberSession session, {
    String? note,
  }) async {
    throw _apiFailure;
  }
}

class _FailingServingRepository implements ServingRepository {
  @override
  Future<List<ServingAssignment>> getAssignments(MemberSession session) async {
    return [_scheduledAssignment];
  }

  @override
  Future<ServingAssignment> confirm(
    String assignmentId,
    MemberSession session,
  ) async {
    throw _apiFailure;
  }

  @override
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  ) async {
    throw _apiFailure;
  }

  @override
  Future<List<ServingAvailability>> getAvailability(
    MemberSession session,
  ) async => const [];

  @override
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session) async =>
      const [];

  @override
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  ) async => throw _apiFailure;

  @override
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  }) async => throw _apiFailure;
}
