import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/discipleship/data/discipleship_repository.dart';
import 'package:mbc_walkwith/features/discipleship/domain/discipleship_assignment.dart';
import 'package:mbc_walkwith/features/discipleship/presentation/widgets/mine_discipleship_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('discipleship summary stacks status on narrow large-text view', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(_app(textScaler: const TextScaler.linear(1.3)));
    await tester.pumpAndSettle();

    final title = find.text(_assignment.journeyTitle);
    final status = find.byType(AppChip).first;
    expect(
      tester.getTopLeft(status).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(find.text(_assignment.assigneeName), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('discipleship summary remains inline when space allows', (
    tester,
  ) async {
    await tester.pumpWidget(_app(width: 560));
    await tester.pumpAndSettle();

    expect(
      tester.getCenter(find.text(_assignment.journeyTitle)).dy,
      tester.getCenter(find.byType(AppChip).first).dy,
    );
    expect(tester.takeException(), isNull);
  });
}

Widget _app({double? width, TextScaler textScaler = TextScaler.noScaling}) {
  return ProviderScope(
    overrides: [
      myDiscipleshipAssignmentsProvider.overrideWith(
        (ref) async => [_assignment],
      ),
    ],
    child: MaterialApp(
      locale: const Locale('es'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: textScaler),
        child: child!,
      ),
      home: Scaffold(
        body: Center(
          child: SizedBox(
            width: width,
            child: const Padding(
              padding: EdgeInsets.all(20),
              child: MineDiscipleshipCard(),
            ),
          ),
        ),
      ),
    ),
  );
}

final _now = DateTime(2026, 11);

final _assignment = DiscipleshipAssignment(
  id: 'assignment-1',
  journeyId: 'journey-1',
  journeyTitle: 'Un camino de discipulado suficientemente largo',
  assigneeName: 'Equipo pastoral de acompañamiento y cuidado',
  status: 'not_started',
  startedAt: null,
  completedAt: null,
  taskTotalCount: 8,
  completedTaskCount: 2,
  progress: const [],
  createdAt: _now,
  updatedAt: _now,
);
