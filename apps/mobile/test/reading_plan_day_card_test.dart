import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/reading_plan.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reading_plan_day_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('reading plan day metadata reflows without a duplicate title', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

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
            child: ReadingPlanDayCard(
              day: _day(),
              completed: true,
              busy: false,
              canComplete: false,
              onRead: () {},
              onComplete: null,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Día 1'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

ReadingPlanDay _day() {
  return ReadingPlanDay(
    id: 'day-1',
    planId: 'plan-1',
    dayNumber: 1,
    title: '',
    description: 'Lectura diaria',
    references: const [
      ScriptureReference(
        bookId: 'JHN',
        chapter: 1,
        startVerse: 1,
        endVerse: 5,
        referenceLabel: 'Juan 1:1-5',
      ),
    ],
    createdAt: DateTime.utc(2026, 9, 1),
    updatedAt: DateTime.utc(2026, 9, 1),
  );
}
