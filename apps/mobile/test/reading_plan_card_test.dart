import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reading_plan_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('reading plan card reflows and keeps its continue action', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var continueCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('es'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: const TextScaler.linear(2)),
          child: child!,
        ),
        home: Scaffold(
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ReadingPlanCard(
              plan: _plan,
              assignment: _assignment,
              onTap: () {},
              onContinue: () => continueCount += 1,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('7 días'), findsOneWidget);
    expect(find.text('0/7 completados'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Continuar'));
    await tester.pump();
    expect(continueCount, 1);
  });
}

final _plan = ReadingPlan(
  id: 'plan-1',
  title: 'Caminar con Jesús cada día',
  description: 'Un plan de lectura para crecer en la fe.',
  status: 'published',
  visibility: 'public',
  locale: 'es',
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
