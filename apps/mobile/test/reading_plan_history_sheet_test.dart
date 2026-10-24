import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/reading_plan_history_sheet.dart';
import 'package:mbc_walkwith/features/study/data/reading_plan_repository.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('history detail scrolls long content at large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var restarted = false;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          readingPlanAssignmentDetailProvider.overrideWith(
            (ref, assignmentId) async => _detail,
          ),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(2)),
            child: child!,
          ),
          home: Scaffold(
            body: ReadingPlanHistorySheet(
              assignmentId: _assignment.id,
              onRestart: (_) => restarted = true,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.text('Start again'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text('The Word became flesh'), findsOneWidget);
    await tester.tap(find.text('Start again'));
    expect(restarted, isTrue);
    expect(tester.takeException(), isNull);
  });
}

final _assignment = ReadingPlanAssignment(
  id: 'assignment-1',
  planId: 'plan-1',
  planTitle: 'Walking faithfully with Jesus through every season of life',
  planDurationDays: 30,
  attemptNumber: 3,
  userType: 'external',
  userId: 'ext-test',
  sourceType: 'self',
  sourceId: null,
  status: 'completed',
  startedAt: DateTime.utc(2026, 9, 1),
  completedAt: DateTime.utc(2026, 9, 30),
  endedAt: DateTime.utc(2026, 9, 30),
  progress: const [
    ReadingPlanDayProgress(
      id: 'progress-1',
      assignmentId: 'assignment-1',
      dayId: 'day-1',
      status: 'completed',
      note: 'A reflection that remains readable with accessibility text.',
      completedAt: null,
      updatedAt: null,
    ),
  ],
  createdAt: DateTime.utc(2026, 9, 1),
  updatedAt: DateTime.utc(2026, 9, 30),
);

final _detail = ReadingPlanAssignmentDetail(
  assignment: _assignment,
  days: [
    ReadingPlanDay(
      id: 'day-1',
      planId: 'plan-1',
      dayNumber: 1,
      title: 'The Word became flesh',
      description: 'Read and reflect on the opening witness of John.',
      references: const [
        ScriptureReference(
          bookId: 'JHN',
          chapter: 1,
          startVerse: 1,
          endVerse: 5,
          referenceLabel: 'John 1:1-5',
        ),
      ],
      createdAt: DateTime.utc(2026, 9, 1),
      updatedAt: DateTime.utc(2026, 9, 1),
    ),
  ],
  canRestart: true,
);
