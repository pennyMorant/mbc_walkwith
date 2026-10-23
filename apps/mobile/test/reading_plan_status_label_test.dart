import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/reading_plan_assignment_card.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('unknown reading plan statuses use a localized fallback', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: Scaffold(
          body: ReadingPlanAssignmentCard(
            assignment: _assignment(status: 'requires_review'),
            onTap: () {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Unknown status'), findsOneWidget);
    expect(find.text('requires_review'), findsNothing);
  });

  testWidgets('busy reading plan card shows progress and disables actions', (
    tester,
  ) async {
    var tapCount = 0;
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: Scaffold(
          body: ReadingPlanAssignmentCard(
            assignment: _assignment(status: 'active'),
            busy: true,
            onTap: () => tapCount += 1,
            onPause: () {},
          ),
        ),
      ),
    );
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.byType(PopupMenuButton), findsNothing);

    await tester.tap(find.text('Reading plan'));
    await tester.pump();
    expect(tapCount, 0);
  });
}

ReadingPlanAssignment _assignment({required String status}) {
  return ReadingPlanAssignment(
    id: 'assignment-1',
    planId: 'plan-1',
    planTitle: 'Reading plan',
    planDurationDays: 7,
    attemptNumber: 1,
    userType: 'external',
    userId: 'ext-test',
    sourceType: 'self',
    sourceId: null,
    status: status,
    startedAt: DateTime.utc(2026, 9, 1),
    completedAt: null,
    endedAt: null,
    progress: const [],
    createdAt: DateTime.utc(2026, 9, 1),
    updatedAt: DateTime.utc(2026, 9, 1),
  );
}
