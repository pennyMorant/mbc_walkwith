import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/utils/date_period.dart';
import 'package:mbc_walkwith/shared/widgets/period_selector_sheet.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('month selector is direct and returns a month on tap', (
    tester,
  ) async {
    DatePeriod? selectedPeriod;

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: Scaffold(
          body: Builder(
            builder: (context) => FilledButton(
              onPressed: () async {
                selectedPeriod = await showPeriodSelectorSheet(
                  context,
                  DatePeriod.fromDate(
                    mode: DatePeriodMode.month,
                    date: DateTime(2026, 6, 1),
                  ),
                );
              },
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.text('Choose month'), findsNothing);
    expect(find.text('This month'), findsNothing);
    expect(find.text('Current'), findsNothing);
    expect(find.text('Apply'), findsNothing);
    expect(find.text('2026'), findsOneWidget);

    await tester.tap(find.byTooltip('Next'));
    await tester.pump();
    expect(find.text('2027'), findsOneWidget);

    await tester.tap(find.text('Jul'));
    await tester.pumpAndSettle();

    expect(selectedPeriod?.start, DateTime(2027, 7));
  });
}
