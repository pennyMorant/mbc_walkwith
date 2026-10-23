import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/mine_reading_plan_card.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('reading plan summary stacks Spanish progress on narrow view', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: const MineReadingPlanAssignmentRow(assignment: _assignment),
      ),
    );

    final title = find.text(_assignment.planTitle);
    final chip = find.byType(AppChip);
    expect(chip, findsOneWidget);
    expect(
      tester.getTopLeft(chip).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('reading plan summary remains inline when space allows', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        width: 560,
        child: const MineReadingPlanAssignmentRow(assignment: _assignment),
      ),
    );

    expect(
      tester.getCenter(find.text(_assignment.planTitle)).dy,
      tester.getCenter(find.byType(AppChip)).dy,
    );
  });
}

Widget _app({
  required Widget child,
  double? width,
  TextScaler textScaler = TextScaler.noScaling,
}) {
  return MaterialApp(
    locale: const Locale('es'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    builder: (context, appChild) => MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaler: textScaler),
      child: appChild!,
    ),
    home: Scaffold(
      body: Center(
        child: SizedBox(
          width: width,
          child: Padding(padding: const EdgeInsets.all(20), child: child),
        ),
      ),
    ),
  );
}

const _assignment = ReadingPlanAssignment(
  id: 'assignment-1',
  planId: 'plan-1',
  planTitle: 'Un camino de lectura suficientemente largo para dos líneas',
  planDurationDays: 30,
  attemptNumber: 1,
  userType: 'external',
  userId: 'external-test',
  sourceType: 'self',
  sourceId: null,
  status: 'active',
  startedAt: null,
  completedAt: null,
  endedAt: null,
  progress: [],
  createdAt: null,
  updatedAt: null,
);
