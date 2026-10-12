import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/presentation/course_detail_page.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/my_courses_page.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('course detail shows public content and lesson summaries', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => null),
          courseByIdProvider.overrideWith((ref, courseId) async {
            expect(courseId, _publicCourse.id);
            return _publicCourse;
          }),
        ],
        child: const CourseDetailPage(courseId: 'course-1'),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Foundations'), findsOneWidget);
    expect(find.text('Course lessons'), findsOneWidget);
    expect(find.text('1. Gospel and Grace'), findsOneWidget);
    expect(
      find.text(
        'Sign in to enroll and keep your course progress across devices.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('my courses renders canonical member enrollment history', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          myCoursesProvider.overrideWith(
            (ref) async => const [_enrolledCourse],
          ),
        ],
        child: const MyCoursesPage(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('My courses'), findsOneWidget);
    expect(find.text('Foundations'), findsOneWidget);
    expect(find.text('1/1 lessons completed'), findsOneWidget);
  });

  testWidgets('my courses asks a guest to sign in', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [memberSessionProvider.overrideWith((ref) async => null)],
        child: const MyCoursesPage(),
      ),
    );

    await tester.pumpAndSettle();

    expect(
      find.text('Sign in to view your current and completed courses.'),
      findsOneWidget,
    );
    expect(find.text('Sign in'), findsOneWidget);
  });
}

Widget _localizedApp({
  required Widget child,
  required List<Override> overrides,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: child,
    ),
  );
}

const _publicCourse = CourseLearning(
  id: 'course-1',
  title: 'Foundations',
  description: 'A class for new believers.',
  teacherName: 'Pastor Lee',
  location: 'Room 201',
  scheduleText: 'Sundays 10 AM',
  visibility: 'public',
  status: 'open',
  capacity: 20,
  enrolledCount: 1,
  lessonCount: 1,
  myEnrollmentStatus: null,
  myCompletedLessonCount: 0,
  lessons: _lessons,
);

const _enrolledCourse = CourseLearning(
  id: 'course-1',
  title: 'Foundations',
  description: 'A class for new believers.',
  teacherName: 'Pastor Lee',
  location: 'Room 201',
  scheduleText: 'Sundays 10 AM',
  visibility: 'public',
  status: 'open',
  capacity: 20,
  enrolledCount: 1,
  lessonCount: 1,
  myEnrollmentStatus: 'enrolled',
  myCompletedLessonCount: 1,
  lessons: _lessons,
);

const _lessons = [
  CourseLesson(
    id: 'lesson-1',
    courseId: 'course-1',
    title: 'Gospel and Grace',
    description: 'The heart of the Christian faith.',
    startsAt: null,
    status: 'published',
    sortOrder: 1,
  ),
];

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
