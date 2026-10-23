import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/widgets/preference_system_section.dart';
import 'package:mbc_walkwith/features/study/domain/bible_translation.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  final cases = <({Locale locale, String languageName})>[
    (locale: const Locale('en'), languageName: 'English'),
    (locale: const Locale('es'), languageName: 'Español'),
    (
      locale: const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans'),
      languageName: '简体中文',
    ),
    (
      locale: const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
      languageName: '繁體中文',
    ),
  ];

  for (final testCase in cases) {
    testWidgets(
      'language preference shows ${testCase.languageName} instead of a code',
      (tester) async {
        await tester.pumpWidget(
          _app(
            locale: testCase.locale,
            child: PreferenceLanguageControl(
              locale: testCase.locale,
              translation: BibleTranslation.fromLocale(testCase.locale),
              onOpenSettings: () {},
            ),
          ),
        );

        expect(find.textContaining(testCase.languageName), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );
  }

  testWidgets('language preference resolves traditional Chinese regions', (
    tester,
  ) async {
    const locale = Locale('zh', 'TW');
    await tester.pumpWidget(
      _app(
        locale: locale,
        child: PreferenceLanguageControl(
          locale: locale,
          translation: BibleTranslation.fromLocale(locale),
          onOpenSettings: () {},
        ),
      ),
    );

    expect(find.textContaining('繁體中文'), findsOneWidget);
  });
}

Widget _app({required Locale locale, required Widget child}) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(
      body: Padding(padding: const EdgeInsets.all(20), child: child),
    ),
  );
}
