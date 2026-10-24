import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/data/reading_plan_repository.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reading_plan_detail_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('reading plan detail scrolls long content at large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [_assignment],
          ),
          readingPlanDaysProvider.overrideWith((ref, planId) async => [_day]),
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
            body: ReadingPlanDetailSheet(plan: _plan, onOpenReference: (_) {}),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    await tester.scrollUntilVisible(
      find.text('Read'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    expect(find.text('Read'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

final _plan = ReadingPlan(
  id: 'plan-1',
  title: 'Walking faithfully with Jesus through every season of life',
  description:
      'A carefully prepared reading plan with enough detail to wrap across '
      'several lines when the reader uses a larger accessibility font size.',
  status: 'published',
  visibility: 'public',
  locale: 'en',
  durationDays: 7,
  createdAt: DateTime.utc(2026, 9, 1),
  updatedAt: DateTime.utc(2026, 9, 1),
);

final _assignment = ReadingPlanAssignment(
  id: 'assignment-1',
  planId: _plan.id,
  planTitle: _plan.title,
  planDurationDays: _plan.durationDays,
  attemptNumber: 1,
  userType: 'external',
  userId: 'ext-test',
  sourceType: 'self',
  sourceId: null,
  status: 'active',
  startedAt: DateTime.utc(2026, 9, 1),
  completedAt: null,
  endedAt: null,
  progress: const [],
  createdAt: DateTime.utc(2026, 9, 1),
  updatedAt: DateTime.utc(2026, 9, 1),
);

final _day = ReadingPlanDay(
  id: 'day-1',
  planId: _plan.id,
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
);
