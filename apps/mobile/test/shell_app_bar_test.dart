import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/shell/widgets/shell_app_bar.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/utils/date_period.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/shared/widgets/period_picker_button.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('shell app bar fits a period action with larger text', (
    tester,
  ) async {
    await _pumpShellAppBar(
      tester,
      title: 'Sermons',
      actions: [
        PeriodPickerButton(
          period: DatePeriod.fromDate(
            mode: DatePeriodMode.month,
            date: DateTime(2026, 10),
          ),
          labelBuilder: (context, period) => 'Oct',
          onChanged: (_) {},
        ),
      ],
    );

    expect(find.text('Sermons'), findsOneWidget);
    expect(find.text('Oct'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('shell app bar fits Life actions with larger text', (
    tester,
  ) async {
    await _pumpShellAppBar(
      tester,
      title: 'Church Life',
      actions: [
        IconButton(
          tooltip: 'Scan event check-in code',
          onPressed: () {},
          icon: const Icon(Icons.qr_code_scanner_outlined),
        ),
        const AppChip(label: 'This week', variant: AppChipVariant.filled),
      ],
    );

    expect(find.text('Church Life'), findsOneWidget);
    expect(find.text('This week'), findsOneWidget);
    expect(find.byIcon(Icons.qr_code_scanner_outlined), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpShellAppBar(
  WidgetTester tester, {
  required String title,
  required List<Widget> actions,
}) async {
  tester.view.physicalSize = const Size(320, 640);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    MaterialApp(
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context)
            .copyWith(textScaler: const TextScaler.linear(1.3)),
        child: child!,
      ),
      home: Scaffold(
        appBar: ShellAppBar(title: title, actions: actions),
        body: const SizedBox.expand(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}
