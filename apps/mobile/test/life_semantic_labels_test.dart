import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/discipleship/data/discipleship_repository.dart';
import 'package:mbc_walkwith/features/discipleship/domain/discipleship_assignment.dart';
import 'package:mbc_walkwith/features/discipleship/presentation/widgets/mine_discipleship_card.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/course_learning_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_post_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('course card does not present unknown statuses as enrollment', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: CourseLearningCard(
          course: _unknownCourse,
          isSubmitting: false,
          onEnroll: () {},
        ),
      ),
    );

    expect(find.text('Unknown status'), findsNWidgets(2));
    expect(find.text('Enroll'), findsNothing);
    expect(find.text('requires_review'), findsNothing);
  });

  testWidgets('discipleship card does not display raw unknown statuses', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          myDiscipleshipAssignmentsProvider.overrideWith(
            (ref) async => [_unknownDiscipleshipAssignment],
          ),
        ],
        child: _localizedApp(child: const MineDiscipleshipCard()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Unknown status'), findsOneWidget);
    expect(find.text('requires_review'), findsNothing);
  });

  testWidgets('life post visibility labels distinguish public and unknown', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        child: _localizedApp(
          child: ListView(
            children: const [
              LifePostCard(post: _publicPost),
              LifePostCard(post: _unknownVisibilityPost),
            ],
          ),
        ),
      ),
    );

    expect(find.text('Unknown visibility'), findsOneWidget);
    expect(find.text('Private'), findsNothing);
    expect(find.text('Members'), findsNothing);
    expect(find.text('Group'), findsNothing);
  });
}

Widget _localizedApp({required Widget child}) {
  return MaterialApp(
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(body: child),
  );
}

const _unknownCourse = CourseLearning(
  id: 'course_unknown_status',
  title: 'Foundations',
  description: 'Member class.',
  teacherName: 'Pastor',
  location: 'Room 101',
  scheduleText: 'Sunday',
  visibility: 'members',
  status: 'requires_review',
  capacity: null,
  enrolledCount: 0,
  lessonCount: 4,
  myEnrollmentStatus: 'requires_review',
  myCompletedLessonCount: 0,
  lessons: [],
);

final _unknownDiscipleshipAssignment = DiscipleshipAssignment(
  id: 'discipleship_unknown_status',
  journeyId: 'foundations_path',
  assigneeName: 'Pastoral Team',
  status: 'requires_review',
  startedAt: null,
  completedAt: null,
  taskTotalCount: 2,
  completedTaskCount: 0,
  progress: const [],
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

const _publicPost = LifePost(
  id: 'life_public_visibility',
  type: 'announcement',
  title: 'Church update',
  body: 'Welcome to worship.',
  meta: '',
  iconName: 'church',
  visibility: 'public',
);

const _unknownVisibilityPost = LifePost(
  id: 'life_unknown_visibility',
  type: 'announcement',
  title: 'Care team update',
  body: 'Please read this update.',
  meta: '',
  iconName: 'church',
  visibility: 'regional',
);
