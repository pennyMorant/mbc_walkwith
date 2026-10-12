import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/mine_reading_plan_card.dart';
import 'package:mbc_walkwith/features/study/data/reading_plan_repository.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reading_plan_detail_sheet.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reading_plan_section.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('plan section stays hidden when no personal plans exist', (
    tester,
  ) async {
    var planReads = 0;
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          publishedReadingPlansProvider.overrideWith((ref) async {
            planReads += 1;
            return [_plan];
          }),
          activeReadingPlanAssignmentsProvider.overrideWith((ref) async {
            return const [];
          }),
        ],
        child: CustomScrollView(
          slivers: [ReadingPlanSection(onOpenReference: (_) {})],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('My reading plan'), findsNothing);
    expect(find.byType(Card), findsNothing);
    expect(planReads, 0);
  });

  testWidgets('plan section shows only an in-progress personal plan', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          publishedReadingPlansProvider.overrideWith((ref) async => [_plan]),
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [_assignment()],
          ),
        ],
        child: CustomScrollView(
          slivers: [ReadingPlanSection(onOpenReference: (_) {})],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('My reading plan'), findsOneWidget);
    expect(find.text('Walk with Jesus'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);
    expect(find.text('Start'), findsNothing);
  });

  testWidgets('completed personal plans stay off the Study home', (
    tester,
  ) async {
    var planReads = 0;
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          publishedReadingPlansProvider.overrideWith((ref) async {
            planReads += 1;
            return [_plan];
          }),
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [_assignment(status: 'completed')],
          ),
        ],
        child: CustomScrollView(
          slivers: [ReadingPlanSection(onOpenReference: (_) {})],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('My reading plan'), findsNothing);
    expect(find.byType(Card), findsNothing);
    expect(planReads, 0);
  });

  testWidgets('plan section keeps assignment failures visible', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => throw const FormatException('Malformed assignment.'),
          ),
        ],
        child: CustomScrollView(
          slivers: [ReadingPlanSection(onOpenReference: (_) {})],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Reading plans failed to load'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(find.text('Start'), findsNothing);
  });

  testWidgets('plan detail does not expose actions when assignments fail', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => throw const FormatException('Malformed assignment.'),
          ),
          readingPlanDaysProvider.overrideWith((ref, planId) async => [_day]),
        ],
        child: ReadingPlanDetailSheet(plan: _plan, onOpenReference: (_) {}),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Retry'), findsOneWidget);
    expect(find.text('Start'), findsNothing);
    expect(find.text('Read'), findsNothing);
    expect(find.text('Complete'), findsNothing);
  });

  testWidgets('mine card keeps assignment contract failures visible', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          publishedReadingPlansProvider.overrideWith((ref) async => [_plan]),
          myReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => throw const FormatException('Malformed assignment.'),
          ),
        ],
        child: const MineReadingPlanCard(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Please refresh and try again.'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(
      find.text('Start a plan from Study to keep your progress here.'),
      findsNothing,
    );
    expect(find.text('Open Study'), findsNothing);
  });

  testWidgets('mine card keeps an entry when no personal plans exist', (
    tester,
  ) async {
    var planReads = 0;
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          publishedReadingPlansProvider.overrideWith((ref) async {
            planReads += 1;
            return [_plan];
          }),
          myReadingPlanAssignmentsProvider.overrideWith((ref) async => []),
        ],
        child: const MineReadingPlanCard(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('My reading plans'), findsOneWidget);
    expect(find.byType(Card), findsOneWidget);
    expect(find.text('Open Study'), findsOneWidget);
    expect(planReads, 0);
  });
}

Widget _localizedApp({
  required List<Override> overrides,
  required Widget child,
}) {
  return ProviderScope(
    retry: (_, _) => null,
    overrides: overrides,
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: Scaffold(body: child),
    ),
  );
}

final _plan = ReadingPlan(
  id: 'plan_1',
  title: 'Walk with Jesus',
  description: 'A seven-day reading plan.',
  status: 'published',
  visibility: 'public',
  locale: 'en',
  durationDays: 7,
  createdAt: DateTime.utc(2026, 1, 1),
  updatedAt: DateTime.utc(2026, 1, 1),
);

final _day = ReadingPlanDay(
  id: 'day_1',
  planId: 'plan_1',
  dayNumber: 1,
  title: 'Follow Jesus',
  description: 'Read and reflect.',
  references: const [
    ScriptureReference(
      bookId: 'JHN',
      chapter: 1,
      startVerse: 35,
      endVerse: 42,
      referenceLabel: 'John 1:35-42',
    ),
  ],
  createdAt: DateTime.utc(2026, 1, 1),
  updatedAt: DateTime.utc(2026, 1, 1),
);

ReadingPlanAssignment _assignment({String status = 'active'}) {
  return ReadingPlanAssignment(
    id: 'assignment_1',
    planId: _plan.id,
    planTitle: _plan.title,
    planDurationDays: _plan.durationDays,
    attemptNumber: 1,
    userType: 'external',
    userId: 'ext_test',
    sourceType: 'self',
    sourceId: null,
    status: status,
    startedAt: DateTime.utc(2026, 1, 1),
    completedAt: status == 'completed' ? DateTime.utc(2026, 1, 7) : null,
    endedAt: status == 'completed' ? DateTime.utc(2026, 1, 7) : null,
    progress: const [],
    createdAt: DateTime.utc(2026, 1, 1),
    updatedAt: DateTime.utc(2026, 1, 1),
  );
}
