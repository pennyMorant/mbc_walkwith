import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/identity/external_user_identity_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/my_reading_plans_page.dart';
import 'package:mbc_walkwith/features/study/data/mock_reading_plan_repository.dart';
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
    expect(find.text('This plan has no daily references yet.'), findsOneWidget);
  });

  testWidgets('history detail error explains the failure and retries', (
    tester,
  ) async {
    var detailReads = 0;
    await tester.pumpWidget(
      ProviderScope(
        retry: (_, _) => null,
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => const [],
          ),
          readingPlanHistoryProvider.overrideWith(
            (ref) async => ReadingPlanAssignmentPage(
              items: [
                _assignment(title: 'Completed plan', status: 'completed'),
              ],
            ),
          ),
          readingPlanAssignmentDetailProvider.overrideWith((
            ref,
            assignmentId,
          ) async {
            detailReads += 1;
            throw const FormatException('Malformed detail.');
          }),
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

    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Completed plan'));
    await tester.pumpAndSettle();

    expect(find.text('Please refresh and try again.'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(detailReads, 1);

    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();
    expect(detailReads, 2);
  });

  testWidgets('tracks concurrent reading plan actions independently', (
    tester,
  ) async {
    final repository = _PendingReadingPlanRepository();
    final first = _assignment(
      id: 'assignment-1',
      planId: 'plan-1',
      title: 'First plan',
    );
    final second = _assignment(
      id: 'assignment-2',
      planId: 'plan-2',
      title: 'Second plan',
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => null),
          externalUserIdProvider.overrideWith((ref) async => 'ext-test'),
          readingPlanRepositoryProvider.overrideWithValue(repository),
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [first, second],
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

    await _pausePlan(tester, 0);
    expect(repository.pending, contains('assignment-1'));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await _pausePlan(tester, 0);
    expect(repository.pending, contains('assignment-2'));
    expect(find.byType(CircularProgressIndicator), findsNWidgets(2));

    repository.complete('assignment-1', first);
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    repository.complete('assignment-2', second);
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('discovers only published plans without an open assignment', (
    tester,
  ) async {
    final joinedPlan = _plan(id: 'plan-1', title: 'Already joined');
    final availablePlan = _plan(id: 'plan-2', title: 'Available plan');
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => [
              _assignment(title: joinedPlan.title, planId: joinedPlan.id),
            ],
          ),
          publishedReadingPlansProvider.overrideWith(
            (ref) async => [joinedPlan, availablePlan],
          ),
          readingPlanDaysProvider.overrideWith((ref, planId) async => const []),
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

    await tester.tap(find.byTooltip('Find plans'));
    await tester.pumpAndSettle();

    expect(find.text('Already joined'), findsOneWidget);
    expect(find.text('Available plan'), findsOneWidget);

    await tester.tap(find.text('Available plan'));
    await tester.pumpAndSettle();

    expect(find.text('Start'), findsOneWidget);
    expect(find.text('This plan has no daily references yet.'), findsOneWidget);
  });

  testWidgets('refreshes an empty reading plan catalog', (tester) async {
    var planReads = 0;
    final availablePlan = _plan(id: 'plan-2', title: 'Newly published plan');
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => const [],
          ),
          publishedReadingPlansProvider.overrideWith((ref) async {
            planReads += 1;
            return planReads == 1 ? const [] : [availablePlan];
          }),
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

    await tester.tap(find.byTooltip('Find plans'));
    await tester.pumpAndSettle();
    expect(
      find.text('There are no additional reading plans available right now.'),
      findsOneWidget,
    );

    await tester.drag(
      find.byKey(const ValueKey('reading-plan-catalog-empty-scroll')),
      const Offset(0, 300),
    );
    await tester.pumpAndSettle();

    expect(planReads, 2);
    expect(find.text('Newly published plan'), findsOneWidget);
  });

  testWidgets('ignores an old history page after the base page refreshes', (
    tester,
  ) async {
    final repository = _PendingHistoryReadingPlanRepository();
    var historyReads = 0;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => null),
          externalUserIdProvider.overrideWith((ref) async => 'ext-test'),
          readingPlanRepositoryProvider.overrideWithValue(repository),
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => const [],
          ),
          readingPlanHistoryProvider.overrideWith((ref) async {
            historyReads += 1;
            return ReadingPlanAssignmentPage(
              items: [
                _assignment(
                  id: historyReads == 1 ? 'old-base' : 'new-base',
                  title: historyReads == 1 ? 'Old base' : 'New base',
                  status: 'completed',
                ),
              ],
              nextCursor: historyReads == 1 ? 'old-cursor' : null,
            );
          }),
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

    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Load more'));
    await tester.pump();
    expect(repository.pendingHistoryPage, isNotNull);

    await tester.drag(find.byType(ListView), const Offset(0, 300));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('New base'), findsOneWidget);

    repository.completeHistoryPage(
      ReadingPlanAssignmentPage(
        items: [
          _assignment(
            id: 'stale-page',
            title: 'Stale page',
            status: 'completed',
          ),
        ],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('New base'), findsOneWidget);
    expect(find.text('Stale page'), findsNothing);
  });

  testWidgets('starts a discovered plan through the repository', (
    tester,
  ) async {
    final repository = _RecordingReadingPlanRepository();
    final availablePlan = _plan(id: 'plan-2', title: 'Available plan');
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => null),
          externalUserIdProvider.overrideWith((ref) async => 'ext-test'),
          readingPlanRepositoryProvider.overrideWithValue(repository),
          activeReadingPlanAssignmentsProvider.overrideWith(
            (ref) async => const [],
          ),
          publishedReadingPlansProvider.overrideWith(
            (ref) async => [availablePlan],
          ),
          readingPlanDaysProvider.overrideWith((ref, planId) async => const []),
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

    await tester.tap(find.byTooltip('Find plans'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Available plan'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start'));
    await tester.pumpAndSettle();

    expect(repository.assignedPlanIds, ['plan-2']);
  });
}

Future<void> _pausePlan(WidgetTester tester, int menuIndex) async {
  await tester.tap(find.byIcon(Icons.more_vert).at(menuIndex));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
  await tester.tap(find.text('Pause').last);
  await tester.pump();
}

ReadingPlanAssignment _assignment({
  required String title,
  String? id,
  String planId = 'plan-1',
  String status = 'active',
  int attemptNumber = 1,
}) {
  final endedAt = status == 'completed' ? DateTime.utc(2026, 9, 7) : null;
  return ReadingPlanAssignment(
    id: id ?? '$status-$attemptNumber',
    planId: planId,
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

ReadingPlan _plan({required String id, required String title}) {
  return ReadingPlan(
    id: id,
    title: title,
    description: 'A published reading plan.',
    status: 'published',
    visibility: 'public',
    locale: 'en',
    durationDays: 7,
    createdAt: DateTime.utc(2026, 9, 1),
    updatedAt: DateTime.utc(2026, 9, 1),
  );
}

class _PendingReadingPlanRepository extends MockReadingPlanRepository {
  final Map<String, Completer<ReadingPlanAssignment>> pending = {};

  @override
  Future<ReadingPlanAssignment> updateAssignmentStatus({
    required String assignmentId,
    required String status,
    required ReadingPlanIdentity identity,
  }) {
    final completer = Completer<ReadingPlanAssignment>();
    pending[assignmentId] = completer;
    return completer.future;
  }

  void complete(String assignmentId, ReadingPlanAssignment assignment) {
    pending.remove(assignmentId)!.complete(assignment);
  }
}

class _RecordingReadingPlanRepository extends MockReadingPlanRepository {
  final List<String> assignedPlanIds = [];

  @override
  Future<ReadingPlanAssignment> selfAssign(
    String planId,
    ReadingPlanIdentity identity,
  ) async {
    assignedPlanIds.add(planId);
    return _assignment(title: 'Available plan', planId: planId);
  }
}

class _PendingHistoryReadingPlanRepository extends MockReadingPlanRepository {
  Completer<ReadingPlanAssignmentPage>? pendingHistoryPage;

  @override
  Future<ReadingPlanAssignmentPage> listMyAssignments(
    ReadingPlanIdentity identity, {
    String? scope,
    int? limit,
    String? cursor,
  }) {
    final completer = Completer<ReadingPlanAssignmentPage>();
    pendingHistoryPage = completer;
    return completer.future;
  }

  void completeHistoryPage(ReadingPlanAssignmentPage page) {
    pendingHistoryPage!.complete(page);
    pendingHistoryPage = null;
  }
}
