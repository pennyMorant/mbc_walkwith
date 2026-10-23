import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/member_profile_year_fields.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('profile year fields stack for Spanish large text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final faithController = TextEditingController();
    final baptizedController = TextEditingController();
    addTearDown(faithController.dispose);
    addTearDown(baptizedController.dispose);

    await tester.pumpWidget(
      _app(
        textScaler: const TextScaler.linear(1.3),
        child: MemberProfileYearFields(
          faithYearController: faithController,
          baptizedYearController: baptizedController,
          enabled: true,
        ),
      ),
    );

    final fields = find.byType(TextField);
    expect(fields, findsNWidgets(2));
    expect(
      tester.getTopLeft(fields.at(1)).dy,
      greaterThan(tester.getTopLeft(fields.at(0)).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('profile year fields remain side by side when space allows', (
    tester,
  ) async {
    final faithController = TextEditingController();
    final baptizedController = TextEditingController();
    addTearDown(faithController.dispose);
    addTearDown(baptizedController.dispose);

    await tester.pumpWidget(
      _app(
        child: SizedBox(
          width: 560,
          child: MemberProfileYearFields(
            faithYearController: faithController,
            baptizedYearController: baptizedController,
            enabled: true,
          ),
        ),
      ),
    );

    final fields = find.byType(TextField);
    expect(fields, findsNWidgets(2));
    expect(
      tester.getTopLeft(fields.at(1)).dy,
      tester.getTopLeft(fields.at(0)).dy,
    );
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
      body: Padding(padding: const EdgeInsets.all(20), child: child),
    ),
  );
}
