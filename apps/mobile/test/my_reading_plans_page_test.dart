import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/my_reading_plans_page.dart';
import 'package:mbc_walkwith/features/study/data/reading_plan_repository.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('switches between current plans and immutable history', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [_assignment(title: 'Current plan')],
          ),
          readingPlanHistoryProvider.overrideWith(
            (ref) async => ReadingPlanAssignmentPage(
              items: [
                _assignment(
                  title: 'Completed plan',
                  status: 'completed',
                  attemptNumber: 2,
                ),
              ],
            ),
          ),
          readingPlanAssignmentDetailProvider.overrideWith(
            (ref, assignmentId) async => ReadingPlanAssignmentDetail(
              assignment: _assignment(
                title: 'Completed plan',
                status: 'completed',
                attemptNumber: 2,
              ),
              days: const [],
              canRestart: false,
            ),
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const MyReadingPlansPage(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Current plan'), findsOneWidget);
    expect(find.text('Completed plan'), findsNothing);

    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();

    expect(find.text('Current plan'), findsNothing);
    expect(find.text('Completed plan'), findsOneWidget);
    expect(find.text('Attempt 2'), findsOneWidget);
    expect(find.text('Completed'), findsOneWidget);

    await tester.tap(find.text('Completed plan'));
    await tester.pumpAndSettle();

    expect(find.text('Start again'), findsNothing);
  });
}

ReadingPlanAssignment _assignment({
  required String title,
  String status = 'active',
  int attemptNumber = 1,
}) {
  final endedAt = status == 'completed' ? DateTime.utc(2026, 9, 7) : null;
  return ReadingPlanAssignment(
    id: '$status-$attemptNumber',
    planId: 'plan-1',
    planTitle: title,
    planDurationDays: 7,
    attemptNumber: attemptNumber,
    userType: 'external',
    userId: 'ext-test',
    sourceType: 'self',
    sourceId: null,
    status: status,
    startedAt: DateTime.utc(2026, 9, 1),
    completedAt: endedAt,
    endedAt: endedAt,
    progress: const [],
    createdAt: DateTime.utc(2026, 9, 1),
    updatedAt: endedAt ?? DateTime.utc(2026, 9, 1),
  );
}
