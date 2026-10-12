import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_tab_views.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('guest course tab keeps public catalog visible', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: const Scaffold(
          body: LifeCoursesTabView(
            posts: [],
            coursesAsync: AsyncData([_publicCourse]),
            memberSession: null,
            showUnreadBadges: false,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Optional sign in'), findsOneWidget);
    expect(find.text('Public Foundations'), findsOneWidget);
    final enrollButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Enroll'),
    );
    expect(enrollButton.onPressed, isNull);
  });
}

const _publicCourse = CourseLearning(
  id: 'public-foundations',
  title: 'Public Foundations',
  description: 'An introduction to Christian faith.',
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
  lessons: [
    CourseLesson(
      id: 'lesson-1',
      courseId: 'public-foundations',
      title: 'Gospel and Grace',
      description: 'The heart of the Christian faith.',
      startsAt: null,
      status: 'published',
      sortOrder: 1,
    ),
  ],
);
