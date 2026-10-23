import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/secondary_app_bar.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('secondary app bar constrains title with four reader actions', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    var backPressed = false;
    await tester.pumpWidget(
      _app(
        SecondaryAppBar(
          title: 'Génesis 1',
          onBack: () => backPressed = true,
          actions: [
            for (final icon in const [
              Icons.person_search,
              Icons.travel_explore,
              Icons.format_list_numbered,
              Icons.text_fields,
            ])
              IconButton(onPressed: _noop, icon: Icon(icon)),
          ],
        ),
      ),
    );

    final title = tester.widget<Text>(find.text('Génesis 1'));
    expect(title.maxLines, 1);
    expect(title.overflow, TextOverflow.ellipsis);
    expect(tester.takeException(), isNull);

    final backTooltip = MaterialLocalizations.of(
      tester.element(find.byType(SecondaryAppBar)),
    ).backButtonTooltip;
    expect(find.byTooltip(backTooltip), findsOneWidget);
    await tester.tap(find.byTooltip(backTooltip));
    expect(backPressed, isTrue);
  });
}

Widget _app(PreferredSizeWidget appBar) {
  return MaterialApp(
    locale: const Locale('es'),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context)
          .copyWith(textScaler: const TextScaler.linear(1.3)),
      child: child!,
    ),
    home: Scaffold(appBar: appBar),
  );
}

void _noop() {}
