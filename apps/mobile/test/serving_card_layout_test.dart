import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/domain/serving_availability.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/serving_assignment_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/serving_availability_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('serving card stacks its Spanish status for large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 760);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: ServingAssignmentCard(
          assignment: _assignment,
          onConfirm: () {},
          onLeave: () {},
          onOpen: () {},
        ),
      ),
    );

    final title = find.text(_assignment.title);
    final status = find.byType(AppChip).first;
    expect(
      tester.getTopLeft(status).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('leave progress is shown on the matching action only', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        child: ServingAssignmentCard(
          assignment: _assignment,
          pendingAction: ServingAssignmentCardPendingAction.requestLeave,
          onConfirm: () {},
          onLeave: () {},
        ),
      ),
    );

    final buttons = tester
        .widgetList<AppButton>(find.byType(AppButton))
        .toList();
    expect(buttons, hasLength(2));
    expect(buttons.first.loading, isTrue);
    expect(buttons.last.loading, isFalse);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('an external serving action locks both card actions', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        child: ServingAssignmentCard(
          assignment: _assignment,
          pendingAction: ServingAssignmentCardPendingAction.external,
          onConfirm: () {},
          onLeave: () {},
        ),
      ),
    );

    final buttons = tester
        .widgetList<AppButton>(find.byType(AppButton))
        .toList();
    expect(buttons, hasLength(2));
    expect(buttons.every((button) => button.onPressed == null), isTrue);
    expect(buttons.every((button) => !button.loading), isTrue);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('availability card stacks preferred status for large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 520);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: ServingAvailabilityCard(record: _availability),
      ),
    );

    final date = find.textContaining('2026').first;
    final status = find.byType(AppChip).first;
    expect(
      tester.getTopLeft(status).dy,
      greaterThan(tester.getBottomLeft(date).dy),
    );
    expect(tester.takeException(), isNull);
  });
}

Widget _app({
  required Widget child,
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
        child: Padding(padding: const EdgeInsets.all(20), child: child),
      ),
    ),
  );
}

final _assignment = ServingAssignment(
  id: 'serving-1',
  teamName: 'Equipo de bienvenida',
  roleName: 'Coordinación de hospitalidad',
  title: 'Servicio dominical de bienvenida y acompañamiento',
  startsAt: DateTime.utc(2026, 11, 8, 17),
  endsAt: DateTime.utc(2026, 11, 8, 19),
  location: 'Santuario principal',
  status: 'swap_requested',
  note: '',
  responseNote: '',
);

final _availability = ServingAvailability(
  id: 'availability-1',
  startsAt: DateTime.utc(2026, 11, 8, 17),
  endsAt: DateTime.utc(2026, 11, 8, 19),
  status: 'preferred',
  note: 'Horario preferido para servir.',
);
