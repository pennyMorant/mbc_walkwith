import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/settings/app_text_scale_provider.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/preference_display_section.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('appearance control reflows for large localized text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    ThemeMode? changedMode;
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('es'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: const TextScaler.linear(1.3)),
          child: child!,
        ),
        home: Scaffold(
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: PreferenceAppearanceControl(
              themeMode: ThemeMode.system,
              onChanged: (mode) => changedMode = mode,
            ),
          ),
        ),
      ),
    );

    final control = tester.widget<SegmentedButton<ThemeMode>>(
      find.byType(SegmentedButton<ThemeMode>),
    );
    expect(control.direction, Axis.vertical);
    expect(find.text('Sistema'), findsOneWidget);
    expect(find.text('Claro'), findsOneWidget);
    expect(find.text('Oscuro'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Oscuro'));
    await tester.pump();
    expect(changedMode, ThemeMode.dark);
  });

  testWidgets('appearance control stays horizontal at standard size', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 360,
              child: PreferenceAppearanceControl(
                themeMode: ThemeMode.system,
                onChanged: (_) {},
              ),
            ),
          ),
        ),
      ),
    );

    final control = tester.widget<SegmentedButton<ThemeMode>>(
      find.byType(SegmentedButton<ThemeMode>),
    );
    expect(control.direction, Axis.horizontal);
    expect(tester.takeException(), isNull);
  });

  testWidgets('text scale header stacks Spanish labels on a narrow view', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      _textScaleApp(
        textScaler: const TextScaler.linear(1.3),
        child: PreferenceTextScaleControl(
          textScale: AppTextScale.extraLarge,
          onChanged: (_) {},
        ),
      ),
    );

    final title = find.text('Tamaño del texto');
    final value = find.text('Muy grande');
    expect(
      tester.getTopLeft(value).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('text scale header remains inline when space allows', (
    tester,
  ) async {
    await tester.pumpWidget(
      _textScaleApp(
        width: 560,
        child: PreferenceTextScaleControl(
          textScale: AppTextScale.extraLarge,
          onChanged: (_) {},
        ),
      ),
    );

    expect(
      tester.getCenter(find.text('Tamaño del texto')).dy,
      tester.getCenter(find.text('Muy grande')).dy,
    );
  });
}

Widget _textScaleApp({
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
